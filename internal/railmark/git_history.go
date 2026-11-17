package railmark

import (
	"context"
	"encoding/hex"
	"errors"
	"strings"
)

const gitHistoryLimit = 40

func listGitBranches(ctx context.Context, path string) ([]GitBranch, string) {
	branches := []GitBranch{}
	out, err := git(ctx, path, "for-each-ref", "--sort=refname", "--format=%(refname)%09%(symref)", "refs/heads/", "refs/remotes/")
	if err != nil {
		return branches, "无法读取本地分支列表"
	}
	for line := range strings.SplitSeq(out, "\n") {
		ref, target, ok := strings.Cut(line, "\t")
		if !ok || target != "" {
			continue
		}
		prefix := "refs/heads/"
		remote := strings.HasPrefix(ref, "refs/remotes/")
		if remote {
			prefix = "refs/remotes/"
		}
		branches = append(branches, GitBranch{Ref: ref, Name: strings.TrimPrefix(ref, prefix), Remote: remote})
	}
	return branches, ""
}

func ReadGitHistory(ctx context.Context, d Directory, ref, base string) (GitHistory, error) {
	if !strings.HasPrefix(ref, "refs/heads/") && !strings.HasPrefix(ref, "refs/remotes/") {
		return GitHistory{}, errors.New("请选择本地分支或远程跟踪分支")
	}
	if issue := gitDirectoryIssue(ctx, d.Path); issue != "" {
		return GitHistory{}, errors.New(issue)
	}
	hash, err := git(ctx, d.Path, "show-ref", "--verify", "--hash", "--", ref)
	if err != nil {
		return GitHistory{}, errors.New("本地找不到该分支，请刷新分支列表")
	}
	history := GitHistory{Head: gitLine(hash)}
	history.Commits, history.More, err = gitCommits(ctx, d.Path, history.Head, gitHistoryLimit, 0)
	if err != nil {
		return GitHistory{}, errors.New("无法读取该分支的提交")
	}
	if base != "" {
		comparison := compareGitHistory(ctx, d.Path, history.Head, base)
		history.Comparison = &comparison
	}
	return history, nil
}

// ReadGitHistoryPage uses the original commit IDs so moving a branch cannot shift page boundaries.
func ReadGitHistoryPage(ctx context.Context, d Directory, head, exclude string, offset int) (GitHistory, error) {
	if !validGitObjectID(head) || exclude != "" && !validGitObjectID(exclude) || offset < 0 {
		return GitHistory{}, errors.New("无效的提交历史分页参数")
	}
	if issue := gitDirectoryIssue(ctx, d.Path); issue != "" {
		return GitHistory{}, errors.New(issue)
	}
	revision := head
	if exclude != "" {
		revision = exclude + ".." + head
	}
	commits, more, err := gitCommits(ctx, d.Path, revision, gitHistoryLimit, offset)
	if err != nil {
		return GitHistory{}, errors.New("无法读取更早的提交，请重试或重新核对 Git")
	}
	return GitHistory{Head: head, Commits: commits, More: more}, nil
}

func validGitObjectID(value string) bool {
	if len(value) != 40 && len(value) != 64 {
		return false
	}
	_, err := hex.DecodeString(value)
	return err == nil
}
