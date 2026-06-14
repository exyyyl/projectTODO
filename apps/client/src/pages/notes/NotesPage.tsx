import { FileText, Plus, Search, Star, X } from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NoteEditor } from "@/features/note-editor/NoteEditor";

const DEFAULT_PANEL_WIDTH = 330;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 520;
const COLLAPSE_THRESHOLD = 150;
const PANEL_WIDTH_KEY = "project-todo:notes-panel-width";

export function NotesPage() {
  const panelRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchResult, setSelectedSearchResult] = useState(0);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
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
  const filteredNotes = useMemo(
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
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("ru");
  const notes = useMemo(() => {
    if (!normalizedSearchQuery) return filteredNotes;

    return filteredNotes.filter((note) =>
      `${note.title} ${note.content} ${note.notebook} ${note.tag}`
        .toLocaleLowerCase("ru")
        .includes(normalizedSearchQuery),
    );
  }, [filteredNotes, normalizedSearchQuery]);
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

  useEffect(() => {
    setSelectedSearchResult(0);
  }, [searchQuery, activeNotesFilter]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLocaleLowerCase() !== "f") return;
      event.preventDefault();
      if (!isPanelOpen) animatePanel(true);
      window.setTimeout(() => searchInputRef.current?.focus(), isPanelOpen ? 0 : 260);
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [isPanelOpen, panelWidth]);

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

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSearchQuery("");
      searchInputRef.current?.blur();
      return;
    }

    if (!notes.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelectedSearchResult((current) => (current + direction + notes.length) % notes.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setActiveNote(notes[selectedSearchResult]?.id ?? notes[0].id);
      searchInputRef.current?.blur();
    }
  }

  function handleDeletePermanently(noteId: string) {
    setNoteToDelete(noteId);
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
          <label className="flex h-7 w-full items-center gap-2 rounded-md border border-transparent px-2 text-xs text-muted-foreground transition-colors focus-within:border-border focus-within:bg-sidebar-accent/60">
            <Search className="size-3.5" />
            <input
              aria-label="Найти заметку"
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Найти заметку"
              ref={searchInputRef}
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                aria-label="Очистить поиск"
                className="grid size-5 shrink-0 place-items-center rounded hover:bg-muted"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                type="button"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="ml-auto shrink-0 text-[10px]">Ctrl F</kbd>
            )}
          </label>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {notes.map((note, index) => (
            <button
              className={`group flex w-full items-start gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors ${
                (normalizedSearchQuery ? index === selectedSearchResult : note.id === activeNote?.id)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60"
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
          {normalizedSearchQuery && !notes.length && (
            <div className="px-3 py-10 text-center">
              <Search className="mx-auto size-5 text-muted-foreground/60" />
              <p className="mt-3 text-xs font-medium">Ничего не найдено</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Попробуйте изменить запрос</p>
            </div>
          )}
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
            {normalizedSearchQuery ? (
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Заметки не найдены</p>
                <button className="mt-2 text-xs hover:text-foreground" onClick={() => setSearchQuery("")} type="button">
                  Очистить поиск
                </button>
              </div>
            ) : activeNotesFilter === "trash-notes" ? (
              <span>Корзина пуста</span>
            ) : (
              <Button onClick={handleCreateNote} variant="outline"><Plus />Создать первую заметку</Button>
            )}
          </div>
        )}
      </section>
      <AlertDialog open={Boolean(noteToDelete)} onOpenChange={(open) => {
        if (!open) setNoteToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Заметка будет удалена с этого устройства без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (noteToDelete) deleteNotePermanently(noteToDelete);
                setNoteToDelete(null);
              }}
              variant="destructive"
            >
              Удалить заметку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
