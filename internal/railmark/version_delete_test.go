package railmark

import (
	"path/filepath"
	"testing"
)

func TestDeleteVersionRemovesOnlyItsRequirements(t *testing.T) {
	ctx := t.Context()
	path := filepath.Join(t.TempDir(), "railmark.sqlite3")
	store, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.Close() })

	remove, err := store.SaveVersion(ctx, Version{Name: "20261116", State: "released"})
	if err != nil {
		t.Fatal(err)
	}
	keep, err := store.SaveVersion(ctx, Version{Name: "20261130", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	dir, err := store.ImportProject(ctx, t.TempDir(), 0, "订单 Web")
	if err != nil {
		t.Fatal(err)
	}
	input := SaveRequirementInput{VersionID: remove, Title: "旧需求", State: "done",
		Projects: []ProjectLink{{DirectoryID: dir.ID, Group: "frontend", State: "done", Branch: "feature/orders"}}}
	removedRequirement, err := store.SaveRequirement(ctx, input)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.AddNote(ctx, removedRequirement, "仅属于旧版本"); err != nil {
		t.Fatal(err)
	}
	input.VersionID, input.Title = keep, "仍在跟进的需求"
	keptRequirement, err := store.SaveRequirement(ctx, input)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.SelectVersion(ctx, remove); err != nil {
		t.Fatal(err)
	}

	if _, err := store.DeleteVersion(ctx, remove, "20261116", 0); err == nil {
		t.Fatal("deleted without confirming the current number of requirements")
	}
	if _, err := store.DeleteVersion(ctx, remove, "已重命名", 1); err == nil {
		t.Fatal("deleted a version with a different name")
	}
	before, err := store.Workspace(ctx)
	if err != nil || len(before.Versions) != 2 || len(before.Requirements) != 2 || before.LastVersionID != remove {
		t.Fatalf("failed deletion modified the workspace: %+v (%v)", before, err)
	}

	after, err := store.DeleteVersion(ctx, remove, "20261116", 1)
	if err != nil {
		t.Fatal(err)
	}
	if len(after.Versions) != 1 || after.Versions[0].ID != keep || after.LastVersionID != 0 ||
		len(after.Requirements) != 1 || after.Requirements[0].ID != keptRequirement {
		t.Fatalf("unexpected workspace after deletion: %+v", after)
	}
	if len(after.Projects) != 1 || len(after.Projects[0].Directories) != 1 || after.Projects[0].Directories[0].ID != dir.ID ||
		len(after.Requirements[0].Projects[0].Conflicts) != 0 {
		t.Fatalf("project directory or conflict state is incorrect: %+v", after)
	}

	reopened, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	logs, err := reopened.Logs(ctx, removedRequirement)
	if err != nil || len(logs) != 0 {
		t.Fatalf("deleted requirement still has logs: %+v (%v)", logs, err)
	}
	var deliveries int
	if err := reopened.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM deliveries WHERE requirement_id=?", removedRequirement).Scan(&deliveries); err != nil || deliveries != 0 {
		t.Fatalf("deleted requirement still has deliveries: %d (%v)", deliveries, err)
	}
	if err := reopened.SelectVersion(ctx, remove); err == nil {
		t.Fatal("selected a deleted version")
	}
	if _, err := reopened.DeleteVersion(ctx, remove, "20261116", 1); err == nil {
		t.Fatal("deleted the same version twice")
	}
}

func TestDeleteEmptyVersionKeepsSelection(t *testing.T) {
	ctx := t.Context()
	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	keep, err := store.SaveVersion(ctx, Version{Name: "1.0", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	remove, err := store.SaveVersion(ctx, Version{Name: "2.0", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	if err := store.SelectVersion(ctx, keep); err != nil {
		t.Fatal(err)
	}
	after, err := store.DeleteVersion(ctx, remove, "2.0", 0)
	if err != nil || after.LastVersionID != keep || len(after.Versions) != 1 {
		t.Fatalf("deleting an empty version changed selection: %+v (%v)", after, err)
	}
}
