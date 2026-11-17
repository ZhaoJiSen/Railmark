package railmark

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestReadGitCommitDiff(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("Git is required")
	}
	ctx := t.Context()
	dir, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	repo := Directory{Path: dir}
	run := func(args ...string) string {
		t.Helper()
		out, err := git(ctx, dir, args...)
		if err != nil {
			t.Fatalf("git %v: %v", args, err)
		}
		return gitLine(out)
	}
	write := func(path, contents string) {
		t.Helper()
		if err := os.WriteFile(filepath.Join(dir, path), []byte(contents), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	commit := func(subject string) string {
		t.Helper()
		run("add", "-A")
		run("commit", "-qm", subject)
		return run("rev-parse", "HEAD")
	}
	read := func(hash string) GitCommitFiles {
		t.Helper()
		detail, err := ReadGitCommitFiles(ctx, repo, hash)
		if err != nil {
			t.Fatal(err)
		}
		return detail
	}
	patch := func(hash, path string) GitFilePatch {
		t.Helper()
		for i, file := range read(hash).Files {
			if file.Path == path {
				result, err := ReadGitFilePatch(ctx, repo, hash, i)
				if err != nil {
					t.Fatal(err)
				}
				return result
			}
		}
		t.Fatalf("file %q not found", path)
		return GitFilePatch{}
	}

	run("init", "-q", "--template=", "--initial-branch=main")
	run("config", "user.name", "Railmark Test")
	run("config", "user.email", "railmark@example.invalid")
	run("config", "commit.gpgSign", "false")
	run("config", "core.hooksPath", "/dev/null")
	renameSource := "old\t[name].txt"
	renameTarget := "new [name].txt"
	write("entry", "old entry\n")
	write(renameSource, strings.Repeat("rename line\n", 16))
	root := commit("Initial")
	if d := read(root); d.Parent != "" || len(d.Files) != 2 || d.Files[0].Status != "A" {
		t.Fatalf("root diff: %+v", d)
	}
	if got := patch(root, "entry"); !strings.Contains(got.Patch, "+old entry\n") {
		t.Fatalf("root patch: %+v", got)
	}

	run("checkout", "-qb", "feature")
	run("mv", "--", renameSource, renameTarget)
	write(renameTarget, strings.Repeat("rename line\n", 16)+"extra\n")
	if err := os.Remove(filepath.Join(dir, "entry")); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "entry"), 0o700); err != nil {
		t.Fatal(err)
	}
	write("entry/item", "other file\n")
	write("image.dat", "\x00binary\n")
	write("large.txt", strings.Repeat("long line that should not be rendered\n", 20000))
	feature := commit("Rename and replace files")
	detail := read(feature)
	if detail.Parent != root || len(detail.Files) != 5 {
		t.Fatalf("feature diff: %+v", detail)
	}
	renamed := false
	for _, file := range detail.Files {
		renamed = renamed || file == (GitChangedFile{Path: renameTarget, OldPath: renameSource, Status: "R"})
	}
	if !renamed {
		t.Fatalf("rename not found: %+v", detail.Files)
	}
	if got := patch(feature, renameTarget); !strings.Contains(got.Patch, "rename from ") || !strings.Contains(got.Patch, "+extra\n") {
		t.Fatalf("rename patch: %+v", got)
	}
	if got := patch(feature, "entry"); !strings.Contains(got.Patch, "-old entry\n") || strings.Contains(got.Patch, "other file") {
		t.Fatalf("deleted path matched the replacement directory: %+v", got)
	}
	if got := patch(feature, "image.dat"); !strings.Contains(got.Patch, "Binary files") {
		t.Fatalf("binary patch: %+v", got)
	}
	if got := patch(feature, "large.txt"); got.Patch != "" || got.Issue == "" {
		t.Fatal("over-limit patch should return a preview message")
	}

	run("checkout", "-q", "main")
	write("main.txt", "main branch\n")
	firstParent := commit("Main change")
	run("merge", "--no-ff", "--no-edit", "feature")
	merge := run("rev-parse", "HEAD")
	if d := read(merge); d.Parent != firstParent || len(d.Files) != len(detail.Files) {
		t.Fatalf("merge diff should use first parent: %+v", d)
	}
	run("commit", "--allow-empty", "-qm", "Empty")
	if d := read(run("rev-parse", "HEAD")); len(d.Files) != 0 {
		t.Fatalf("empty diff: %+v", d)
	}
	if got := run("branch", "--show-current"); got != "main" {
		t.Fatalf("reading diffs changed checkout: %q", got)
	}
	if _, err := ReadGitCommitFiles(ctx, repo, "--all"); err == nil {
		t.Fatal("accepted a nonliteral commit")
	}
	if _, err := ReadGitFilePatch(ctx, repo, feature, -1); err == nil {
		t.Fatal("accepted an invalid file index")
	}
	shallow := filepath.Join(dir, "shallow")
	run("-c", "protocol.file.allow=always", "clone", "-q", "--depth=1", "file://"+dir, shallow)
	if _, err := ReadGitCommitFiles(ctx, Directory{Path: shallow}, run("rev-parse", "HEAD")); err == nil ||
		!strings.Contains(err.Error(), "缺少父提交") {
		t.Fatalf("should report the unavailable parent in a shallow clone: %v", err)
	}
}
