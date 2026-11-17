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
	run("switch", "release")
	branch, err := ReadGitHistory(ctx, repo, "refs/heads/feature", "release")
	if err != nil || branch.Head != initial.Head || !branch.More || branch.Comparison == nil ||
		branch.Comparison.Base == "" || branch.Comparison.Base != initial.ReleaseBase || !branch.Comparison.More ||
		branch.Comparison.Issue != "" || len(branch.Comparison.Commits) != gitHistoryLimit {
		t.Fatalf("unexpected selected-branch history: %+v (%v)", branch, err)
	}
	missing, err := ReadGitHistory(ctx, repo, "refs/heads/feature", "missing-release")
	if err != nil || len(missing.Commits) == 0 || missing.Comparison == nil || missing.Comparison.Issue == "" {
		t.Fatalf("missing base should keep full history: %+v (%v)", missing, err)
	}
	if status := InspectGit(ctx, repo, "", false); status.Branch != "release" {
		t.Fatalf("reading the selected branch changed the checkout: %s", status.Branch)
	}
	run("switch", "feature")
	commit("Added after the first page")
	run("branch", "-f", "release", initial.Head)

	page, err := ReadGitHistoryPage(ctx, repo, branch.Head, branch.Comparison.Base, gitHistoryLimit)
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
