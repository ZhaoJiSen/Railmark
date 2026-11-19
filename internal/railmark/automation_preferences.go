package railmark

import (
	"context"
	"database/sql"
	"errors"
	"slices"
)

// Indices are stored in preferences. The first entry is the default.
var automationProviders = [...]string{"codex", "claude"}

func (s *Store) AutomationProvider(ctx context.Context) (string, error) {
	var value int
	err := s.db.QueryRowContext(ctx, "SELECT value FROM preferences WHERE key = 'automation_provider'").Scan(&value)
	if errors.Is(err, sql.ErrNoRows) {
		return automationProviders[0], nil
	}
	if err != nil {
		return "", err
	}
	if value < 0 || value >= len(automationProviders) {
		return automationProviders[0], nil
	}
	return automationProviders[value], nil
}

func (s *Store) SetAutomationProvider(ctx context.Context, provider string) error {
	value := slices.Index(automationProviders[:], provider)
	if value < 0 {
		return errors.New("无效的 AI 工具")
	}
	_, err := s.db.ExecContext(ctx, "INSERT INTO preferences (key, value) VALUES ('automation_provider', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", value)
	return err
}
