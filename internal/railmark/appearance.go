package railmark

import (
	"context"
	"database/sql"
	"errors"
	"slices"
)

// The position of each mode is its value in the preferences table.
var appearanceModes = [...]string{"system", "light", "dark"}

func (s *Store) Appearance(ctx context.Context) (string, error) {
	var value int
	err := s.db.QueryRowContext(ctx, "SELECT value FROM preferences WHERE key = 'appearance'").Scan(&value)
	if errors.Is(err, sql.ErrNoRows) {
		return appearanceModes[0], nil
	}
	if err != nil {
		return "", err
	}
	if value < 0 || value >= len(appearanceModes) {
		return appearanceModes[0], nil
	}
	return appearanceModes[value], nil
}

func (s *Store) SetAppearance(ctx context.Context, mode string) error {
	value := slices.Index(appearanceModes[:], mode)
	if value < 0 {
		return errors.New("无效的外观选项")
	}
	_, err := s.db.ExecContext(ctx, "INSERT INTO preferences (key, value) VALUES ('appearance', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", value)
	return err
}
