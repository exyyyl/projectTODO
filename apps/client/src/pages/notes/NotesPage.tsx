import { FileText, Plus, Search, Star } from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/features/note-editor/NoteEditor";

const DEFAULT_PANEL_WIDTH = 330;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 520;
const COLLAPSE_THRESHOLD = 150;
const PANEL_WIDTH_KEY = "project-todo:notes-panel-width";

export function NotesPage() {
  const panelRef = useRef<HTMLElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem(PANEL_WIDTH_KEY));
    return Number.isFinite(saved) && saved >= MIN_PANEL_WIDTH ? saved : DEFAULT_PANEL_WIDTH;
  });
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const allNotes = useAppStore((state) => state.notes);
  const activeNotesFilter = useAppStore((state) => state.activeSidebarItem.notes);
  const activeNoteId = useAppStore((state) => state.activeNoteIdByWorkspace[state.activeWorkspaceId]);
  const notebooks = useAppStore((state) => state.noteNotebooks[state.activeWorkspaceId] ?? []);
  const createNote = useAppStore((state) => state.createNote);
  const deleteNotePermanently = useAppStore((state) => state.deleteNotePermanently);
  const setActiveSidebarItem = useAppStore((state) => state.setActiveSidebarItem);
  const setActiveNote = useAppStore((state) => state.setActiveNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const notes = useMemo(
    () => allNotes.filter((note) => {
      if (note.workspaceId !== activeWorkspaceId) return false;
      if (activeNotesFilter === "trash-notes") return Boolean(note.deletedAt);
      if (note.deletedAt) return false;
      if (activeNotesFilter === "favorite-notes") return note.isFavorite;
      if (activeNotesFilter === "project-notes") return note.notebook === "Проект";
      if (activeNotesFilter === "study-notes") return note.notebook === "Учёба";
      if (activeNotesFilter.startsWith("notebook:")) return note.notebook === activeNotesFilter.slice("notebook:".length);
      return true;
    }),
    [activeNotesFilter, activeWorkspaceId, allNotes],
  );
  const activeNote = notes.find((note) => note.id === activeNoteId) ?? notes[0];

  useEffect(() => {
    if (activeNote?.id && activeNote.id !== activeNoteId) {
      setActiveNote(activeNote.id);
    }
  }, [activeNote?.id, activeNoteId, setActiveNote]);

  useEffect(() => {
    if (!activeNoteId && notes[0]) {
      setActiveNote(notes[0].id);
    }
  }, [activeNoteId, notes, setActiveNote]);

  function animatePanel(open: boolean) {
    const panel = panelRef.current;
    if (!panel) return;

    gsap.killTweensOf(panel);
    if (open) {
      setIsPanelOpen(true);
      gsap.fromTo(
        panel,
        { width: 0, autoAlpha: 0 },
        { width: panelWidth, autoAlpha: 1, duration: 0.26, ease: "power3.out" },
      );
    } else {
      gsap.to(panel, {
        width: 0,
        autoAlpha: 0,
        duration: 0.22,
        ease: "power3.inOut",
        onComplete: () => setIsPanelOpen(false),
      });
    }
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = panelRef.current?.getBoundingClientRect().width ?? panelWidth;
    let hasCollapsed = false;

    function cleanup() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    function handleMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(0, Math.min(MAX_PANEL_WIDTH, startWidth + moveEvent.clientX - startX));

      if (nextWidth < COLLAPSE_THRESHOLD) {
        hasCollapsed = true;
        cleanup();
        animatePanel(false);
        return;
      }

      if (panelRef.current) {
        gsap.set(panelRef.current, { width: Math.max(MIN_PANEL_WIDTH, nextWidth) });
      }
    }

    function handleUp(upEvent: PointerEvent) {
      if (hasCollapsed) return;
      const nextWidth = Math.max(0, Math.min(MAX_PANEL_WIDTH, startWidth + upEvent.clientX - startX));
      cleanup();

      if (nextWidth < COLLAPSE_THRESHOLD) {
        animatePanel(false);
        return;
      }

      const clampedWidth = Math.max(MIN_PANEL_WIDTH, nextWidth);
      setPanelWidth(clampedWidth);
      window.localStorage.setItem(PANEL_WIDTH_KEY, String(clampedWidth));
      gsap.to(panelRef.current, { width: clampedWidth, duration: 0.18, ease: "power2.out" });
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function handleCreateNote() {
    if (activeNotesFilter === "trash-notes" || activeNotesFilter === "favorite-notes") {
      setActiveSidebarItem("notes", "all-notes");
    }
    createNote();
    if (!isPanelOpen) animatePanel(true);
  }

  function handleDeletePermanently(noteId: string) {
    if (window.confirm("Удалить заметку навсегда? Это действие нельзя отменить.")) {
      deleteNotePermanently(noteId);
    }
  }

  const sectionTitle =
    activeNotesFilter === "favorite-notes"
      ? "Избранные"
      : activeNotesFilter === "trash-notes"
        ? "Корзина"
        : activeNotesFilter === "project-notes"
          ? "Проект"
            : activeNotesFilter === "study-notes"
              ? "Учёба"
              : activeNotesFilter.startsWith("notebook:")
                ? activeNotesFilter.slice("notebook:".length)
            : "Заметки";

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        className="relative flex h-full shrink-0 flex-col overflow-hidden border-r bg-sidebar"
        ref={panelRef}
        style={{ width: isPanelOpen ? panelWidth : 0 }}
      >
        <header className="flex h-11 shrink-0 items-center justify-between border-b px-3">
          <span className="text-sm font-medium">{sectionTitle}</span>
          {activeNotesFilter !== "trash-notes" && (
            <Button aria-label="Новая заметка" onClick={handleCreateNote} size="icon-sm" variant="ghost">
              <Plus />
            </Button>
          )}
        </header>
        <div className="border-b p-2">
          <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground hover:bg-sidebar-accent" type="button">
            <Search className="size-3.5" />
            Найти заметку
            <kbd className="ml-auto text-[10px]">Ctrl K</kbd>
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {notes.map((note) => (
            <button
              className={`group flex w-full items-start gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors ${
                note.id === activeNote?.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60"
              }`}
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              type="button"
            >
              <FileText className="mt-0.5 size-4 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="block min-w-0 flex-1 truncate text-sm font-medium text-foreground">{note.title || "Без названия"}</span>
                  {note.isFavorite && <Star className="size-3 shrink-0 fill-current text-muted-foreground" />}
                </span>
                <span className="mt-1 block truncate text-xs">{note.content || "Пустая заметка"}</span>
                <span className="mt-1.5 flex gap-2 text-[11px] opacity-70"><span>{note.notebook}</span><span>{note.updatedAt}</span></span>
              </span>
            </button>
          ))}
        </div>
        <div
          aria-label="Изменить ширину списка заметок"
          className="notes-panel-resizer"
          onPointerDown={startResize}
          role="separator"
        />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1">
        {activeNote ? (
          <NoteEditor
            isNotesPanelOpen={isPanelOpen}
            key={activeNote.id}
            note={activeNote}
            notebooks={notebooks}
            onDeletePermanently={() => handleDeletePermanently(activeNote.id)}
            onMoveToNotebook={(notebook) => updateNote(activeNote.id, { notebook })}
            onMoveToTrash={() => updateNote(activeNote.id, { deletedAt: new Date().toISOString() })}
            onRestore={() => updateNote(activeNote.id, { deletedAt: undefined })}
            onShowNotesPanel={() => animatePanel(true)}
            onToggleFavorite={() => updateNote(activeNote.id, { isFavorite: !activeNote.isFavorite })}
            onUpdate={(changes) => updateNote(activeNote.id, changes)}
          />
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            {activeNotesFilter === "trash-notes" ? (
              <span>Корзина пуста</span>
            ) : (
              <Button onClick={handleCreateNote} variant="outline"><Plus />Создать первую заметку</Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
