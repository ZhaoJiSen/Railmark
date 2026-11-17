package railmark

import (
	"path/filepath"
	"testing"
)

func TestProjectGroupingPersistsAcrossReopen(t *testing.T) {
	ctx := t.Context()
	path := filepath.Join(t.TempDir(), "railmark.sqlite3")
	read := func(store *Store, want bool) {
		t.Helper()
		workspace, err := store.Workspace(ctx)
		if err != nil || workspace.ProjectGrouping != want {
			t.Fatalf("project grouping = %t, error = %v; want %t", workspace.ProjectGrouping, err, want)
		}
	}

	store, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	read(store, false)
	for _, enabled := range []bool{true, false} {
		if err := store.SetProjectGrouping(ctx, enabled); err != nil {
			t.Fatal(err)
		}
		if err := store.Close(); err != nil {
			t.Fatal(err)
		}
		store, err = Open(path)
		if err != nil {
			t.Fatal(err)
		}
		read(store, enabled)
	}
	defer store.Close()
}
