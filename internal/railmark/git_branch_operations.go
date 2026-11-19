package railmark

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func (s *Store) lockGitDirectory(path string) (func(), error) {
	if _, busy := s.gitWrites.LoadOrStore(path, struct{}{}); busy {
		return nil, errors.New("此目录正在执行 Git 操作，请稍后再试")
	}
	return func() { s.gitWrites.Delete(path) }, nil
}

func (s *Store) OperateGitBranch(ctx context.Context, directoryID int64, action, ref, branch, upstream string) error {
	dir, err := s.Directory(ctx, directoryID)
	if err != nil {
		return err
	}
	unlock, err := s.lockGitDirectory(dir.Path)
	if err != nil {
		return err
	}
	defer unlock()

	state := InspectGit(ctx, dir, "", false)
	if state.Issue != "" {
		return errors.New(state.Issue)
	}
	if state.Branch != branch {
		return errors.New("当前检出分支已变化，请刷新后重新选择操作")
	}
	if err := checkGitOperationState(ctx, dir.Path, state); err != nil {
		return err
	}

	switch action {
	case "checkout":
		name, local := strings.CutPrefix(ref, "refs/heads/")
		if !local || name == "" || name == "HEAD" || !gitBranchRefExists(ctx, dir.Path, ref) {
			return errors.New("找不到要切换的本地分支")
		}
		return runGitBranchOperation(ctx, dir.Path, action, "switch", "--no-guess", "--no-overwrite-ignore", "--no-recurse-submodules", "--", name)
	case "pull":
		if state.Branch == "" || upstream == "" || state.Upstream != upstream {
			return errors.New("当前分支的跟踪上游未配置或已变化，请刷新后重试")
		}
		return pullGitUpstream(ctx, dir, state)
	case "merge":
		if state.Branch == "" || state.Head == "" {
			return errors.New("请先切换到要接收合并的本地分支")
		}
		if ref == "refs/heads/"+state.Branch || !gitBranchRefExists(ctx, dir.Path, ref) {
			return errors.New("请选择另一个本地分支或远程跟踪分支作为合并来源")
		}
		return runGitBranchOperation(ctx, dir.Path, action, "merge", "--ff", "--commit", "--no-squash",
			"--no-edit", "--no-autostash", "--no-overwrite-ignore", "--", ref)
	default:
		return errors.New("不支持的 Git 分支操作")
	}
}

func pullGitUpstream(ctx context.Context, dir Directory, state GitSnapshot) error {
	out, err := git(ctx, dir.Path, "for-each-ref", "--format=%(upstream:remotename)%00%(upstream:remoteref)%00%(upstream)",
		"--", "refs/heads/"+state.Branch)
	fields := strings.Split(gitLine(out), "\x00")
	if err != nil || len(fields) != 3 || fields[0] == "" || !strings.HasPrefix(fields[1], "refs/") || !strings.HasPrefix(fields[2], "refs/") {
		return errors.New("无法解析当前分支的跟踪上游")
	}
	remote, remoteRef, upstreamRef := fields[0], fields[1], fields[2]
	// Fetch separately so Git can guard ignored files at the fast-forward step.
	if remote != "." {
		if err := runGitBranchOperation(ctx, dir.Path, "pull", "fetch", "--no-recurse-submodules", "--", remote, remoteRef); err != nil {
			return err
		}
	}

	current := InspectGit(ctx, dir, "", false)
	if current.Issue != "" {
		return errors.New(current.Issue)
	}
	if current.Branch != state.Branch || current.Head != state.Head || current.Upstream != state.Upstream {
		return errors.New("拉取期间检出分支、提交或上游已变化，请核对状态后重试")
	}
	if err := checkGitOperationState(ctx, dir.Path, current); err != nil {
		return err
	}
	return runGitBranchOperation(ctx, dir.Path, "pull", "merge", "--ff-only", "--no-autostash", "--no-overwrite-ignore", "--", upstreamRef)
}

func gitBranchRefExists(ctx context.Context, path, ref string) bool {
	if !strings.HasPrefix(ref, "refs/heads/") && !strings.HasPrefix(ref, "refs/remotes/") {
		return false
	}
	_, err := git(ctx, path, "show-ref", "--verify", "--quiet", "--", ref)
	return err == nil
}

func checkGitOperationState(ctx context.Context, path string, state GitSnapshot) error {
	if state.Conflicted > 0 {
		return errors.New("工作区有冲突，请先解决冲突或中止正在进行的 Git 操作")
	}
	out, err := git(ctx, path, "rev-parse", "--absolute-git-dir")
	if err != nil {
		return errors.New("无法读取 Git 操作状态")
	}
	for _, marker := range []string{"MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply", "sequencer", "BISECT_START"} {
		if _, err := os.Lstat(filepath.Join(gitLine(out), marker)); !errors.Is(err, os.ErrNotExist) {
			if err != nil {
				return errors.New("无法读取 Git 操作状态")
			}
			return errors.New("仓库已有一项 Git 操作正在进行，请先完成或中止该操作")
		}
	}
	if state.Staged > 0 || state.Unstaged > 0 {
		return errors.New("工作区有未提交的改动，请先提交或使用 git stash 保存改动")
	}
	return nil
}

func runGitBranchOperation(ctx context.Context, path, action string, args ...string) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	output, err := gitCommand(ctx, path, args...).CombinedOutput()
	if err == nil {
		return nil
	}
	if ctx.Err() != nil {
		return errors.New("Git 操作中断，请核对工作区状态后重试")
	}
	message := string(output)
	if strings.Contains(message, "would be overwritten") {
		return errors.New("Git 操作会覆盖本地文件，请先保留相关改动")
	}
	switch action {
	case "checkout":
		if strings.Contains(message, "already used by worktree") || strings.Contains(message, "already checked out") {
			return errors.New("该分支已在另一个工作树检出")
		}
		return errors.New("切换分支失败，请检查分支是否仍存在以及文件是否会被覆盖")
	case "pull":
		if strings.Contains(message, "Not possible to fast-forward") {
			return errors.New("本地与上游分支已分叉，请先查看提交差异并合并上游分支")
		}
		return errors.New("拉取失败，请检查上游分支、网络和 Git 凭据")
	default:
		if strings.Contains(message, "Automatic merge failed") || strings.Contains(message, "CONFLICT (") {
			return errors.New("合并产生冲突，请在项目目录解决冲突后提交，或执行 git merge --abort")
		}
		return errors.New("合并失败，请在项目目录检查 Git 状态和合并来源")
	}
}
