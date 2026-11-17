package main

import (
	"context"
	"errors"
	"sync"

	"github.com/egoist/mygo"

	"railmark/internal/railmark"
)

type Desk struct {
	store        *railmark.Store
	appearanceMu sync.Mutex
}

func (d *Desk) Appearance() string {
	return string(mygo.Theme.Source())
}

func (d *Desk) SetAppearance(ctx context.Context, mode string) error {
	d.appearanceMu.Lock()
	defer d.appearanceMu.Unlock()
	if err := d.store.SetAppearance(ctx, mode); err != nil {
		return err
	}
	mygo.Theme.SetSource(mygo.ThemeSource(mode))
	return nil
}

func (d *Desk) Workspace(ctx context.Context) (railmark.Workspace, error) {
	return d.store.Workspace(ctx)
}

func (d *Desk) SaveVersion(ctx context.Context, input railmark.Version) (int64, error) {
	return d.store.SaveVersion(ctx, input)
}

func (d *Desk) SelectVersion(ctx context.Context, id int64) error {
	return d.store.SelectVersion(ctx, id)
}

func (d *Desk) SaveRequirement(ctx context.Context, input railmark.SaveRequirementInput) (int64, error) {
	return d.store.SaveRequirement(ctx, input)
}

func (d *Desk) Logs(ctx context.Context, id int64) ([]railmark.LogEntry, error) {
	return d.store.Logs(ctx, id)
}

func (d *Desk) AddNote(ctx context.Context, id int64, note string) error {
	return d.store.AddNote(ctx, id, note)
}

func (d *Desk) PickDirectory(ctx context.Context) (railmark.DirectoryPreview, error) {
	paths, err := mygo.Dialog.Open(mygo.OpenDialogOptions{
		Parent: mygo.CallerWindow(ctx), Title: "选择本地项目目录", Directory: true,
	})
	if err != nil || len(paths) == 0 {
		return railmark.DirectoryPreview{}, err
	}
	return d.store.PreviewDirectory(ctx, paths[0])
}

func (d *Desk) ImportProject(ctx context.Context, path string, projectID int64, name string) (railmark.Directory, error) {
	return d.store.ImportProject(ctx, path, projectID, name)
}

func (d *Desk) RenameProject(ctx context.Context, id int64, name string) error {
	return d.store.RenameProject(ctx, id, name)
}

func (d *Desk) GitOverview(ctx context.Context, versionID int64) ([]railmark.GitSnapshot, error) {
	return d.store.GitOverview(ctx, versionID)
}

func (d *Desk) InspectGit(ctx context.Context, directoryID int64, baseBranch string) (railmark.GitSnapshot, error) {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return railmark.GitSnapshot{}, err
	}
	return railmark.InspectGit(ctx, dir, baseBranch, true), nil
}

func (d *Desk) GitBranches(ctx context.Context, directoryID int64, path string) ([]railmark.GitBranch, error) {
	return d.store.GitBranches(ctx, directoryID, path)
}

func (d *Desk) CreateGitBranch(ctx context.Context, directoryID int64, path, name, startRef string) error {
	return d.store.CreateGitBranch(ctx, directoryID, path, name, startRef)
}

func (d *Desk) GitHistory(ctx context.Context, directoryID int64, ref string) (railmark.GitHistory, error) {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return railmark.GitHistory{}, err
	}
	return railmark.ReadGitHistory(ctx, dir, ref)
}

func (d *Desk) GitHistoryPage(ctx context.Context, directoryID int64, head, exclude string, offset int) (railmark.GitHistory, error) {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return railmark.GitHistory{}, err
	}
	return railmark.ReadGitHistoryPage(ctx, dir, head, exclude, offset)
}

func (d *Desk) GitCommitFiles(ctx context.Context, directoryID int64, hash string) (railmark.GitCommitFiles, error) {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return railmark.GitCommitFiles{}, err
	}
	return railmark.ReadGitCommitFiles(ctx, dir, hash)
}

func (d *Desk) GitFilePatch(ctx context.Context, directoryID int64, hash string, index int) (railmark.GitFilePatch, error) {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return railmark.GitFilePatch{}, err
	}
	return railmark.ReadGitFilePatch(ctx, dir, hash, index)
}

func (d *Desk) CopyText(value string) {
	mygo.Clipboard.WriteText(value)
}

func (d *Desk) OpenDirectory(ctx context.Context, directoryID int64) error {
	dir, err := d.store.Directory(ctx, directoryID)
	if err != nil {
		return err
	}
	return mygo.Shell.OpenPath(dir.Path)
}

func (d *Desk) OpenLink(value string) error {
	if !railmark.URLAllowed(value) {
		return errors.New("链接不可用")
	}
	return mygo.Shell.OpenExternal(value)
}
