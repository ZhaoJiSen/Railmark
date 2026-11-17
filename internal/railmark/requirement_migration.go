package railmark

import "database/sql"

func migrateRequirementCategory(tx *sql.Tx) error {
	var exists bool
	if err := tx.QueryRow("SELECT EXISTS (SELECT 1 FROM pragma_table_info('requirements') WHERE name='category')").Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	_, err := tx.Exec("ALTER TABLE requirements ADD COLUMN category TEXT NOT NULL DEFAULT '' CHECK (category IN ('', 'business', 'technical'))")
	return err
}
