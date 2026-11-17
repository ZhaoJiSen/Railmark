package railmark

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

const requirementSelect = `SELECT id, version_id, title, direction, state, background, scope, acceptance,
    source_url, updated_at, COALESCE((SELECT text FROM logs
    WHERE requirement_id=requirements.id ORDER BY id DESC LIMIT 1), '') FROM requirements`
const deliveryColumns = "dir.id, p.id, p.name, dir.path, d.group_name, d.state, d.branch, d.base_branch, d.push_target"
const deliveryFrom = " FROM deliveries d JOIN directories dir ON dir.id=d.directory_id JOIN projects p ON p.id=dir.project_id"

func scanRequirement(row scanner) (Requirement, error) {
	var r Requirement
	err := row.Scan(&r.ID, &r.VersionID, &r.Title, &r.Direction, &r.State, &r.Background, &r.Scope, &r.Acceptance, &r.SourceURL, &r.UpdatedAt, &r.LatestLog)
	return r, err
}

func deliveryFields(d *Delivery) []any {
	return []any{&d.DirectoryID, &d.ProjectID, &d.ProjectName, &d.Path, &d.Group, &d.State, &d.Branch, &d.BaseBranch, &d.PushTarget}
}

func scanDelivery(row scanner) (Delivery, error) {
	d := Delivery{Conflicts: []string{}}
	err := row.Scan(deliveryFields(&d)...)
	return d, err
}

func scanDeliveryForRequirement(row scanner, id *int64) (Delivery, error) {
	d := Delivery{Conflicts: []string{}}
	err := row.Scan(append([]any{id}, deliveryFields(&d)...)...)
	return d, err
}

func (s *Store) SaveRequirement(ctx context.Context, input SaveRequirementInput) (int64, error) {
	if err := normalizeRequirement(&input); err != nil {
		return 0, err
	}
	probes := make([]scannedDirectory, len(input.Projects))
	for i, link := range input.Projects {
		if link.DirectoryID == 0 {
			probe, err := inspectDirectory(ctx, link.Path)
			if err != nil {
				return 0, fmt.Errorf("%s：%w", link.Path, err)
			}
			probes[i] = probe
		}
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	target, err := scanVersion(tx.QueryRowContext(ctx, versionSelect+" WHERE id=?", input.VersionID))
	if errors.Is(err, sql.ErrNoRows) {
		return 0, errors.New("请选择有效的版本")
	}
	if err != nil {
		return 0, err
	}

	var previous Requirement
	if input.ID != 0 {
		previous, err = scanRequirement(tx.QueryRowContext(ctx, requirementSelect+" WHERE id=?", input.ID))
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("需求已不存在")
		}
		if err != nil {
			return 0, err
		}
		previous.Projects, err = readRows(ctx, tx, scanDelivery, "SELECT "+deliveryColumns+deliveryFrom+" WHERE d.requirement_id=?", input.ID)
		if err != nil {
			return 0, err
		}
	}

	now := stamp()
	id, err := writeRequirement(ctx, tx, input, now)
	if err != nil {
		return 0, err
	}
	deliveries, err := saveDeliveries(ctx, tx, id, input.Projects, probes, previous.Projects)
	if err != nil {
		return 0, err
	}
	message := "创建需求"
	if previous.ID != 0 {
		oldVersion, err := scanVersion(tx.QueryRowContext(ctx, versionSelect+" WHERE id=?", previous.VersionID))
		if err != nil {
			return 0, err
		}
		message = summarizeChanges(previous, input, deliveries, oldVersion.Name, target.Name)
	}
	if message != "" {
		if err := writeLog(ctx, tx, id, "system", message, now); err != nil {
			return 0, err
		}
	}
	return id, tx.Commit()
}

func writeRequirement(ctx context.Context, tx *sql.Tx, input SaveRequirementInput, now string) (int64, error) {
	args := []any{input.VersionID, input.Title, input.Direction, input.State, input.Background, input.Scope, input.Acceptance, input.SourceURL, now}
	if input.ID == 0 {
		res, err := tx.ExecContext(ctx, `INSERT INTO requirements
            (version_id,title,direction,state,background,scope,acceptance,source_url,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?)`, args...)
		if err != nil {
			return 0, err
		}
		return res.LastInsertId()
	}
	_, err := tx.ExecContext(ctx, `UPDATE requirements SET version_id=?, title=?, direction=?, state=?,
        background=?, scope=?, acceptance=?, source_url=?, updated_at=? WHERE id=?`, append(args, input.ID)...)
	return input.ID, err
}

type deliveryKey struct {
	directoryID int64
	group       string
}

func saveDeliveries(ctx context.Context, tx *sql.Tx, id int64, links []ProjectLink, probes []scannedDirectory, previous []Delivery) ([]Delivery, error) {
	known := make(map[int64]bool)
	for _, d := range previous {
		known[d.DirectoryID] = true
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM deliveries WHERE requirement_id=?", id); err != nil {
		return nil, err
	}

	deliveries := make([]Delivery, 0, len(links))
	seen := make(map[deliveryKey]bool)
	for i, link := range links {
		dir, err := resolveDirectory(ctx, tx, link, probes[i], known)
		if err != nil {
			return nil, err
		}
		key := deliveryKey{dir.ID, link.Group}
		if seen[key] {
			return nil, errors.New("同一组中重复关联了同一个项目目录")
		}
		seen[key] = true
		_, err = tx.ExecContext(ctx, `INSERT INTO deliveries
            (requirement_id,directory_id,group_name,state,branch,base_branch,push_target) VALUES (?,?,?,?,?,?,?)`,
			id, dir.ID, link.Group, link.State, link.Branch, link.BaseBranch, link.PushTarget)
		if err != nil {
			return nil, err
		}
		d, err := scanDelivery(tx.QueryRowContext(ctx, "SELECT "+deliveryColumns+deliveryFrom+
			" WHERE d.requirement_id=? AND d.directory_id=? AND d.group_name=?", id, dir.ID, link.Group))
		if err != nil {
			return nil, err
		}
		deliveries = append(deliveries, d)
	}
	return deliveries, nil
}

func resolveDirectory(ctx context.Context, tx *sql.Tx, link ProjectLink, probe scannedDirectory, known map[int64]bool) (Directory, error) {
	if link.DirectoryID == 0 {
		return saveDirectory(ctx, tx, probe, link.ProjectID, link.ProjectName)
	}
	dir, err := scanDirectory(tx.QueryRowContext(ctx, directorySelect+" WHERE id=?", link.DirectoryID))
	if errors.Is(err, sql.ErrNoRows) {
		return Directory{}, errors.New("所选项目目录已不存在")
	}
	if err != nil {
		return Directory{}, err
	}
	if !known[dir.ID] {
		if _, err := canonicalDirectory(dir.Path); err != nil {
			return Directory{}, fmt.Errorf("%s：%w", dir.Path, err)
		}
	}
	return dir, err
}

func (s *Store) Logs(ctx context.Context, id int64) ([]LogEntry, error) {
	return readRows(ctx, s.db, func(row scanner) (LogEntry, error) {
		var entry LogEntry
		err := row.Scan(&entry.ID, &entry.Kind, &entry.Text, &entry.CreatedAt)
		return entry, err
	}, "SELECT id, kind, text, created_at FROM logs WHERE requirement_id=? ORDER BY id DESC", id)
}

func (s *Store) AddNote(ctx context.Context, id int64, note string) error {
	note = strings.TrimSpace(note)
	if note == "" {
		return errors.New("请填写日志内容")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	now := stamp()
	result, err := tx.ExecContext(ctx, "UPDATE requirements SET updated_at=? WHERE id=?", now, id)
	if err != nil {
		return err
	}
	if count, err := result.RowsAffected(); err != nil || count == 0 {
		return errors.New("需求已不存在")
	}
	if err := writeLog(ctx, tx, id, "note", note, now); err != nil {
		return err
	}
	return tx.Commit()
}

func writeLog(ctx context.Context, tx *sql.Tx, id int64, kind, message, createdAt string) error {
	_, err := tx.ExecContext(ctx, "INSERT INTO logs (requirement_id,kind,text,created_at) VALUES (?,?,?,?)", id, kind, message, createdAt)
	return err
}
