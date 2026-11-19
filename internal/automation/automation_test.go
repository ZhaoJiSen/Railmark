package automation

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDocumentLinkRead(t *testing.T) {
	for _, link := range []string{
		"https://alidocs.dingtalk.com/i/nodes/abc123",
		"https://org-alidocs.dingtalk.com/document/edit?dentryKey=abc123",
	} {
		if _, err := dingTalkURL(link); err != nil {
			t.Errorf("expected document link: %v", err)
		}
	}
	for _, link := range []string{
		"https://alidocs.dingtalk.com.example.org/i/nodes/abc123",
		"https://org-alidocs.dingtalk.com:8443/i/nodes/abc123",
		"https://alidocs.dingtalk.com/i/nodes/../files",
		"https://person@alidocs.dingtalk.com/i/nodes/abc123",
	} {
		if _, err := dingTalkURL(link); err == nil {
			t.Errorf("accepted %s", link)
		}
	}
	source := "https://alidocs.dingtalk.com/i/nodes/abc123"
	doc, err := decodeDocument([]byte(`{"ok":true,"data":{"contractVersion":"doc.content.v1","complete":true,"content":{"success":true,"title":"需求示例","markdown":"# 背景\n说明"}}}`), source)
	if err != nil || doc.Title != "需求示例" || doc.Markdown != "# 背景\n说明" || doc.SourceURL != source {
		t.Fatalf("document = %+v, %v", doc, err)
	}
	if _, err := decodeDocument([]byte(`{"ok":true,"data":{"complete":false,"content":{"markdown":"partial"}}}`), source); err == nil {
		t.Fatal("accepted incomplete document")
	}
}

func TestCheckoutUsesBoundBranchAndKeepsOriginalWork(t *testing.T) {
	ctx := context.Background()
	canonical, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	project := filepath.Join(canonical, "项目 A")
	if err := os.Mkdir(project, 0700); err != nil {
		t.Fatal(err)
	}
	git := func(dir string, args ...string) string {
		t.Helper()
		out, err := repositoryGit(ctx, dir, args...)
		if err != nil {
			t.Fatalf("git %v: %v", args, err)
		}
		return strings.TrimSpace(out)
	}
	write := func(dir, content string) {
		t.Helper()
		if err := os.WriteFile(filepath.Join(dir, "feature.txt"), []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	git(project, "init", "--initial-branch=main")
	write(project, "main")
	git(project, "add", "feature.txt")
	git(project, "-c", "user.name=Test", "-c", "user.email=test@example.org", "commit", "-m", "seed")
	git(project, "checkout", "-b", "feature/version-a")
	write(project, "feature/version-a")
	git(project, "add", "feature.txt")
	git(project, "-c", "user.name=Test", "-c", "user.email=test@example.org", "commit", "-m", "feature")
	wantCommit := git(project, "rev-parse", "HEAD")
	git(project, "checkout", "main")
	write(project, "uncommitted local work")

	copy, commit, err := checkout(ctx, filepath.Join(canonical, "tasks"), Task{Directory: project, Branch: "feature/version-a"})
	if err != nil {
		t.Fatal(err)
	}
	body, err := os.ReadFile(filepath.Join(copy, "feature.txt"))
	if err != nil || string(body) != "feature/version-a" || commit != wantCommit || git(copy, "remote") != "" {
		t.Fatalf("bad checkout: %s, %s, %v", body, commit, err)
	}
	write(copy, "agent change")
	body, err = os.ReadFile(filepath.Join(project, "feature.txt"))
	if err != nil || string(body) != "uncommitted local work" || git(project, "branch", "--show-current") != "main" {
		t.Fatalf("original worktree changed: %s, %v", body, err)
	}
}

func TestFileToolsStayWithinCheckout(t *testing.T) {
	base, outside := t.TempDir(), t.TempDir()
	if err := os.Symlink(outside, filepath.Join(base, "link")); err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(base)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	for _, name := range []string{"link/new.txt", "../outside.txt", ".GIT/config", ".env.local"} {
		if err := editSource(root, name, "", "unsafe"); err == nil {
			t.Errorf("accepted unsafe or non-source path: %s", name)
		}
	}
	if err := editSource(root, "src/index.txt", "", "current"); err != nil {
		t.Fatal(err)
	}
	if err := editSource(root, "src/index.txt", "current", "updated"); err != nil {
		t.Fatal(err)
	}
	if got, err := inspectFiles(root, "src", "updated"); err != nil || !strings.Contains(got, "src/index.txt:1: updated") {
		t.Fatalf("search result %q, %v", got, err)
	}
}

func TestReadDocumentUsesDWSWithoutShellInterpolation(t *testing.T) {
	bin := t.TempDir()
	dws := `#!/bin/sh
set -eu
[ "$DWS_NO_UPDATE_CHECK" = 1 ]
[ "$#" -eq 6 ]
[ "$1" = doc ] && [ "$2" = +fetch ] && [ "$3" = --node ]
[ "$4" = 'https://alidocs.dingtalk.com/i/nodes/abc123?from=railmark&space=test' ]
[ "$5" = --format ] && [ "$6" = json ]
printf '%s' '{"ok":true,"data":{"complete":true,"content":{"title":"示例","markdown":"正文"}}}'
`
	if err := os.WriteFile(filepath.Join(bin, "dws"), []byte(dws), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin)
	url := "https://alidocs.dingtalk.com/i/nodes/abc123?from=railmark&space=test"
	doc, err := ReadDocument(t.Context(), url)
	if err != nil || doc.Markdown != "正文" || doc.SourceURL != url {
		t.Fatalf("document = %+v, %v", doc, err)
	}
}
