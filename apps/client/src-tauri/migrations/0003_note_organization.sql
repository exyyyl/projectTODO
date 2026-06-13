ALTER TABLE notes ADD COLUMN notebook TEXT NOT NULL DEFAULT 'Проект';
ALTER TABLE notes ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notes ADD COLUMN deleted_at TEXT;

UPDATE notes
SET notebook = CASE
    WHEN tag = 'Учёба' THEN 'Учёба'
    ELSE 'Проект'
END;

CREATE INDEX IF NOT EXISTS idx_notes_workspace_notebook
ON notes (workspace_id, notebook, updated_at_epoch DESC);

CREATE INDEX IF NOT EXISTS idx_notes_workspace_deleted
ON notes (workspace_id, deleted_at, updated_at_epoch DESC);
