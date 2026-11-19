package railmark

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

// AutomationTarget resolves the selected delivery from saved workspace data.
func (s *Store) AutomationTarget(ctx context.Context, id, directoryID int64, group, expectedBranch string) (Requirement, Delivery, error) {
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return Requirement{}, Delivery{}, err
	}
	defer tx.Rollback()
	requirement, err := scanRequirement(tx.QueryRowContext(ctx, requirementSelect+" WHERE id=?", id))
	if errors.Is(err, sql.ErrNoRows) {
		return Requirement{}, Delivery{}, errors.New("需求已删除")
	}
	if err != nil {
		return Requirement{}, Delivery{}, err
	}
	delivery, err := scanDelivery(tx.QueryRowContext(ctx, "SELECT "+deliveryColumns+deliveryFrom+
		" WHERE d.requirement_id=? AND d.directory_id=? AND d.group_name=?", id, directoryID, group))
	if errors.Is(err, sql.ErrNoRows) {
		return Requirement{}, Delivery{}, errors.New("该项目目录已取消关联")
	}
	if err != nil {
		return Requirement{}, Delivery{}, err
	}
	if strings.TrimSpace(delivery.Branch) == "" || delivery.Branch != expectedBranch {
		return Requirement{}, Delivery{}, errors.New("请核对关联项目的开发分支后重试")
	}
	if err := tx.Commit(); err != nil {
		return Requirement{}, Delivery{}, err
	}
	return requirement, delivery, nil
}
