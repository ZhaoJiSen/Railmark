package railmark

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type scannedDirectory struct {
	DirectoryPreview
	commonDir string
}

func canonicalDirectory(path string) (string, error) {
	if !filepath.IsAbs(path) {
		return "", errors.New("请选择一个本地文件夹")
	}
	path, err := filepath.EvalSymlinks(filepath.Clean(path))
	if err != nil {
		return "", errors.New("无法访问本地目录，请检查路径和权限")
	}
	info, err := os.Stat(path)
	if err != nil || !info.IsDir() {
		return "", errors.New("本地目录不可用")
	}
	return path, nil
}

func inspectDirectory(ctx context.Context, path string) (scannedDirectory, error) {
	path, err := canonicalDirectory(path)
	if err != nil {
		return scannedDirectory{}, err
	}
	result := scannedDirectory{DirectoryPreview: DirectoryPreview{Path: path, Name: filepath.Base(path)}}
	root, err := git(ctx, path, "rev-parse", "--show-toplevel")
	if err != nil {
		return result, nil
	}

	rootPath, err := canonicalDirectory(gitLine(root))
	if err != nil {
		return scannedDirectory{}, err
	}
	result.Path = rootPath
	result.Name = filepath.Base(rootPath)
	result.Remote = remoteURL(ctx, rootPath)
	if output, err := git(ctx, rootPath, "rev-parse", "--path-format=absolute", "--git-common-dir"); err == nil {
		result.commonDir = gitLine(output)
	}
	if output, err := git(ctx, rootPath, "symbolic-ref", "--quiet", "--short", "HEAD"); err == nil {
		result.Branch = gitLine(output)
	}
	return result, nil
}

func matchDirectory(ctx context.Context, db queryer, probe scannedDirectory) (Directory, error) {
	d, err := scanDirectory(db.QueryRowContext(ctx, directorySelect+" WHERE path=?", probe.Path))
	if err == nil || !errors.Is(err, sql.ErrNoRows) {
		return d, err
	}
	d, err = scanDirectory(db.QueryRowContext(ctx, directorySelect+
		" WHERE (common_dir <> '' AND common_dir=?) OR (remote <> '' AND remote=?) ORDER BY common_dir=? DESC, id LIMIT 1",
		probe.commonDir, probe.Remote, probe.commonDir))
	return Directory{ProjectID: d.ProjectID}, err
}

func (s *Store) PreviewDirectory(ctx context.Context, path string) (DirectoryPreview, error) {
	probe, err := inspectDirectory(ctx, path)
	if err != nil {
		return DirectoryPreview{}, err
	}
	d, err := matchDirectory(ctx, s.db, probe)
	if errors.Is(err, sql.ErrNoRows) {
		return probe.DirectoryPreview, nil
	}
	if err != nil {
		return DirectoryPreview{}, err
	}
	if d.ProjectID != 0 {
		probe.ProjectID, probe.DirectoryID = d.ProjectID, d.ID
		err = s.db.QueryRowContext(ctx, "SELECT name FROM projects WHERE id=?", d.ProjectID).Scan(&probe.Name)
	}
	return probe.DirectoryPreview, err
}

func saveDirectory(ctx context.Context, tx *sql.Tx, probe scannedDirectory, projectID int64, name string) (Directory, error) {
	match, err := matchDirectory(ctx, tx, probe)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return Directory{}, err
	}
	if projectID != 0 && match.ProjectID != 0 && match.ProjectID != projectID {
		return Directory{}, errors.New("这个目录已归属其他项目")
	}
	if match.ID != 0 {
		return match, nil
	}
	if projectID == 0 {
		projectID = match.ProjectID
	}
	if projectID == 0 {
		name = strings.TrimSpace(name)
		if name == "" {
			name = probe.Name
		}
		result, err := tx.ExecContext(ctx, "INSERT INTO projects (name) VALUES (?)", name)
		if err != nil {
			return Directory{}, err
		}
		projectID, err = result.LastInsertId()
		if err != nil {
			return Directory{}, err
		}
	}
	result, err := tx.ExecContext(ctx, "INSERT INTO directories (project_id, path, remote, common_dir) VALUES (?, ?, ?, ?)",
		projectID, probe.Path, probe.Remote, probe.commonDir)
	if err != nil {
		return Directory{}, err
	}
	id, err := result.LastInsertId()
	return Directory{ID: id, ProjectID: projectID, Path: probe.Path, Remote: probe.Remote}, err
}

func (s *Store) ImportProject(ctx context.Context, path string, projectID int64, name string) (Directory, error) {
	probe, err := inspectDirectory(ctx, path)
	if err != nil {
		return Directory{}, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Directory{}, err
	}
	defer tx.Rollback()
	d, err := saveDirectory(ctx, tx, probe, projectID, name)
	if err != nil {
		return Directory{}, err
	}
	return d, tx.Commit()
}

func (s *Store) RenameProject(ctx context.Context, id int64, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New("请填写项目名称")
	}
	result, err := s.db.ExecContext(ctx, "UPDATE projects SET name=? WHERE id=?", name, id)
	if err != nil {
		return err
	}
	if count, err := result.RowsAffected(); err != nil || count == 0 {
		return errors.New("项目已不存在")
	}
	return nil
}
