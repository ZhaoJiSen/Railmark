CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL CHECK (state IN ('open', 'released')),
    start_date TEXT NOT NULL DEFAULT '',
    release_date TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS directories (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    path TEXT NOT NULL UNIQUE,
    remote TEXT NOT NULL DEFAULT '',
    common_dir TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS directories_project ON directories(project_id);
CREATE INDEX IF NOT EXISTS directories_common ON directories(common_dir);
CREATE INDEX IF NOT EXISTS directories_remote ON directories(remote);

CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id),
    title TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL CHECK (state IN ('todo', 'in_progress', 'testing', 'done')),
    background TEXT NOT NULL DEFAULT '',
    scope TEXT NOT NULL DEFAULT '',
    acceptance TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS requirements_version ON requirements(version_id);

CREATE TABLE IF NOT EXISTS deliveries (
    requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    directory_id INTEGER NOT NULL REFERENCES directories(id),
    group_name TEXT NOT NULL CHECK (group_name IN ('frontend', 'backend')),
    state TEXT NOT NULL CHECK (state IN ('todo', 'in_progress', 'testing', 'done')),
    branch TEXT NOT NULL DEFAULT '',
    base_branch TEXT NOT NULL DEFAULT '',
    push_target TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (requirement_id, directory_id, group_name)
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY,
    requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('system', 'note')),
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS logs_requirement ON logs(requirement_id, id DESC);

CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
);
