import type Database from "@tauri-apps/plugin-sql";

import type { Note, NoteId } from "@/entities/note/model/types";
import { isTauriRuntime } from "@/shared/lib/runtime";

const DATABASE_URL = "sqlite:project-todo.db";
const pendingSaves = new Map<NoteId, number>();
const pendingNotes = new Map<NoteId, Note>();
let databasePromise: Promise<Database> | undefined;

interface NoteRow {
  content: string;
  deletedAt: string | null;
  id: string;
  isFavorite: number;
  notebook: string;
  tag: string;
  title: string;
  updatedAt: string;
  workspaceId: string;
}

interface MetadataRow {
  value: string;
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = import("@tauri-apps/plugin-sql").then(({ default: Database }) => Database.load(DATABASE_URL));
  }
  return databasePromise;
}

export async function initializeNotes(fallbackNotes: Note[]) {
  const normalizedFallbackNotes = fallbackNotes.map(normalizeNote);
  if (!isTauriRuntime()) return normalizedFallbackNotes;

  const database = await getDatabase();
  const storedNotes = await selectNotes(database);
  const initializationMarker = await database.select<MetadataRow[]>(
    "SELECT value FROM app_metadata WHERE key = $1",
    ["notes_initialized"],
  );

  if (initializationMarker[0]?.value === "true") return storedNotes;

  if (storedNotes.length === 0) await Promise.all(normalizedFallbackNotes.map((note) => saveNote(note)));
  await database.execute(
    "INSERT OR REPLACE INTO app_metadata (key, value) VALUES ($1, $2)",
    ["notes_initialized", "true"],
  );
  return storedNotes.length > 0 ? storedNotes : selectNotes(database);
}

function normalizeNote(note: Note): Note {
  return {
    ...note,
    notebook: note.notebook || (note.tag === "Учёба" ? "Учёба" : "Проект"),
    isFavorite: note.isFavorite ?? false,
  };
}

export async function saveNote(note: Note) {
  if (!isTauriRuntime()) return;

  const database = await getDatabase();
  await database.execute(
    `INSERT INTO notes (
       id, workspace_id, title, content, tag, notebook, is_favorite, deleted_at, updated_at, updated_at_epoch
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       workspace_id = excluded.workspace_id,
       title = excluded.title,
       content = excluded.content,
       tag = excluded.tag,
       notebook = excluded.notebook,
       is_favorite = excluded.is_favorite,
       deleted_at = excluded.deleted_at,
       updated_at = excluded.updated_at,
       updated_at_epoch = unixepoch()`,
    [
      note.id,
      note.workspaceId,
      note.title,
      note.content,
      note.tag,
      note.notebook,
      note.isFavorite ? 1 : 0,
      note.deletedAt ?? null,
      note.updatedAt,
    ],
  );
}

export async function deleteStoredNote(noteId: NoteId) {
  if (!isTauriRuntime()) return;

  const pendingSave = pendingSaves.get(noteId);
  if (pendingSave) window.clearTimeout(pendingSave);
  pendingSaves.delete(noteId);
  pendingNotes.delete(noteId);

  const database = await getDatabase();
  await database.execute("DELETE FROM notes WHERE id = $1", [noteId]);
}

export async function deleteStoredWorkspaceNotes(workspaceId: string) {
  if (!isTauriRuntime()) return;
  const db = await getDatabase();
  await db.execute("DELETE FROM notes WHERE workspace_id = $1", [workspaceId]);
}

export function scheduleNoteSave(note: Note) {
  if (!isTauriRuntime()) return;

  const pendingSave = pendingSaves.get(note.id);
  if (pendingSave) window.clearTimeout(pendingSave);

  pendingSaves.set(
    note.id,
    window.setTimeout(() => {
      pendingSaves.delete(note.id);
      pendingNotes.delete(note.id);
      void saveNote(note).catch((error) => console.error("Failed to save note", error));
    }, 400),
  );
  pendingNotes.set(note.id, note);
}

export async function flushPendingNotes() {
  if (!isTauriRuntime() || pendingNotes.size === 0) return;

  for (const pendingSave of pendingSaves.values()) window.clearTimeout(pendingSave);
  pendingSaves.clear();

  const notes = [...pendingNotes.values()];
  pendingNotes.clear();
  await Promise.all(notes.map(saveNote));
}

export async function clearStoredNotes() {
  if (!isTauriRuntime()) return;

  for (const pendingSave of pendingSaves.values()) window.clearTimeout(pendingSave);
  pendingSaves.clear();
  pendingNotes.clear();

  const database = await getDatabase();
  await database.execute("DELETE FROM notes");
}

async function selectNotes(database: Database) {
  const rows = await database.select<NoteRow[]>(
    `SELECT
       id,
       workspace_id AS "workspaceId",
       title,
       content,
       tag,
       notebook,
       is_favorite AS "isFavorite",
       deleted_at AS "deletedAt",
       updated_at AS "updatedAt"
     FROM notes
     ORDER BY updated_at_epoch DESC, created_at DESC`,
  );

  return rows.map((row): Note => ({
    ...row,
    deletedAt: row.deletedAt ?? undefined,
    isFavorite: Boolean(row.isFavorite),
  }));
}
