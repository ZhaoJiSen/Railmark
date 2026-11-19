package railmark

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestOperateGitBranch(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("Git is required")
	}
	ctx := t.Context()
	remote := t.TempDir()
	local := t.TempDir()
	run := func(path string, args ...string) string {
		t.Helper()
		options := []string{"-c", "core.hooksPath=/dev/null", "-c", "user.name=Railmark",
			"-c", "user.email=test@example.invalid", "-c", "commit.gpgSign=false"}
		out, err := git(ctx, path, append(options, args...)...)
		if err != nil {
			t.Fatalf("git %v: %v", args, err)
		}
		return gitLine(out)
	}
	write := func(path, file, content string) {
		t.Helper()
		if err := os.WriteFile(filepath.Join(path, file), []byte(content+"\n"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	commit := func(path, file, content string) {
		t.Helper()
		write(path, file, content)
		run(path, "add", "--", file)
		run(path, "commit", "-m", content)
	}

	run(remote, "init", "--template=", "--initial-branch=main")
	commit(remote, "shared.txt", "base")
	run(local, "clone", "--template=", "--", remote, ".")
	run(local, "config", "core.hooksPath", "/dev/null")
	run(local, "config", "user.name", "Railmark")
	run(local, "config", "user.email", "test@example.invalid")
	run(local, "config", "commit.gpgSign", "false")
	run(local, "branch", "--track", "feature", "origin/main")
	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	dir, err := store.ImportProject(ctx, local, 0, "Git operations")
	if err != nil {
		t.Fatal(err)
	}
	operate := func(action, ref, current, upstream string) error {
		return store.OperateGitBranch(ctx, dir.ID, action, ref, current, upstream)
	}
	wantError := func(err error, detail string) {
		t.Helper()
		if err == nil || !strings.Contains(err.Error(), detail) {
			t.Fatalf("wanted error containing %q, got %v", detail, err)
		}
	}

	wantError(operate("checkout", "refs/heads/feature", "stale", ""), "已变化")
	wantError(operate("checkout", "refs/heads/feature~0", "main", ""), "本地分支")
	write(local, "shared.txt", "uncommitted")
	wantError(operate("checkout", "refs/heads/feature", "main", ""), "未提交")
	run(local, "restore", "--", "shared.txt")
	write(local, "notes.txt", "untracked work")
	if err := operate("checkout", "refs/heads/feature", "main", ""); err != nil {
		t.Fatal(err)
	}
	if got := run(local, "branch", "--show-current"); got != "feature" {
		t.Fatalf("checked out %q", got)
	}
	if content, err := os.ReadFile(filepath.Join(local, "notes.txt")); err != nil || string(content) != "untracked work\n" {
		t.Fatalf("untracked work changed: %q, %v", content, err)
	}

	commit(remote, "remote.txt", "upstream update")
	wantError(operate("pull", "", "feature", "origin/stale"), "上游")
	if err := operate("pull", "", "feature", "origin/main"); err != nil {
		t.Fatal(err)
	}
	if run(local, "rev-parse", "HEAD") != run(remote, "rev-parse", "HEAD") {
		t.Fatal("pull did not fast-forward the current branch")
	}

	if err := os.MkdirAll(filepath.Join(local, ".git", "info"), 0700); err != nil {
		t.Fatal(err)
	}
	write(local, ".git/info/exclude", "ignored.txt")
	write(local, "ignored.txt", "local ignored file")
	commit(remote, "ignored.txt", "upstream now tracks this file")
	wantError(operate("pull", "", "feature", "origin/main"), "覆盖本地文件")
	if content, err := os.ReadFile(filepath.Join(local, "ignored.txt")); err != nil || string(content) != "local ignored file\n" {
		t.Fatalf("ignored file was changed by pull: %q, %v", content, err)
	}
	if err := os.Remove(filepath.Join(local, "ignored.txt")); err != nil {
		t.Fatal(err)
	}

	commit(local, "local.txt", "local update")
	commit(remote, "remote.txt", "another upstream update")
	before := run(local, "rev-parse", "HEAD")
	wantError(operate("pull", "", "feature", "origin/main"), "已分叉")
	if run(local, "rev-parse", "HEAD") != before {
		t.Fatal("divergent pull moved the local branch")
	}
	if err := operate("merge", "refs/remotes/origin/main", "feature", ""); err != nil {
		t.Fatal(err)
	}
	if run(local, "rev-parse", "HEAD^1") != before || run(local, "rev-parse", "HEAD^2") != run(remote, "rev-parse", "HEAD") {
		t.Fatal("merge did not preserve the target and source parents")
	}

	run(local, "switch", "-c", "master")
	commit(local, "master.txt", "local master update")
	master := run(local, "rev-parse", "HEAD")
	run(local, "switch", "feature")
	commit(local, "feature.txt", "feature update")
	feature := run(local, "rev-parse", "HEAD")
	write(local, "feature.txt", "uncommitted feature update")
	wantError(operate("merge", "refs/heads/master", "feature", ""), "未提交")
	run(local, "restore", "--", "feature.txt")
	if err := operate("merge", "refs/heads/master", "feature", ""); err != nil {
		t.Fatal(err)
	}
	if run(local, "branch", "--show-current") != "feature" ||
		run(local, "rev-parse", "HEAD^1") != feature ||
		run(local, "rev-parse", "HEAD^2") != master ||
		run(local, "rev-parse", "refs/heads/master") != master {
		t.Fatal("merge did not advance only the checked-out feature branch")
	}

	run(local, "branch", "conflicting")
	commit(local, "shared.txt", "feature change")
	run(local, "switch", "conflicting")
	commit(local, "shared.txt", "conflicting change")
	run(local, "switch", "feature")
	wantError(operate("merge", "refs/heads/conflicting", "feature", ""), "合并产生冲突")
	if state := InspectGit(ctx, dir, "", false); state.Branch != "feature" || state.Conflicted != 1 {
		t.Fatalf("expected a conflict on the receiving branch: %+v", state)
	}
	wantError(operate("checkout", "refs/heads/main", "feature", ""), "工作区有冲突")
	run(local, "merge", "--abort")
}
