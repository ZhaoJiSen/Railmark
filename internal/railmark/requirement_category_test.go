package railmark

import (
	"database/sql"
	"path/filepath"
	"strings"
	"testing"
)

func TestRequirementCategoriesSurviveMigrationAndEdits(t *testing.T) {
	ctx := t.Context()
	path := filepath.Join(t.TempDir(), "railmark.sqlite3")
	legacy, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	legacySchema := strings.Replace(schema, "    category TEXT NOT NULL DEFAULT '' CHECK (category IN ('', 'business', 'technical')),\n", "", 1)
	if legacySchema == schema {
		t.Fatal("legacy schema still has a category column")
	}
	if _, err := legacy.Exec(legacySchema + `
		INSERT INTO versions (id, name, state) VALUES (1, '20261130', 'open');
		INSERT INTO requirements (id, version_id, title, direction, state, updated_at)
			VALUES (1, 1, '旧需求', '订单管理', 'todo', '2026-11-17');
		INSERT INTO logs (requirement_id, kind, text, created_at) VALUES (1, 'note', '旧日志', '2026-11-17');
	`); err != nil {
		t.Fatal(err)
	}
	if err := legacy.Close(); err != nil {
		t.Fatal(err)
	}
	store, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	data, err := store.Workspace(ctx)
	if err != nil || len(data.Requirements) != 1 || data.Requirements[0].Category != "" ||
		data.Requirements[0].Direction != "订单管理" || data.Requirements[0].LatestLog != "旧日志" {
		t.Fatalf("old requirement not preserved: %+v (%v)", data, err)
	}
	dir, err := store.ImportProject(ctx, t.TempDir(), 0, "示例项目")
	if err != nil {
		t.Fatal(err)
	}
	input := SaveRequirementInput{
		ID: 1, VersionID: 1, Title: "旧需求", Category: "technical", Direction: "订单管理", State: "todo",
		Projects: []ProjectLink{{DirectoryID: dir.ID, Group: "backend", State: "todo"}},
	}
	if _, err := store.SaveRequirement(ctx, input); err != nil {
		t.Fatal(err)
	}
	input.ID, input.Title, input.Category = 0, "敏感接口留痕", "business"
	business, err := store.SaveRequirement(ctx, input)
	if err != nil {
		t.Fatal(err)
	}
	input.Category = "invalid"
	if _, err := store.SaveRequirement(ctx, input); err == nil {
		t.Fatal("saved an unknown category")
	}
	reopened, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	data, err = reopened.Workspace(ctx)
	if err != nil || len(data.Requirements) != 2 {
		t.Fatalf("unexpected workspace: %+v (%v)", data, err)
	}
	categories := make(map[int64]string)
	for _, item := range data.Requirements {
		categories[item.ID] = item.Category
		if item.ID == 1 && !strings.Contains(item.LatestLog, "未分类 → 技术项目") {
			t.Fatalf("category change missing from history: %q", item.LatestLog)
		}
	}
	if categories[1] != "technical" || categories[business] != "business" {
		t.Fatalf("categories were not saved: %v", categories)
	}
}
