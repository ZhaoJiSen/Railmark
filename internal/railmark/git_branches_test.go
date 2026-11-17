package railmark

import (
	"os/exec"
	"path/filepath"
	"slices"
	"testing"
)

func TestCreateGitBranchFromSelectedRef(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("Git is required")
	}
	ctx := t.Context()
	dir := t.TempDir()
	run := func(args ...string) string {
		t.Helper()
		options := []string{"-c", "core.hooksPath=/dev/null", "-c", "user.name=Railmark",
			"-c", "user.email=test@example.invalid", "-c", "commit.gpgSign=false"}
		value, err := git(ctx, dir, append(options, args...)...)
		if err != nil {
			t.Fatalf("git %v: %v", args, err)
		}
		return gitLine(value)
	}
	run("init", "--template=", "--initial-branch=main")
	run("commit", "--allow-empty", "-m", "Release base")
	baseHash := run("rev-parse", "HEAD")
	source := "refs/remotes/origin/release-5.27.0"
	run("update-ref", source, baseHash)
	run("commit", "--allow-empty", "-m", "Different HEAD")
	headHash := run("rev-parse", "HEAD")

	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	refs, err := store.GitBranches(ctx, 0, dir)
	if err != nil || !slices.Contains(refs, GitBranch{Ref: source, Name: "origin/release-5.27.0", Remote: true}) {
		t.Fatalf("draft directory branch list: %v (%v)", refs, err)
	}

	name := "feature-5.27.0/long-order-detail-validation-test"
	if err := store.CreateGitBranch(ctx, 0, dir, name, source); err != nil {
		t.Fatal(err)
	}
	if hash := run("rev-parse", "refs/heads/"+name); hash != baseHash {
		t.Fatalf("created branch at %s, expected %s", hash, baseHash)
	}
	if active := run("symbolic-ref", "--short", "HEAD"); active != "main" || run("rev-parse", "HEAD") != headHash {
		t.Fatalf("creation changed the checkout: %s", active)
	}
	if upstream := run("for-each-ref", "--format=%(upstream)", "refs/heads/"+name); upstream != "" {
		t.Fatalf("the starting point became an upstream: %s", upstream)
	}

	saved, err := store.ImportProject(ctx, dir, 0, "订单 Web")
	if err != nil {
		t.Fatal(err)
	}
	for _, attempt := range []struct{ name, source string }{
		{name, "refs/heads/main"},
		{"--force", source},
		{"new", source + "~0"},
		{"new", "refs/tags/unavailable"},
	} {
		if err := store.CreateGitBranch(ctx, saved.ID, "", attempt.name, attempt.source); err == nil {
			t.Fatalf("accepted invalid attempt: %+v", attempt)
		}
	}
	if hash := run("rev-parse", "refs/heads/"+name); hash != baseHash {
		t.Fatalf("existing branch was overwritten: %s", hash)
	}
}
