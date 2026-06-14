import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  File,
  FileText,
  FolderClosed,
  Home,
  Inbox,
  LayoutGrid,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { type WorkspaceView, useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSwitcher } from "@/features/workspace-switcher/WorkspaceSwitcher";
import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { SettingsPage, SettingsSidebar, type SettingsSection } from "@/features/settings/SettingsView";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { sidebarByView } from "@/shared/config/navigation";

const icons = {
  inbox: Inbox,
  archive: Archive,
  calendar: CalendarDays,
  check: CheckCircle2,
  clock: Clock3,
  file: File,
  folder: FolderClosed,
  layout: LayoutGrid,
  star: Star,
  tag: Tag,
} as const;

const layoutOptions = [
  { id: "notes", label: "Заметки", icon: FileText },
  { id: "tasks", label: "Тудушка", icon: ListTodo },
  { id: "files", label: "Файлы", icon: LayoutGrid },
] as const;

type AppTab = {
  id: string;
  kind: "home" | "notes" | "settings";
  label: string;
};

export function AppShell() {
  const [tabs, setTabs] = useState<AppTab[]>([{ id: "view-notes", kind: "notes", label: "Заметки" }]);
  const [activeTabId, setActiveTabId] = useState<string | null>("view-notes");
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("appearance");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [notebookName, setNotebookName] = useState("");
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const previousSidebarStateRef = useRef<boolean | null>(null);
  const tabElementsRef = useRef(new Map<string, HTMLDivElement>());
  const previousTabPositionsRef = useRef(new Map<string, DOMRect>());
  const activeView = useAppStore((state) => state.activeView);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const activeSidebarItem = useAppStore((state) => state.activeSidebarItem[activeView]);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const createNote = useAppStore((state) => state.createNote);
  const createNoteNotebook = useAppStore((state) => state.createNoteNotebook);
  const createTask = useAppStore((state) => state.createTask);
  const areAnimationsEnabled = useAppStore((state) => state.areAnimationsEnabled);
  const setActiveSidebarItem = useAppStore((state) => state.setActiveSidebarItem);
  const noteNotebooks = useAppStore((state) => state.noteNotebooks[state.activeWorkspaceId] ?? []);
  const activeNoteTitle = useAppStore((state) => {
    const activeNoteId = state.activeNoteIdByWorkspace[state.activeWorkspaceId];
    return state.notes.find((note) => note.id === activeNoteId)?.title;
  });
  const sidebarSections = sidebarByView[activeView];
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const isSettingsOpen = activeTab?.kind === "settings";
  const isProductionLocked = !import.meta.env.DEV;

  useEffect(() => {
    if (isSettingsOpen) return;
    if (activeView !== "notes") {
      if (activeTabId === "view-notes") setActiveTabId(null);
      return;
    }
    const noteTab = tabs.find((tab) => tab.kind === "notes");
    if (noteTab) setActiveTabId(noteTab.id);
    else {
      setTabs((current) => [...current, { id: "view-notes", kind: "notes", label: "Заметки" }]);
      setActiveTabId("view-notes");
    }
  }, [activeTabId, activeView, isSettingsOpen, tabs]);

  useEffect(() => {
    if (isProductionLocked && (activeView === "tasks" || activeView === "files")) openHome();
  }, [activeView, isProductionLocked]);

  function activateTab(tab: AppTab) {
    setActiveTabId(tab.id);
    setActiveView(tab.kind === "settings" ? activeView : tab.kind);
  }

  function openNewTab() {
    const tab: AppTab = {
      id: `home-${crypto.randomUUID()}`,
      kind: "home",
      label: "Новая вкладка",
    };
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    setActiveView("home");
  }

  function navigateToView(view: Exclude<WorkspaceView, "home">) {
    if (isProductionLocked && (view === "tasks" || view === "files")) return;
    setActiveView(view);
    if (view !== "notes") setActiveTabId(null);
  }

  function openSettingsTab() {
    const existing = tabs.find((tab) => tab.kind === "settings");
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const tab: AppTab = { id: "settings", kind: "settings", label: "Настройки" };
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    setSidebarOpen(true);
  }

  function openHome() {
    setActiveTabId(null);
    setActiveView("home");
  }

  function closeTab(tabId: string) {
    setTabs((current) => {
      const closingIndex = current.findIndex((tab) => tab.id === tabId);
      const remaining = current.filter((tab) => tab.id !== tabId);
      if (tabId === activeTabId) {
        const fallback = remaining[Math.min(closingIndex, remaining.length - 1)];
        if (fallback) activateTab(fallback);
        else setActiveTabId(null);
      }
      return remaining;
    });
  }

  function moveTab(draggedId: string, targetTabId: string) {
    if (draggedId === targetTabId) return;
    previousTabPositionsRef.current = new Map(
      [...tabElementsRef.current].map(([id, element]) => [id, element.getBoundingClientRect()]),
    );
    setTabs((current) => {
      const from = current.findIndex((tab) => tab.id === draggedId);
      const to = current.findIndex((tab) => tab.id === targetTabId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [dragged] = next.splice(from, 1);
      next.splice(to, 0, dragged);
      return next;
    });
  }

  function startTabDrag(event: React.PointerEvent<HTMLDivElement>, tabId: string) {
    if (tabs.length < 2 || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('[aria-label^="Закрыть вкладку"]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedTabId(tabId);

    function handleMove(moveEvent: PointerEvent) {
      const target = [...tabElementsRef.current].find(([id, element]) => {
        if (id === tabId) return false;
        const rect = element.getBoundingClientRect();
        return moveEvent.clientX >= rect.left && moveEvent.clientX <= rect.right;
      });
      if (target) moveTab(tabId, target[0]);
    }

    function handleUp() {
      setDraggedTabId(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  useLayoutEffect(() => {
    const previous = previousTabPositionsRef.current;
    tabElementsRef.current.forEach((element, id) => {
      const previousRect = previous.get(id);
      if (!previousRect) return;
      const nextRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      if (deltaX) gsap.fromTo(element, { x: deltaX }, { x: 0, duration: 0.24, ease: "power3.out", clearProps: "transform" });
    });
    previousTabPositionsRef.current.clear();
  }, [tabs]);

  useEffect(() => {
    const layout = layoutRef.current;
    const sidebar = sidebarRef.current;
    const sidebarContent = sidebarContentRef.current;

    if (!layout || !sidebar || !sidebarContent) {
      return;
    }

    if (previousSidebarStateRef.current === null || previousSidebarStateRef.current === isSidebarOpen) {
      previousSidebarStateRef.current = isSidebarOpen;
      gsap.set(layout, { gridTemplateColumns: isSidebarOpen ? "240px minmax(0, 1fr)" : "0px minmax(0, 1fr)" });
      gsap.set(sidebar, { visibility: isSidebarOpen ? "visible" : "hidden" });
      gsap.set(sidebarContent, { x: 0, autoAlpha: 1 });
      return;
    }

    previousSidebarStateRef.current = isSidebarOpen;
    const reduceMotion = !areAnimationsEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = gsap.timeline({
      defaults: {
        duration: reduceMotion ? 0 : 0.28,
        ease: "power3.inOut",
        overwrite: "auto",
      },
    });

    if (isSidebarOpen) {
      gsap.set(sidebar, { visibility: "visible" });
      gsap.set(sidebarContent, { x: -18, autoAlpha: 0 });
      timeline
        .to(layout, { gridTemplateColumns: "240px minmax(0, 1fr)" }, 0)
        .to(sidebarContent, {
          x: 0,
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility",
        }, 0.08);
    } else {
      timeline
        .to(sidebarContent, { x: -18, autoAlpha: 0, duration: reduceMotion ? 0 : 0.18 }, 0)
        .to(layout, {
          gridTemplateColumns: "0px minmax(0, 1fr)",
          onComplete: () => gsap.set(sidebar, { visibility: "hidden" }),
        }, 0.04);
    }

    return () => {
      timeline.kill();
    };
  }, [areAnimationsEnabled, isSidebarOpen]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape" && isSettingsOpen) {
        event.preventDefault();
        openHome();
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (key === "w" && activeTabId) {
        event.preventDefault();
        closeTab(activeTabId);
      } else if (key === "n" && !event.shiftKey) {
        event.preventDefault();
        createNote();
      } else if (key === "t" && event.shiftKey && import.meta.env.DEV) {
        event.preventDefault();
        createTask("Новая задача");
      } else if (event.key === "\\") {
        event.preventDefault();
        setSidebarOpen(!useAppStore.getState().isSidebarOpen);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeTabId, createNote, createTask, isSettingsOpen, setSidebarOpen]);

  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)] bg-background">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex shrink-0 items-center rounded-full border bg-muted/35 p-0.5 shadow-sm">
            <Button
              aria-label={isSidebarOpen ? "Скрыть сайдбар" : "Показать сайдбар"}
              aria-pressed={!isSidebarOpen}
              className="rounded-full"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              size="icon-sm"
              variant="ghost"
            >
              {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <Button
              aria-label="Главная"
              aria-pressed={!isSettingsOpen && activeView === "home"}
              className={`rounded-full ${!isSettingsOpen && activeView === "home" ? "bg-background shadow-sm hover:bg-background" : "text-muted-foreground"}`}
              onClick={openHome}
              size="icon-sm"
              variant="ghost"
            >
              <Home />
            </Button>
          </div>

          <div aria-label="Основные разделы" className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-muted/35 p-0.5" role="group">
            {layoutOptions.map((option) => {
              const Icon = option.icon;
              const isLocked = isProductionLocked && (option.id === "tasks" || option.id === "files");
              const isActive = !isSettingsOpen && activeView === option.id;
              return (
                <button
                  aria-label={isLocked ? `${option.label}. Скоро` : option.label}
                  aria-pressed={isActive}
                  className={`soon-control flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                  data-soon={isLocked ? "Скоро" : undefined}
                  disabled={isLocked}
                  key={option.id}
                  onClick={() => navigateToView(option.id)}
                  type="button"
                >
                  <Icon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <span className="h-5 w-px shrink-0 bg-border" />

          <div aria-label="Рабочие вкладки" className="flex min-w-0 items-center gap-1 overflow-x-auto py-1" role="tablist">
            {tabs.map((tab) => {
              const option = layoutOptions.find((item) => item.id === tab.kind);
              const Icon = tab.kind === "settings" ? Settings : tab.kind === "home" ? Home : option?.icon ?? FileText;
              const isActive = tab.id === activeTabId;
              const tabLabel = tab.kind === "notes" && activeNoteTitle ? activeNoteTitle : tab.label;

              return (
                <div
                  aria-selected={isActive}
                  className={`group flex h-8 w-44 shrink-0 touch-none items-center gap-1 rounded-lg border px-1.5 transition-colors ${
                    isActive ? "bg-muted text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-muted/55"
                  } ${draggedTabId === tab.id ? "z-10 cursor-grabbing border-ring/40 bg-muted opacity-80 shadow-lg" : "cursor-grab"}`}
                  key={tab.id}
                  onPointerDownCapture={(event) => startTabDrag(event, tab.id)}
                  ref={(element) => {
                    if (element) tabElementsRef.current.set(tab.id, element);
                    else tabElementsRef.current.delete(tab.id);
                  }}
                  role="tab"
                  title={tabLabel}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-medium"
                    onClick={() => activateTab(tab)}
                    type="button"
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{tabLabel}</span>
                  </button>
                  <button
                    aria-label={`Закрыть вкладку «${tab.label}»`}
                    className="grid size-5 shrink-0 place-items-center rounded opacity-0 transition-opacity hover:bg-background/80 group-hover:opacity-100 group-focus-within:opacity-100"
                    onClick={() => closeTab(tab.id)}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
            <button
              aria-label="Новая вкладка"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              onClick={openNewTab}
              title="Новая вкладка"
              type="button"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
        <Button className="w-64 justify-start text-muted-foreground" onClick={() => setIsCommandPaletteOpen(true)} variant="outline">
          <Search />
          Найти что угодно
          <kbd className="ml-auto text-[11px] text-muted-foreground">Ctrl K</kbd>
        </Button>
      </header>

      <div ref={layoutRef} className="grid h-full min-h-0 overflow-hidden grid-cols-[240px_minmax(0,1fr)]">
        <aside ref={sidebarRef} className="h-full min-h-0 overflow-hidden border-r bg-sidebar text-sidebar-foreground">
          <div ref={sidebarContentRef} className="flex h-full min-h-0 w-60 flex-col">
          {isSettingsOpen ? (
            <SettingsSidebar active={activeSettingsSection} onBack={openHome} onChange={setActiveSettingsSection} />
          ) : (
            <>
          <div className="flex h-12 shrink-0 items-center border-b px-2">
            <WorkspaceSwitcher />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-2">
            {sidebarSections.map((section) => (
              <section className="space-y-1" key={section.id}>
                {section.label && (
                  <div className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
                    <span>{section.label}</span>
                    {section.addLabel && (
                      <Button
                        aria-label={section.addLabel}
                        onClick={() => {
                          if (section.id !== "notebooks") return;
                          setIsNotebookDialogOpen(true);
                        }}
                        size="icon-xs"
                        variant="ghost"
                      >
                        <Plus />
                      </Button>
                    )}
                  </div>
                )}
                <nav aria-label={section.label ?? "Навигация раздела"} className="space-y-0.5">
                  {(section.id === "notebooks"
                    ? noteNotebooks.map((notebook) => ({
                        id: notebook === "Проект" ? "project-notes" : notebook === "Учёба" ? "study-notes" : `notebook:${notebook}`,
                        label: notebook,
                        icon: "folder" as const,
                      }))
                    : section.items
                  ).map((item) => {
                    const Icon = icons[item.icon];
                    const isActive = activeSidebarItem === item.id;

                    return (
                      <Button
                        aria-pressed={isActive}
                        className={
                          isActive
                            ? "w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground"
                            : "w-full justify-start text-muted-foreground"
                        }
                        key={item.id}
                        onClick={() => setActiveSidebarItem(activeView, item.id)}
                        variant="ghost"
                      >
                        <Icon />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>
              </section>
            ))}
          </div>

          <div className="shrink-0 space-y-0.5 border-t p-2">
            <Button className="w-full justify-start text-muted-foreground" variant="ghost">
              <Archive />
              Архив
            </Button>
            <Button
              className="w-full justify-start text-muted-foreground"
              onClick={openSettingsTab}
              variant="ghost"
            >
              <Settings />
              Настройки
            </Button>
          </div>
            </>
          )}
          </div>
        </aside>

        <main className="flex h-full min-h-0 min-w-0 overflow-hidden flex-col">
          {isSettingsOpen ? <SettingsPage active={activeSettingsSection} /> : <WorkspacePage />}
        </main>
      </div>
      <CommandPalette onOpenChange={setIsCommandPaletteOpen} open={isCommandPaletteOpen} />
      <Dialog open={isNotebookDialogOpen} onOpenChange={(open) => {
        setIsNotebookDialogOpen(open);
        if (!open) setNotebookName("");
      }}>
        <DialogContent>
          <form onSubmit={(event) => {
            event.preventDefault();
            const name = notebookName.trim();
            if (!name) return;
            createNoteNotebook(name);
            setNotebookName("");
            setIsNotebookDialogOpen(false);
          }}>
            <DialogHeader>
              <DialogTitle>Новый блокнот</DialogTitle>
              <DialogDescription>Соберите связанные заметки в отдельную коллекцию.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-5">
              <Label htmlFor="notebook-name">Название</Label>
              <Input
                autoFocus
                id="notebook-name"
                onChange={(event) => setNotebookName(event.target.value)}
                placeholder="Например, Диплом"
                value={notebookName}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsNotebookDialogOpen(false)} type="button" variant="outline">Отмена</Button>
              <Button disabled={!notebookName.trim()} type="submit">Создать блокнот</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
