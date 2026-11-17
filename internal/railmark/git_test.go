package railmark

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestInspectGitAndReuseLinkedWorktree(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("Git is required")
	}
	ctx := t.Context()
	main := t.TempDir()
	worktree := filepath.Join(t.TempDir(), "order worktree")
	runGit := func(dir string, args ...string) {
		t.Helper()
		common := []string{
			"-C", dir, "-c", "core.hooksPath=/dev/null", "-c", "user.name=Railmark Test",
			"-c", "user.email=railmark@example.invalid", "-c", "commit.gpgSign=false",
		}
		out, err := exec.CommandContext(ctx, "git", append(common, args...)...).CombinedOutput()
		if err != nil {
			t.Fatalf("git %v: %s (%v)", args, out, err)
		}
	}
	runGit(main, "init", "--template=", "--initial-branch=release-5.27.0")
	runGit(main, "commit", "--allow-empty", "-m", "Release base")
	runGit(main, "worktree", "add", "-b", "feature-5.27.0/order", worktree)
	runGit(worktree, "commit", "--allow-empty", "-m", "Add exception details", "-m", "Include the source reason.\nKeep the fallback.")
	runGit(main, "update-ref", "refs/remotes/origin/release-5.27.0", "refs/heads/release-5.27.0")
	runGit(main, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/release-5.27.0")
	if err := os.WriteFile(filepath.Join(worktree, "draft.txt"), []byte("draft"), 0o600); err != nil {
		t.Fatal(err)
	}

	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	primary, err := store.ImportProject(ctx, main, 0, "订单 Web")
	if err != nil {
		t.Fatal(err)
	}
	secondary, err := store.ImportProject(ctx, worktree, 0, "")
	if err != nil {
		t.Fatal(err)
	}
	if primary.ProjectID != secondary.ProjectID || primary.ID == secondary.ID {
		t.Fatalf("worktrees did not reuse project: %+v %+v", primary, secondary)
	}

	state := InspectGit(ctx, secondary, "release-5.27.0", true)
	if state.Issue != "" || state.Branch != "feature-5.27.0/order" || state.Untracked != 1 {
		t.Fatalf("unexpected git status: %+v", state)
	}
	if len(state.ReleaseCommits) != 1 || !strings.Contains(state.ReleaseCommits[0].Subject, "exception") {
		t.Fatalf("unexpected commits relative to release branch: %+v", state)
	}
	if state.BranchesIssue != "" || len(state.Branches) != 3 ||
		state.Branches[0].Ref != "refs/heads/feature-5.27.0/order" ||
		state.Branches[2] != (GitBranch{Ref: "refs/remotes/origin/release-5.27.0", Name: "origin/release-5.27.0", Remote: true}) {
		t.Fatalf("unexpected branches: %+v", state.Branches)
	}
	if len(state.Commits) != 2 || state.Commits[0].Author != "Railmark Test" ||
		state.Commits[0].FullHash != state.Head || state.Commits[0].Parents != state.Commits[1].Hash ||
		!strings.Contains(state.Commits[0].Body, "\nKeep the fallback.") {
		t.Fatalf("unexpected commit details: %+v", state.Commits)
	}
	history, err := ReadGitHistory(ctx, secondary, state.Branches[2].Ref)
	if err != nil || history.More || len(history.Commits) != 1 || history.Commits[0].Subject != "Release base" {
		t.Fatalf("unexpected history for remote-tracking branch: %+v (%v)", history, err)
	}
	if after := InspectGit(ctx, secondary, "", false); after.Branch != state.Branch || after.Head != state.Head {
		t.Fatalf("reading history changed the checkout: %+v", after)
	}
	for _, ref := range []string{"--all", "refs/heads/missing", "refs/heads/release-5.27.0~1"} {
		if _, err := ReadGitHistory(ctx, secondary, ref); err == nil {
			t.Fatalf("accepted an unavailable or nonliteral branch ref: %q", ref)
		}
	}
}
