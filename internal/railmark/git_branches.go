package railmark

import (
	"context"
	"errors"
	"strings"
)

// branchDirectory supports both saved project directories and folders picked in a requirement draft.
func (s *Store) branchDirectory(ctx context.Context, directoryID int64, path string) (Directory, error) {
	if directoryID != 0 {
		return s.Directory(ctx, directoryID)
	}
	path, err := canonicalDirectory(path)
	return Directory{Path: path}, err
}

func (s *Store) GitBranches(ctx context.Context, directoryID int64, path string) ([]GitBranch, error) {
	dir, err := s.branchDirectory(ctx, directoryID, path)
	if err != nil {
		return nil, err
	}
	if issue := gitDirectoryIssue(ctx, dir.Path); issue != "" {
		return nil, errors.New(issue)
	}
	branches, issue := listGitBranches(ctx, dir.Path)
	if issue != "" {
		return nil, errors.New(issue)
	}
	return branches, nil
}

func (s *Store) CreateGitBranch(ctx context.Context, directoryID int64, path, name, startRef string) error {
	dir, err := s.branchDirectory(ctx, directoryID, path)
	if err != nil {
		return err
	}
	unlock, err := s.lockGitDirectory(dir.Path)
	if err != nil {
		return err
	}
	defer unlock()
	if issue := gitDirectoryIssue(ctx, dir.Path); issue != "" {
		return errors.New(issue)
	}
	name = strings.TrimSpace(name)
	if name == "" || name == "HEAD" || strings.HasPrefix(name, "-") || strings.HasPrefix(name, "refs/") {
		return errors.New("请填写有效的 Git 分支名称")
	}
	newRef := "refs/heads/" + name
	if _, err := git(ctx, dir.Path, "check-ref-format", newRef); err != nil {
		return errors.New("请填写有效的 Git 分支名称")
	}
	if !strings.HasPrefix(startRef, "refs/heads/") && !strings.HasPrefix(startRef, "refs/remotes/") {
		return errors.New("请选择本地分支或远程跟踪分支作为起点")
	}
	hash, err := git(ctx, dir.Path, "show-ref", "--verify", "--hash", "--", startRef)
	if err != nil {
		return errors.New("找不到所选起点，请重新打开分支列表")
	}

	_, err = git(ctx, dir.Path, "-c", "core.hooksPath=/dev/null", "-c", "submodule.propagateBranches=false",
		"branch", "--no-track", "--", name, gitLine(hash))
	if err == nil {
		return nil
	}
	if _, exists := git(ctx, dir.Path, "show-ref", "--verify", "--quiet", "--", newRef); exists == nil {
		return errors.New("本地已存在同名分支，请从已有分支中选择")
	}
	return errors.New("无法创建分支，请检查分支名称和仓库写入权限")
}
