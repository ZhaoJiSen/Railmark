package railmark

import (
	"context"
	"database/sql"
	"errors"
)

func (s *Store) DeleteVersion(ctx context.Context, id int64, name string, requirementCount int) (Workspace, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Workspace{}, err
	}
	defer tx.Rollback()

	var count int
	err = tx.QueryRowContext(ctx, `SELECT COUNT(requirements.id)
		FROM versions LEFT JOIN requirements ON requirements.version_id=versions.id
		WHERE versions.id=? AND versions.name=? GROUP BY versions.id`, id, name).Scan(&count)
	if errors.Is(err, sql.ErrNoRows) {
		return Workspace{}, errors.New("版本已不存在或已重命名，请重新选择")
	}
	if err != nil {
		return Workspace{}, err
	}
	if count != requirementCount {
		return Workspace{}, errors.New("关联需求数量已变化，请核对后重新确认")
	}

	// Requirements and their dependent records are removed before the version for existing databases.
	if _, err := tx.ExecContext(ctx, "DELETE FROM requirements WHERE version_id=?", id); err != nil {
		return Workspace{}, err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM versions WHERE id=?", id); err != nil {
		return Workspace{}, err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM preferences WHERE key='last_version' AND value=?", id); err != nil {
		return Workspace{}, err
	}

	data, err := readWorkspace(ctx, tx)
	if err != nil {
		return Workspace{}, err
	}
	return data, tx.Commit()
}
