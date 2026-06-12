import { FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import type { NoteId } from "@/entities/note/model/types";
import { NoteEditor } from "@/features/note-editor/NoteEditor";
import { WorkspacePageLayout } from "@/shared/ui/workspace-page-layout";

export function NotesPage() {
  const [openNoteId, setOpenNoteId] = useState<NoteId | null>(null);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const allNotes = useAppStore((state) => state.notes);
  const notes = useMemo(
    () => allNotes.filter((note) => note.workspaceId === activeWorkspaceId),
    [activeWorkspaceId, allNotes],
  );
  const activeNoteId = useAppStore(
    (state) => state.activeNoteIdByWorkspace[state.activeWorkspaceId],
  );
  const createNote = useAppStore((state) => state.createNote);
  const setActiveNote = useAppStore((state) => state.setActiveNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const openNote = notes.find((note) => note.id === openNoteId);

  function handleCreateNote() {
    createNote();
    window.setTimeout(() => {
      const state = useAppStore.getState();
      setOpenNoteId(state.activeNoteIdByWorkspace[state.activeWorkspaceId] ?? null);
    }, 0);
  }

  function handleOpenNote(noteId: NoteId) {
    setActiveNote(noteId);
    setOpenNoteId(noteId);
  }

  if (openNote) {
    return (
      <NoteEditor
        note={openNote}
        onBack={() => setOpenNoteId(null)}
        onUpdate={(changes) => updateNote(openNote.id, changes)}
      />
    );
  }

  return (
    <WorkspacePageLayout
      actions={
        <Button onClick={handleCreateNote}>
          <Plus />
          Новая заметка
        </Button>
      }
      description="Идеи, конспекты и связанные материалы пространства."
      title="Заметки"
    >
      {notes.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-xl border border-dashed">
          <div className="text-center">
            <FileText className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Заметок пока нет</p>
            <p className="mt-1 text-xs text-muted-foreground">Создайте первую заметку в этом пространстве.</p>
            <Button className="mt-4" onClick={handleCreateNote} variant="outline">
              <Plus />
              Новая заметка
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {notes.map((note) => (
            <button
              className="group flex min-h-36 items-start gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              key={note.id}
              onClick={() => handleOpenNote(note.id)}
              type="button"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-medium">{note.title || "Без названия"}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {note.content || "Пустая заметка"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5">{note.tag}</span>
                  <span>{note.updatedAt}</span>
                  {note.id === activeNoteId && <span className="ml-auto">Последняя открытая</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </WorkspacePageLayout>
  );
}
