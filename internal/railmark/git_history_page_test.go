package railmark

import (
	"fmt"
	"os/exec"
	"testing"
)

func TestGitHistoryPageKeepsOriginalHeadAndBase(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("Git is required")
	}
	ctx := t.Context()
	dir, err := canonicalDirectory(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	repo := Directory{Path: dir}
	run := func(args ...string) {
		t.Helper()
		options := []string{
			"-C", dir, "-c", "core.hooksPath=/dev/null", "-c", "user.name=Railmark Test",
			"-c", "user.email=railmark@example.invalid", "-c", "commit.gpgSign=false",
		}
		if output, err := exec.CommandContext(ctx, "git", append(options, args...)...).CombinedOutput(); err != nil {
			t.Fatalf("git %v: %s (%v)", args, output, err)
		}
	}
	commit := func(message string) { run("commit", "--allow-empty", "-qm", message) }

	run("init", "--template=", "--initial-branch=release")
	commit("Release base")
	run("switch", "-c", "feature")
	for i := 1; i <= gitHistoryLimit+2; i++ {
		commit(fmt.Sprintf("Feature %d", i))
	}

	initial := InspectGit(ctx, repo, "release", true)
	branch, err := ReadGitHistory(ctx, repo, "refs/heads/feature")
	if err != nil || branch.Head != initial.Head || !branch.More || !initial.MoreRelease || initial.ReleaseBase == "" {
		t.Fatalf("unexpected first page: %v, %+v", err, initial)
	}
	commit("Added after the first page")
	run("branch", "-f", "release", initial.Head)

	page, err := ReadGitHistoryPage(ctx, repo, initial.Head, initial.ReleaseBase, gitHistoryLimit)
	if err != nil || page.More || len(page.Commits) != 2 ||
		page.Commits[0].Subject != "Feature 2" || page.Commits[1].Subject != "Feature 1" {
		t.Fatalf("unexpected range page: %+v (%v)", page, err)
	}
	full, err := ReadGitHistoryPage(ctx, repo, branch.Head, "", gitHistoryLimit)
	if err != nil || full.More || len(full.Commits) != 3 || full.Commits[2].Subject != "Release base" {
		t.Fatalf("unexpected branch page: %+v (%v)", full, err)
	}
	if _, err := ReadGitHistoryPage(ctx, repo, "--all", "", 0); err == nil {
		t.Fatal("accepted a nonliteral commit ID")
	}
}
