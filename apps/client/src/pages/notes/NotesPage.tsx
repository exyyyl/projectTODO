import {
  ArrowLeft,
  Bold,
  FileText,
  Italic,
  List,
  MoreHorizontal,
  Plus,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import type { NoteId } from "@/entities/note/model/types";
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
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <div className="flex min-w-0 items-center gap-1">
            <Button aria-label="Назад к заметкам" onClick={() => setOpenNoteId(null)} size="icon-sm" variant="ghost">
              <ArrowLeft />
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <span className="max-w-64 truncate text-sm font-medium">
              {openNote.title || "Без названия"}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">Сохранено</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button aria-label="Отменить" size="icon-sm" variant="ghost"><Undo2 /></Button>
            <Button aria-label="Повторить" size="icon-sm" variant="ghost"><Redo2 /></Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button aria-label="Полужирный" size="icon-sm" variant="ghost"><Bold /></Button>
            <Button aria-label="Курсив" size="icon-sm" variant="ghost"><Italic /></Button>
            <Button aria-label="Зачёркнутый" size="icon-sm" variant="ghost"><Strikethrough /></Button>
            <Button aria-label="Список" size="icon-sm" variant="ghost"><List /></Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button aria-label="Другие действия" size="icon-sm" variant="ghost"><MoreHorizontal /></Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <article className="mx-auto min-h-full max-w-3xl px-10 pb-32 pt-16">
            <input
              aria-label="Заголовок заметки"
              className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
              onChange={(event) => updateNote(openNote.id, { title: event.target.value })}
              placeholder="Без названия"
              value={openNote.title}
            />
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-1.5 py-0.5">{openNote.tag}</span>
              <span>Обновлено {openNote.updatedAt.toLowerCase()}</span>
            </div>
            <textarea
              aria-label="Содержимое заметки"
              className="mt-10 min-h-[60vh] w-full resize-none bg-transparent text-base leading-8 text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => updateNote(openNote.id, { content: event.target.value })}
              placeholder="Начните писать или нажмите / для команд..."
              value={openNote.content}
            />
          </article>
        </main>
      </div>
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
