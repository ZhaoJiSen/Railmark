package railmark

import (
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestAppearancePreferencePersists(t *testing.T) {
	ctx := t.Context()
	path := filepath.Join(t.TempDir(), "railmark.sqlite3")
	store, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.Close() })

	if got, err := store.Appearance(ctx); err != nil || got != "system" {
		t.Fatalf("default appearance = %q, %v", got, err)
	}
	if err := store.SetAppearance(ctx, "dark"); err != nil {
		t.Fatal(err)
	}
	if err := store.SetAppearance(ctx, "invalid"); err == nil {
		t.Fatal("saved an invalid appearance")
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	if got, err := reopened.Appearance(ctx); err != nil || got != "dark" {
		t.Fatalf("saved appearance = %q, %v", got, err)
	}
	for _, mode := range []string{"light", "system"} {
		if err := reopened.SetAppearance(ctx, mode); err != nil {
			t.Fatal(err)
		}
		if got, err := reopened.Appearance(ctx); err != nil || got != mode {
			t.Fatalf("appearance = %q, %v; want %q", got, err, mode)
		}
	}
}

func TestSaveRequirementNeedsExistingDirectoryAndPreservesHistory(t *testing.T) {
	ctx := t.Context()
	dbPath := filepath.Join(t.TempDir(), "railmark.sqlite3")
	store, err := Open(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.Close() })

	first, err := store.SaveVersion(ctx, Version{Name: "5.27.0", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	second, err := store.SaveVersion(ctx, Version{Name: "5.28.0", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	if err := store.SelectVersion(ctx, second); err != nil {
		t.Fatal(err)
	}

	input := SaveRequirementInput{VersionID: first, Title: "新增异常原因", State: "todo"}
	if _, err := store.SaveRequirement(ctx, input); err == nil {
		t.Fatal("saved a requirement without a local directory")
	}
	preview, err := store.PreviewDirectory(ctx, t.TempDir())
	if err != nil {
		t.Fatalf("previewing the first local directory: %v", err)
	}
	if preview.Path == "" || preview.Name == "" || preview.ProjectID != 0 || preview.DirectoryID != 0 {
		t.Fatalf("unexpected preview of an unregistered directory: %+v", preview)
	}
	input.Projects = []ProjectLink{
		{Path: preview.Path, ProjectName: "订单 Web", Group: "frontend", State: "todo", Branch: "feature/order"},
		{Path: filepath.Join(preview.Path, "missing"), Group: "backend", State: "todo"},
	}
	if _, err := store.SaveRequirement(ctx, input); err == nil {
		t.Fatal("saved a requirement with a missing local directory")
	}
	data, err := store.Workspace(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(data.Requirements) != 0 || len(data.Projects) != 0 {
		t.Fatalf("failed save left workspace data: %+v", data)
	}

	input.Projects[1].Path = t.TempDir()
	input.Projects[1].ProjectName = "订单 API"
	id, err := store.SaveRequirement(ctx, input)
	if err != nil {
		t.Fatal(err)
	}
	input.ID = id
	input.State = "in_progress"
	input.Projects[0].Branch = "feature-5.27.0/order"
	if _, err := store.SaveRequirement(ctx, input); err != nil {
		t.Fatal(err)
	}
	if err := store.AddNote(ctx, id, "补齐接口定义"); err != nil {
		t.Fatal(err)
	}

	data, err = store.Workspace(ctx)
	if err != nil {
		t.Fatal(err)
	}
	frontend := data.Requirements[0].Projects[0]
	if _, err := store.db.ExecContext(ctx, "UPDATE deliveries SET branch=? WHERE requirement_id=? AND directory_id=?",
		"refs/heads/"+frontend.Branch, id, frontend.DirectoryID); err != nil {
		t.Fatal(err)
	}
	otherReq, err := store.SaveRequirement(ctx, SaveRequirementInput{
		VersionID: second, Title: "件量优化", State: "todo",
		Projects: []ProjectLink{{DirectoryID: frontend.DirectoryID, Group: "frontend", State: "todo", Branch: "refs/heads/" + frontend.Branch}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	data, err = reopened.Workspace(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if data.LastVersionID != second || len(data.Projects) != 2 || len(data.Requirements) != 2 {
		t.Fatalf("workspace did not persist: %+v", data)
	}
	registered, err := reopened.PreviewDirectory(ctx, preview.Path)
	if err != nil {
		t.Fatalf("previewing the registered directory: %v", err)
	}
	if registered.DirectoryID != frontend.DirectoryID || registered.ProjectID != frontend.ProjectID || registered.Name != frontend.ProjectName {
		t.Fatalf("preview did not match the saved project: %+v", registered)
	}
	moved := data.Requirements[slices.IndexFunc(data.Requirements, func(r Requirement) bool { return r.ID == otherReq })]
	if moved.Projects[0].Branch != frontend.Branch || !slices.Equal(moved.Projects[0].Conflicts, []string{"5.27.0"}) {
		t.Fatalf("missing normalized branch or cross-version warning: %+v", moved)
	}
	logs, err := reopened.Logs(ctx, id)
	if err != nil {
		t.Fatal(err)
	}
	if len(logs) != 3 || logs[0].Text != "补齐接口定义" || !strings.Contains(logs[1].Text, "feature-5.27.0/order") {
		t.Fatalf("unexpected requirement history: %+v", logs)
	}
}
