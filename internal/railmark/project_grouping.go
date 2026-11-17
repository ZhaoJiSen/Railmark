package railmark

import "context"

func (s *Store) SetProjectGrouping(ctx context.Context, enabled bool) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO preferences (key, value)
		VALUES ('project_grouping', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, enabled)
	return err
}
