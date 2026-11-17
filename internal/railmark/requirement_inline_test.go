package railmark

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestInlineEditsChangeOnlyTheRequestedFields(t *testing.T) {
	ctx := t.Context()
	store, err := Open(filepath.Join(t.TempDir(), "railmark.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	version, err := store.SaveVersion(ctx, Version{Name: "1.0", State: "open"})
	if err != nil {
		t.Fatal(err)
	}
	dir, err := store.ImportProject(ctx, t.TempDir(), 0, "订单")
	if err != nil {
		t.Fatal(err)
	}
	id, err := store.SaveRequirement(ctx, SaveRequirementInput{
		VersionID: version, Title: "保留标题", Category: "technical", Direction: "工程效率", State: "todo",
		Background: "保留其他内容",
		Projects: []ProjectLink{
			{DirectoryID: dir.ID, Group: "frontend", State: "todo", Branch: "feature/web"},
			{DirectoryID: dir.ID, Group: "backend", State: "todo", Branch: "feature/api", BaseBranch: "main", PushTarget: "origin/feature/api"},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "state", "invalid"); err == nil {
		t.Fatal("accepted invalid delivery state")
	}
	if _, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "push_target", "invalid"); err == nil {
		t.Fatal("accepted unsupported delivery field")
	}
	if _, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "state", "testing"); err != nil {
		t.Fatal(err)
	}
	if _, err := store.UpdateRequirementState(ctx, id, "in_progress"); err != nil {
		t.Fatal(err)
	}
	if _, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "branch", "  refs/heads/feature/new-api  "); err != nil {
		t.Fatal(err)
	}
	data, err := store.UpdateDeliveryField(ctx, id, dir.ID, "backend", "branch", "")
	if err != nil {
		t.Fatal(err)
	}
	req := data.Requirements[0]
	if req.State != "in_progress" || req.Title != "保留标题" || req.Category != "technical" ||
		req.Direction != "工程效率" || req.Background != "保留其他内容" {
		t.Fatalf("unrelated requirement fields changed: %+v", req)
	}
	links := make(map[string]Delivery)
	for _, link := range req.Projects {
		links[link.Group] = link
	}
	if frontend := links["frontend"]; frontend.State != "todo" || frontend.Branch != "feature/web" {
		t.Fatalf("edited the wrong group: %+v", frontend)
	}
	if backend := links["backend"]; backend.State != "testing" || backend.Branch != "" ||
		backend.BaseBranch != "main" || backend.PushTarget != "origin/feature/api" {
		t.Fatalf("unexpected delivery values: %+v", backend)
	}
	if _, err := store.UpdateRequirementState(ctx, id, "in_progress"); err != nil {
		t.Fatal(err)
	}
	logs, err := store.Logs(ctx, id)
	if err != nil || len(logs) != 5 || !strings.Contains(logs[0].Text, "feature/new-api → 未设置") ||
		!strings.Contains(logs[2].Text, "状态：待开始 → 开发中") {
		t.Fatalf("unexpected logs: %+v (%v)", logs, err)
	}
}
