package railmark

import "database/sql"

func migrateRequirementSchema(tx *sql.Tx) error {
	if err := addRequirementColumn(tx, "category", "TEXT NOT NULL DEFAULT '' CHECK (category IN ('', 'business', 'technical'))"); err != nil {
		return err
	}
	return addRequirementColumn(tx, "implementation", "TEXT NOT NULL DEFAULT ''")
}

// Column names and definitions are fixed by the schema migrations above.
func addRequirementColumn(tx *sql.Tx, name, definition string) error {
	var exists bool
	if err := tx.QueryRow("SELECT EXISTS (SELECT 1 FROM pragma_table_info('requirements') WHERE name=?)", name).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	_, err := tx.Exec("ALTER TABLE requirements ADD COLUMN " + name + " " + definition)
	return err
}
