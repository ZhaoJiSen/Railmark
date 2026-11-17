package railmark

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func git(ctx context.Context, path string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()
	output, err := gitCommand(ctx, path, args...).Output()
	return string(output), err
}

func gitCommand(ctx context.Context, path string, args ...string) *exec.Cmd {
	options := []string{"--no-optional-locks", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", "-C", path}
	binary, err := exec.LookPath("git")
	if err != nil {
		binary = "/usr/bin/git"
	}
	cmd := exec.CommandContext(ctx, binary, append(options, args...)...)
	for _, entry := range os.Environ() {
		if !strings.HasPrefix(entry, "GIT_") && !strings.HasPrefix(entry, "LC_ALL=") {
			cmd.Env = append(cmd.Env, entry)
		}
	}
	cmd.Env = append(cmd.Env, "LC_ALL=C", "GIT_NO_LAZY_FETCH=1", "GIT_TERMINAL_PROMPT=0", "GIT_OPTIONAL_LOCKS=0")
	return cmd
}

func gitLine(value string) string {
	return strings.TrimSuffix(value, "\n")
}

func remoteURL(ctx context.Context, path string) string {
	out, err := git(ctx, path, "remote", "get-url", "origin")
	if err != nil {
		return ""
	}
	remote := gitLine(out)
	if strings.Contains(remote, "://") {
		u, err := url.Parse(remote)
		if err != nil {
			return ""
		}
		u.User = nil
		u.RawQuery, u.Fragment, u.RawFragment, u.ForceQuery = "", "", "", false
		return u.String()
	}
	if filepath.IsAbs(remote) {
		return filepath.Clean(remote)
	}
	if strings.Contains(remote, ":") {
		return remote
	}
	return filepath.Clean(filepath.Join(path, remote))
}

func InspectGit(ctx context.Context, d Directory, base string, details bool) GitSnapshot {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	state := GitSnapshot{
		DirectoryID: d.ID, CheckedAt: stamp(), Commits: []GitCommit{},
		ReleaseCommits: []GitCommit{}, Branches: []GitBranch{},
	}
	if state.Issue = gitDirectoryIssue(ctx, d.Path); state.Issue != "" {
		return state
	}
	status, err := git(ctx, d.Path, "status", "--branch", "--porcelain=v2", "--no-renames", "--untracked-files=normal", "-z")
	if err != nil {
		state.Issue = "无法读取 Git 工作区状态"
		return state
	}

	parseGitStatus(status, &state)
	if state.Branch != "" {
		if out, err := git(ctx, d.Path, "rev-parse", "--symbolic-full-name", "@{push}"); err == nil {
			target := gitLine(out)
			state.PushTarget = strings.TrimPrefix(strings.TrimPrefix(target, "refs/remotes/"), "refs/heads/")
		}
	}
	if !details {
		return state
	}

	state.Remote = remoteURL(ctx, d.Path)
	state.Branches, state.BranchesIssue = listGitBranches(ctx, d.Path)
	if state.Head != "" {
		state.Commits, state.MoreCommits, err = gitCommits(ctx, d.Path, state.Head, gitHistoryLimit, 0)
		if err != nil {
			state.HistoryIssue = "无法读取当前分支的提交"
		}
	}
	if base != "" {
		comparison := compareGitHistory(ctx, d.Path, state.Head, base)
		state.ReleaseBase, state.ReleaseCommits, state.MoreRelease, state.BaseIssue =
			comparison.Base, comparison.Commits, comparison.More, comparison.Issue
	}
	return state
}

func gitDirectoryIssue(ctx context.Context, path string) string {
	if _, err := canonicalDirectory(path); err != nil {
		return "项目目录无法访问"
	}
	root, err := git(ctx, path, "rev-parse", "--show-toplevel")
	if err != nil || gitLine(root) != path {
		return "该目录没有可读取的 Git 仓库"
	}
	return ""
}

func parseGitStatus(output string, state *GitSnapshot) {
	for record := range strings.SplitSeq(output, "\x00") {
		switch {
		case strings.HasPrefix(record, "# branch.head "):
			if branch := strings.TrimPrefix(record, "# branch.head "); branch != "(detached)" {
				state.Branch = branch
			}
		case strings.HasPrefix(record, "# branch.oid "):
			if head := strings.TrimPrefix(record, "# branch.oid "); head != "(initial)" {
				state.Head = head
			}
		case strings.HasPrefix(record, "# branch.upstream "):
			state.Upstream = strings.TrimPrefix(record, "# branch.upstream ")
		case strings.HasPrefix(record, "# branch.ab "):
			n, _ := fmt.Sscanf(strings.TrimPrefix(record, "# branch.ab "), "+%d -%d", &state.Ahead, &state.Behind)
			state.TrackingKnown = n == 2
		case strings.HasPrefix(record, "1 ") && len(record) > 3:
			if record[2] != '.' {
				state.Staged++
			}
			if record[3] != '.' {
				state.Unstaged++
			}
		case strings.HasPrefix(record, "? "):
			state.Untracked++
		case strings.HasPrefix(record, "u "):
			state.Conflicted++
		}
	}
}

func compareGitHistory(ctx context.Context, path, head, base string) GitComparison {
	result := GitComparison{Commits: []GitCommit{}}
	if head == "" {
		result.Issue = "当前分支还没有提交"
		return result
	}

	output, err := git(ctx, path, "rev-parse", "--verify", "--end-of-options", base+"^{commit}")
	if err != nil {
		result.Issue = "本地找不到目标合入分支 " + base
		return result
	}
	baseHash := gitLine(output)
	commits, more, err := gitCommits(ctx, path, baseHash+".."+head, gitHistoryLimit, 0)
	if err != nil {
		result.Issue = "无法读取相对目标分支的提交"
		return result
	}
	return GitComparison{Base: baseHash, Commits: commits, More: more}
}

func gitCommits(ctx context.Context, path, revision string, limit, offset int) ([]GitCommit, bool, error) {
	out, err := git(ctx, path, "log", "-n", strconv.Itoa(limit+1), "--skip="+strconv.Itoa(offset), "-z",
		"--format=%H%x00%h%x00%aI%x00%an%x00%s%x00%b%x00%p", revision, "--")
	commits := []GitCommit{}
	if err != nil {
		return commits, false, err
	}
	const fieldsPerCommit = 7
	for fields := strings.Split(out, "\x00"); len(fields) > fieldsPerCommit; fields = fields[fieldsPerCommit:] {
		if len(commits) == limit {
			return commits, true, nil
		}
		commits = append(commits, GitCommit{
			FullHash: fields[0], Hash: fields[1], Date: fields[2], Author: fields[3],
			Subject: fields[4], Body: strings.TrimSpace(fields[5]), Parents: fields[6],
		})
	}
	return commits, false, nil
}
