package railmark

import (
	"context"
	"database/sql"
	"errors"
)

func (s *Store) UpdateRequirementState(ctx context.Context, id int64, state string) (Workspace, error) {
	if stateLabels[state] == "" {
		return Workspace{}, errors.New("请选择有效的需求状态")
	}

	return s.applyRequirementEdit(ctx, id, func(tx *sql.Tx, now string) (string, error) {
		var before string
		if err := tx.QueryRowContext(ctx, "SELECT state FROM requirements WHERE id=?", id).Scan(&before); err != nil {
			return "", err
		}
		if before == state {
			return "", nil
		}
		_, err := tx.ExecContext(ctx, "UPDATE requirements SET state=?, updated_at=? WHERE id=?", state, now, id)
		return transition("状态", stateLabels[before], stateLabels[state]), err
	})
}

func (s *Store) UpdateDeliveryField(ctx context.Context, id, directoryID int64, group, field, value string) (Workspace, error) {
	if groupLabels[group] == "" {
		return Workspace{}, errors.New("请选择有效的项目分组")
	}
	var update string
	switch field {
	case "state":
		if stateLabels[value] == "" {
			return Workspace{}, errors.New("请选择有效的交付状态")
		}
		update = "UPDATE deliveries SET state=?"
	case "branch":
		value = localBranchName(value)
		update = "UPDATE deliveries SET branch=?"
	default:
		return Workspace{}, errors.New("该交付字段不可修改")
	}

	return s.applyRequirementEdit(ctx, id, func(tx *sql.Tx, now string) (string, error) {
		const key = " WHERE d.requirement_id=? AND d.directory_id=? AND d.group_name=?"
		delivery, err := scanDelivery(tx.QueryRowContext(ctx, "SELECT "+deliveryColumns+deliveryFrom+key, id, directoryID, group))
		if err != nil {
			return "", err
		}
		label := delivery.ProjectName + "（" + groupLabels[group] + "）"
		before, after := localBranchName(delivery.Branch), value
		if field == "state" {
			label += " 进度"
			before, after = stateLabels[delivery.State], stateLabels[value]
		} else {
			label += " 开发分支"
		}
		if before == after {
			return "", nil
		}
		if _, err := tx.ExecContext(ctx, update+" WHERE requirement_id=? AND directory_id=? AND group_name=?", value, id, directoryID, group); err != nil {
			return "", err
		}
		if _, err := tx.ExecContext(ctx, "UPDATE requirements SET updated_at=? WHERE id=?", now, id); err != nil {
			return "", err
		}
		return transition(label, before, after), nil
	})
}

func (s *Store) applyRequirementEdit(ctx context.Context, id int64, edit func(*sql.Tx, string) (string, error)) (Workspace, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Workspace{}, err
	}
	defer tx.Rollback()

	now := stamp()
	message, err := edit(tx, now)
	if errors.Is(err, sql.ErrNoRows) {
		return Workspace{}, errors.New("需求或关联项目已不存在")
	}
	if err != nil {
		return Workspace{}, err
	}
	if message != "" {
		if err := writeLog(ctx, tx, id, "system", message, now); err != nil {
			return Workspace{}, err
		}
	}
	data, err := readWorkspace(ctx, tx)
	if err != nil {
		return Workspace{}, err
	}
	return data, tx.Commit()
}
