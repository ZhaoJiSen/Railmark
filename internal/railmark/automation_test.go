package railmark

import (
	"path/filepath"
	"testing"
)

func TestAutomationProviderPreferencePersists(t *testing.T) {
	ctx := t.Context()
	path := filepath.Join(t.TempDir(), "railmark.sqlite3")
	store, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.Close() })
	if got, err := store.AutomationProvider(ctx); err != nil || got != "codex" {
		t.Fatalf("default provider = %q, %v", got, err)
	}
	if err := store.SetAutomationProvider(ctx, "claude"); err != nil {
		t.Fatal(err)
	}
	if err := store.SetAutomationProvider(ctx, "unknown"); err == nil {
		t.Fatal("accepted an unknown provider")
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}
	reopened, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	if got, err := reopened.AutomationProvider(ctx); err != nil || got != "claude" {
		t.Fatalf("saved provider = %q, %v", got, err)
	}
}

func TestAutomationTargetRequiresSavedDeliveryAndCurrentBranch(t *testing.T) {
	ctx := t.Context()
	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	version, err := store.SaveVersion(ctx, Version{Name: "20261130", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	dir, err := store.ImportProject(ctx, t.TempDir(), 0, "订单")
	if err != nil {
		t.Fatal(err)
	}
	id, err := store.SaveRequirement(ctx, SaveRequirementInput{
		VersionID: version, Title: "订单异常", State: "todo",
		Projects: []ProjectLink{{DirectoryID: dir.ID, Group: "frontend", State: "todo", Branch: "feature/web"},
			{DirectoryID: dir.ID, Group: "backend", State: "todo", Branch: "feature/api"}},
	})
	if err != nil {
		t.Fatal(err)
	}
	requirement, delivery, err := store.AutomationTarget(ctx, id, dir.ID, "backend", "feature/api")
	if err != nil || requirement.Title != "订单异常" || delivery.Path != dir.Path || delivery.Branch != "feature/api" {
		t.Fatalf("wrong target: %+v, %+v, %v", requirement, delivery, err)
	}
	if _, _, err := store.AutomationTarget(ctx, id, dir.ID, "frontend", "feature/api"); err == nil {
		t.Fatal("accepted branch from the other group")
	}
	if _, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "branch", "feature/updated"); err != nil {
		t.Fatal(err)
	}
	if _, _, err := store.AutomationTarget(ctx, id, dir.ID, "backend", "feature/api"); err == nil {
		t.Fatal("accepted stale branch")
	}
}
