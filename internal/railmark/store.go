package railmark

import (
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schema string

type Store struct {
	db        *sql.DB
	gitWrites sync.Map
}

func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	for _, pragma := range []string{"PRAGMA foreign_keys = ON", "PRAGMA busy_timeout = 4000", "PRAGMA journal_mode = WAL"} {
		if _, err := db.Exec(pragma); err != nil {
			db.Close()
			return nil, fmt.Errorf("初始化本地数据库：%w", err)
		}
	}

	tx, err := db.Begin()
	if err != nil {
		db.Close()
		return nil, err
	}
	if _, err := tx.Exec(schema); err != nil {
		tx.Rollback()
		db.Close()
		return nil, fmt.Errorf("创建数据库表：%w", err)
	}
	if err := migrateRequirementSchema(tx); err != nil {
		tx.Rollback()
		db.Close()
		return nil, fmt.Errorf("升级需求表：%w", err)
	}
	if err := tx.Commit(); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

type queryer interface {
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

type scanner interface {
	Scan(...any) error
}

func readRows[T any](ctx context.Context, db queryer, scan func(scanner) (T, error), query string, args ...any) ([]T, error) {
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	values := []T{}
	for rows.Next() {
		value, err := scan(rows)
		if err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, rows.Err()
}

func (s *Store) Workspace(ctx context.Context) (Workspace, error) {
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return Workspace{}, err
	}
	defer tx.Rollback()
	data, err := readWorkspace(ctx, tx)
	if err != nil {
		return data, err
	}
	return data, tx.Commit()
}

func readWorkspace(ctx context.Context, tx *sql.Tx) (Workspace, error) {
	var data Workspace
	var err error
	data.Versions, err = readRows(ctx, tx, scanVersion, versionSelect+" ORDER BY state, id DESC")
	if err != nil {
		return data, err
	}
	data.Requirements, err = readRows(ctx, tx, scanRequirement, requirementSelect+" ORDER BY updated_at DESC, id DESC")
	if err != nil {
		return data, err
	}
	data.Projects, err = readRows(ctx, tx, scanProject, "SELECT id, name FROM projects ORDER BY name COLLATE NOCASE, id")
	if err != nil {
		return data, err
	}

	directories, err := readRows(ctx, tx, scanDirectory, directorySelect+" ORDER BY id")
	if err != nil {
		return data, err
	}
	directoriesByProject := make(map[int64][]Directory)
	for _, d := range directories {
		directoriesByProject[d.ProjectID] = append(directoriesByProject[d.ProjectID], d)
	}
	for i := range data.Projects {
		data.Projects[i].Directories = append([]Directory{}, directoriesByProject[data.Projects[i].ID]...)
	}

	rows, err := tx.QueryContext(ctx, "SELECT d.requirement_id, "+deliveryColumns+deliveryFrom+" ORDER BY d.group_name DESC, p.name COLLATE NOCASE, dir.id")
	if err != nil {
		return data, err
	}
	deliveries := make(map[int64][]Delivery)
	for rows.Next() {
		var id int64
		d, err := scanDeliveryForRequirement(rows, &id)
		if err != nil {
			rows.Close()
			return data, err
		}
		deliveries[id] = append(deliveries[id], d)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return data, err
	}
	rows.Close()

	for i := range data.Requirements {
		data.Requirements[i].Projects = append([]Delivery{}, deliveries[data.Requirements[i].ID]...)
	}
	addBranchConflicts(&data)

	err = tx.QueryRowContext(ctx, `SELECT
		COALESCE((SELECT value FROM preferences WHERE key='last_version'), 0),
		COALESCE((SELECT value FROM preferences WHERE key='project_grouping'), 0) = 1`).
		Scan(&data.LastVersionID, &data.ProjectGrouping)
	return data, err
}

const versionSelect = "SELECT id, name, state, start_date, release_date, description FROM versions"

func scanVersion(row scanner) (Version, error) {
	var v Version
	err := row.Scan(&v.ID, &v.Name, &v.State, &v.StartDate, &v.ReleaseDate, &v.Description)
	return v, err
}

func (s *Store) SaveVersion(ctx context.Context, input Version) (int64, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)
	if input.Name == "" {
		return 0, errors.New("请填写版本名称")
	}
	if input.State != "open" && input.State != "released" {
		return 0, errors.New("请选择有效的版本状态")
	}
	for _, date := range []string{input.StartDate, input.ReleaseDate} {
		if date != "" {
			if _, err := time.Parse(time.DateOnly, date); err != nil {
				return 0, errors.New("版本日期格式有误")
			}
		}
	}
	if input.StartDate != "" && input.ReleaseDate != "" && input.StartDate > input.ReleaseDate {
		return 0, errors.New("发布日期需晚于或等于开始日期")
	}
	var id int64
	err := s.db.QueryRowContext(ctx, "SELECT id FROM versions WHERE name = ? AND id <> ?", input.Name, input.ID).Scan(&id)
	if err == nil {
		return 0, errors.New("版本名称已存在")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	}

	args := []any{input.Name, input.State, input.StartDate, input.ReleaseDate, input.Description}
	if input.ID == 0 {
		result, err := s.db.ExecContext(ctx, "INSERT INTO versions (name, state, start_date, release_date, description) VALUES (?, ?, ?, ?, ?)", args...)
		if err != nil {
			return 0, err
		}
		return result.LastInsertId()
	}
	result, err := s.db.ExecContext(ctx, "UPDATE versions SET name=?, state=?, start_date=?, release_date=?, description=? WHERE id=?", append(args, input.ID)...)
	if err != nil {
		return 0, err
	}
	if count, err := result.RowsAffected(); err != nil || count == 0 {
		return 0, errors.New("版本已不存在")
	}
	return input.ID, nil
}

func (s *Store) SelectVersion(ctx context.Context, id int64) error {
	result, err := s.db.ExecContext(ctx, `INSERT INTO preferences (key, value)
		SELECT 'last_version', id FROM versions WHERE id=?
		ON CONFLICT(key) DO UPDATE SET value=excluded.value`, id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errors.New("版本已不存在")
	}
	return err
}

func scanProject(row scanner) (Project, error) {
	p := Project{Directories: []Directory{}}
	err := row.Scan(&p.ID, &p.Name)
	return p, err
}

const directorySelect = "SELECT id, project_id, path, remote FROM directories"

func scanDirectory(row scanner) (Directory, error) {
	var d Directory
	err := row.Scan(&d.ID, &d.ProjectID, &d.Path, &d.Remote)
	return d, err
}

func (s *Store) Directory(ctx context.Context, id int64) (Directory, error) {
	d, err := scanDirectory(s.db.QueryRowContext(ctx, directorySelect+" WHERE id=?", id))
	if errors.Is(err, sql.ErrNoRows) {
		return Directory{}, errors.New("本地项目目录已不存在")
	}
	return d, err
}

func stamp() string {
	return time.Now().UTC().Format("2006-01-02T15:04:05.000000000Z")
}
