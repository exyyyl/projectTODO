import {
  Archive,
  ArrowRight,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  File,
  FileText,
  FolderClosed,
  History,
  Home,
  Inbox,
  LayoutGrid,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
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
  kind: "home" | "notes" | "tasks" | "files" | "settings";
  label: string;
  activeSidebarItem: Record<string, string>;
  activeNoteIdByWorkspace: Record<string, string | undefined>;
  pinned?: boolean;
};

export function AppShell() {
  const storeActiveView = useAppStore((state) => state.activeView);
  const storeActiveSidebarItem = useAppStore((state) => state.activeSidebarItem);
  const storeActiveNoteIdByWorkspace = useAppStore((state) => state.activeNoteIdByWorkspace);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const [tabs, setTabs] = useState<AppTab[]>(() => {
    const store = useAppStore.getState();
    return [
      {
        id: "view-notes",
        kind: "notes",
        label: "Заметки",
        activeSidebarItem: store.activeSidebarItem,
        activeNoteIdByWorkspace: store.activeNoteIdByWorkspace,
        pinned: false,
      }
    ];
  });
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const [activeTabId, setActiveTabId] = useState<string | null>("view-notes");
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("appearance");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [notebookName, setNotebookName] = useState("");

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [closedTabsHistory, setClosedTabsHistory] = useState<AppTab[]>([]);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [hoveredTabRect, setHoveredTabRect] = useState<DOMRect | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const previousSidebarStateRef = useRef<boolean | null>(null);
  const tabElementsRef = useRef(new Map<string, HTMLDivElement>());
  const previousTabPositionsRef = useRef(new Map<string, DOMRect>());
  const activeView = useAppStore((state) => state.activeView);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const activeSidebarItem = useAppStore((state) => state.activeSidebarItem[activeView]);
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

  const [updateStatus, setUpdateStatus] = useState<"idle" | "downloading" | "ready" | "scheduled" | "installing">("idle");
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUpdateStatus("downloading");
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 6;
        if (progress >= 100) {
          progress = 100;
          setUpdateProgress(100);
          setUpdateStatus("ready");
          clearInterval(interval);
        } else {
          setUpdateProgress(progress);
        }
      }, 500);
      return () => clearInterval(interval);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  function installUpdateNow() {
    setUpdateStatus("installing");
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  function scheduleUpdate() {
    setUpdateStatus("scheduled");
  }

  useEffect(() => {
    if (!activeTabId) return;
    setTabs((current) =>
      current.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              kind: isSettingsOpen ? "settings" : storeActiveView,
              activeSidebarItem: storeActiveSidebarItem,
              activeNoteIdByWorkspace: storeActiveNoteIdByWorkspace,
              label: isSettingsOpen
                ? "Настройки"
                : storeActiveView === "notes"
                ? (activeNoteTitle || "Заметки")
                : storeActiveView === "tasks"
                ? "Тудушка"
                : storeActiveView === "files"
                ? "Файлы"
                : "Новая вкладка",
            }
          : t
      )
    );
  }, [storeActiveView, storeActiveSidebarItem, storeActiveNoteIdByWorkspace, activeTabId, isSettingsOpen, activeNoteTitle]);

  useEffect(() => {
    if (isProductionLocked && (activeView === "tasks" || activeView === "files")) openHome();
  }, [activeView, isProductionLocked]);

  function activateTab(tab: AppTab) {
    setActiveTabId(tab.id);
    if (tab.kind === "settings") {
      setActiveView(activeView);
    } else {
      setActiveView(tab.kind);
    }
    useAppStore.setState({
      activeSidebarItem: tab.activeSidebarItem,
      activeNoteIdByWorkspace: tab.activeNoteIdByWorkspace,
    });
  }

  function openNewTab() {
    const store = useAppStore.getState();
    const tab: AppTab = {
      id: `home-${crypto.randomUUID()}`,
      kind: "home",
      label: "Новая вкладка",
      activeSidebarItem: store.activeSidebarItem,
      activeNoteIdByWorkspace: store.activeNoteIdByWorkspace,
    };
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    setActiveView("home");
  }

  function navigateToView(view: Exclude<WorkspaceView, "home">) {
    if (isProductionLocked && (view === "tasks" || view === "files")) return;
    if (activeTabId) {
      setTabs((current) =>
        current.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                kind: view,
                label:
                  view === "notes"
                    ? (activeNoteTitle || "Заметки")
                    : view === "tasks"
                    ? "Тудушка"
                    : view === "files"
                    ? "Файлы"
                    : "Новая вкладка",
              }
            : t
        )
      );
    }
    setActiveView(view);
  }

  function openSettingsTab() {
    if (activeTabId) {
      setTabs((current) =>
        current.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                kind: "settings",
                label: "Настройки",
              }
            : t
        )
      );
      setActiveView(activeView);
    }
  }

  function openHome() {
    if (activeTabId) {
      setTabs((current) =>
        current.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                kind: "home",
                label: "Новая вкладка",
              }
            : t
        )
      );
    }
    setActiveView("home");
  }

  function closeTab(tabId: string) {
    setTabs((current) => {
      const closingIndex = current.findIndex((tab) => tab.id === tabId);
      const remaining = current.filter((tab) => tab.id !== tabId);
      const closedTab = current.find((tab) => tab.id === tabId);
      if (closedTab) {
        setClosedTabsHistory((prev) => [...prev, closedTab]);
      }
      if (tabId === activeTabId) {
        const fallback = remaining[Math.min(closingIndex, remaining.length - 1)];
        if (fallback) activateTab(fallback);
        else setActiveTabId(null);
      }
      return remaining;
    });
  }

  function reopenLastClosedTab() {
    if (closedTabsHistory.length === 0) return;
    setClosedTabsHistory((prevHistory) => {
      const nextHistory = [...prevHistory];
      const restoredTab = nextHistory.pop();
      if (restoredTab) {
        setTabs((current) => {
          const updated = [...current, restoredTab];
          const pinned = updated.filter((t) => t.pinned);
          const regular = updated.filter((t) => !t.pinned);
          return [...pinned, ...regular];
        });
        setTimeout(() => {
          activateTab(restoredTab);
        }, 0);
      }
      return nextHistory;
    });
  }

  function pinTab(tabId: string) {
    setTabs((current) => {
      const updated = current.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t));
      const pinned = updated.filter((t) => t.pinned);
      const regular = updated.filter((t) => !t.pinned);
      return [...pinned, ...regular];
    });
    setContextMenu(null);
  }

  function duplicateTab(tabId: string) {
    const tabToDuplicate = tabsRef.current.find((t) => t.id === tabId);
    if (!tabToDuplicate) return;
    const duplicated: AppTab = {
      ...tabToDuplicate,
      id: `${tabToDuplicate.kind}-${crypto.randomUUID()}`,
      label: tabToDuplicate.label.endsWith("(Копия)") ? tabToDuplicate.label : `${tabToDuplicate.label} (Копия)`,
    };
    setTabs((current) => {
      const index = current.findIndex((t) => t.id === tabId);
      const next = [...current];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
    setTimeout(() => {
      activateTab(duplicated);
    }, 0);
    setContextMenu(null);
  }

  function closeOtherTabs(tabId: string) {
    setTabs((current) => {
      const tabToKeep = current.find((t) => t.id === tabId);
      if (!tabToKeep) return current;
      const remaining = current.filter((t) => t.id === tabId || t.pinned);
      const closed = current.filter((t) => t.id !== tabId && !t.pinned);
      setClosedTabsHistory((prev) => [...prev, ...closed]);
      if (tabId !== activeTabId && !remaining.some((t) => t.id === activeTabId)) {
        activateTab(tabToKeep);
      }
      return remaining;
    });
    setContextMenu(null);
  }

  function closeTabsToRight(tabId: string) {
    setTabs((current) => {
      const index = current.findIndex((t) => t.id === tabId);
      if (index === -1) return current;
      const remaining = current.slice(0, index + 1);
      const closed = current.slice(index + 1);
      setClosedTabsHistory((prev) => [...prev, ...closed]);
      if (activeTabId && current.findIndex((t) => t.id === activeTabId) > index) {
        const activeTabToSelect = remaining[remaining.length - 1];
        if (activeTabToSelect) activateTab(activeTabToSelect);
      }
      return remaining;
    });
    setContextMenu(null);
  }

  function handleContextMenu(event: React.MouseEvent, tabId: string) {
    event.preventDefault();
    event.stopPropagation();
    setHoveredTabId(null);
    setHoveredTabRect(null);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      tabId,
    });
  }

  function handleTabMouseEnter(event: React.MouseEvent<HTMLDivElement>, tabId: string) {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = window.setTimeout(() => {
      setHoveredTabId(tabId);
      setHoveredTabRect(rect);
    }, 500);
  }

  function handleTabMouseLeave() {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setHoveredTabId(null);
    setHoveredTabRect(null);
  }

  function startTabDrag(event: React.PointerEvent<HTMLDivElement>, tabId: string) {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('[aria-label^="Закрыть вкладку"]')) return;
    
    const startX = event.clientX;
    let hasMoved = false;

    const currentTarget = event.currentTarget;
    currentTarget.setPointerCapture(event.pointerId);
    setDraggedTabId(tabId);

    function handleMove(moveEvent: PointerEvent) {
      if (Math.abs(moveEvent.clientX - startX) > 4) {
        hasMoved = true;
      }

      const currentTabs = tabsRef.current;
      if (!hasMoved || currentTabs.length < 2) return;

      const container = currentTarget.parentElement;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      const firstTab = container.firstElementChild;
      const tabWidth = firstTab ? firstTab.getBoundingClientRect().width + 4 : 180;

      const relativeX = moveEvent.clientX - containerRect.left;
      let targetIndex = Math.floor(relativeX / tabWidth);
      
      const isPinned = currentTabs.find((t) => t.id === tabId)?.pinned;
      const pinnedCount = currentTabs.filter((t) => t.pinned).length;
      if (isPinned) {
        targetIndex = Math.max(0, Math.min(pinnedCount - 1, targetIndex));
      } else {
        targetIndex = Math.max(pinnedCount, Math.min(currentTabs.length - 1, targetIndex));
      }

      const currentIndex = currentTabs.findIndex(t => t.id === tabId);
      if (currentIndex !== targetIndex && currentIndex !== -1) {
        previousTabPositionsRef.current = new Map(
          [...tabElementsRef.current].map(([id, element]) => [id, element.getBoundingClientRect()]),
        );
        setTabs((current) => {
          const next = [...current];
          const [dragged] = next.splice(currentIndex, 1);
          next.splice(targetIndex, 0, dragged);
          return next;
        });
      }
    }

    function handleUp() {
      try {
        currentTarget.releasePointerCapture(event.pointerId);
      } catch (e) {}
      setDraggedTabId(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);

      if (!hasMoved) {
        const tab = tabsRef.current.find((t) => t.id === tabId);
        if (tab) activateTab(tab);
      }
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
    if (!contextMenu) return;
    function handleGlobalClick() {
      setContextMenu(null);
    }
    window.addEventListener("mousedown", handleGlobalClick);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [contextMenu]);

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

      const num = parseInt(event.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        event.preventDefault();
        const targetTab = tabsRef.current[num - 1];
        if (targetTab) activateTab(targetTab);
        return;
      }

      if (key === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (key === "w" && activeTabId) {
        event.preventDefault();
        closeTab(activeTabId);
      } else if (key === "t" && event.shiftKey) {
        event.preventDefault();
        reopenLastClosedTab();
      } else if (key === "t" && !event.shiftKey) {
        event.preventDefault();
        openNewTab();
      } else if (key === "n" && !event.shiftKey) {
        event.preventDefault();
        createNote();
      } else if (event.key === "\\") {
        event.preventDefault();
        setSidebarOpen(!useAppStore.getState().isSidebarOpen);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeTabId, createNote, createTask, isSettingsOpen, setSidebarOpen, closedTabsHistory]);

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
            <Button
              aria-label="Поиск"
              className="rounded-full text-muted-foreground"
              onClick={() => setIsCommandPaletteOpen(true)}
              size="icon-sm"
              variant="ghost"
              title="Поиск (Ctrl + K)"
            >
              <Search className="size-3.5" />
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

          <div aria-label="Рабочие вкладки" className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto py-1 no-scrollbar" role="tablist">
            {tabs.map((tab) => {
              const option = layoutOptions.find((item) => item.id === tab.kind);
              const Icon = tab.kind === "settings" ? Settings : tab.kind === "home" ? Home : option?.icon ?? FileText;
              const isActive = tab.id === activeTabId;
              const tabLabel = tab.kind === "notes" && activeNoteTitle ? activeNoteTitle : tab.label;
              const isPinned = !!tab.pinned;

              return (
                <div
                  aria-selected={isActive}
                  className={`group flex h-8 touch-none items-center rounded-lg border transition-colors ${
                    isPinned
                      ? "w-9 shrink-0 justify-center px-1"
                      : "flex-1 min-w-[36px] max-w-[176px] gap-1 px-1.5"
                  } ${
                    isActive ? "bg-muted text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-muted/55"
                  } ${draggedTabId === tab.id ? "z-10 cursor-grabbing border-ring/40 bg-muted opacity-80 shadow-lg" : "cursor-grab"}`}
                  key={tab.id}
                  onPointerDownCapture={(event) => startTabDrag(event, tab.id)}
                  ref={(element) => {
                    if (element) tabElementsRef.current.set(tab.id, element);
                    else tabElementsRef.current.delete(tab.id);
                  }}
                  role="tab"
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onMouseEnter={(e) => handleTabMouseEnter(e, tab.id)}
                  onMouseLeave={handleTabMouseLeave}
                >
                  {isPinned ? (
                    <button
                      className="flex size-6 items-center justify-center"
                      onClick={() => activateTab(tab)}
                      type="button"
                    >
                      <Icon className="size-3.5 shrink-0" />
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
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

          {updateStatus !== "idle" && (
            <div className="px-2 pb-2">
              <div className="rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs shadow-sm transition-all duration-300">
                {updateStatus === "downloading" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="size-3 animate-spin text-primary" />
                        Скачивание...
                      </span>
                      <span className="text-muted-foreground">{updateProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${updateProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {updateStatus === "ready" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <ArrowUpCircle className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Доступна версия 1.2.0</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Обновление скачано и готово к установке.
                    </p>
                    <div className="flex gap-1.5 pt-0.5">
                      <button
                        onClick={installUpdateNow}
                        className="flex-1 rounded bg-primary py-1 px-1.5 text-[10px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                        type="button"
                      >
                        Установить
                      </button>
                      <button
                        onClick={scheduleUpdate}
                        className="rounded border border-border bg-background py-1 px-1.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        type="button"
                      >
                        Позже
                      </button>
                    </div>
                  </div>
                )}
                {updateStatus === "scheduled" && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[11px]">Установится при перезапуске</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="shrink-0 space-y-0.5 border-t p-2">
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
      {updateStatus === "installing" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <RefreshCw className="size-8 animate-spin text-primary" />
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground text-center">Установка обновления</h2>
              <p className="text-xs text-muted-foreground text-center">Пожалуйста, подождите. Приложение перезапускается...</p>
            </div>
          </div>
        </div>
      )}
      
      {contextMenu && (
        <div
          className="fixed z-50 w-56 overflow-hidden rounded-lg border border-border bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur-sm focus:outline-none"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const tab = tabs.find((t) => t.id === contextMenu.tabId);
            if (!tab) return null;
            return (
              <div className="flex flex-col gap-0.5 text-xs">
                <button
                  onClick={() => pinTab(tab.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  {tab.pinned ? (
                    <>
                      <PinOff className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>Открепить вкладку</span>
                    </>
                  ) : (
                    <>
                      <Pin className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>Закрепить вкладку</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => { openNewTab(); setContextMenu(null); }}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>Новая вкладка</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wide">Ctrl T</span>
                </button>
                <button
                  onClick={() => duplicateTab(tab.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>Дублировать вкладку</span>
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => { reopenLastClosedTab(); setContextMenu(null); }}
                  disabled={closedTabsHistory.length === 0}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  type="button"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <History className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">Восстановить вкладку</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">Ctrl ⇧ T</span>
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => {
                    closeTab(tab.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <X className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>Закрыть вкладку</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wide">Ctrl W</span>
                </button>
                <button
                  onClick={() => closeOtherTabs(tab.id)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <X className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>Закрыть другие</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wide">Ctrl Alt W</span>
                </button>
                <button
                  onClick={() => closeTabsToRight(tab.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  type="button"
                >
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>Закрыть справа</span>
                </button>
                <button
                  disabled
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left opacity-40 cursor-not-allowed"
                  type="button"
                >
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>В новое окно</span>
                  <span className="ml-auto rounded bg-muted px-1 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Скоро</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {hoveredTabId && hoveredTabRect && (
        <div
          className="fixed z-50 pointer-events-none flex items-center gap-1.5 rounded-md border border-border/80 bg-popover/95 px-2 py-1 text-[11px] font-medium text-popover-foreground shadow-md backdrop-blur-sm"
          style={{
            left: hoveredTabRect.left + hoveredTabRect.width / 2,
            top: hoveredTabRect.bottom + 6,
            transform: "translateX(-50%)",
          }}
        >
          <span>{tabs.find((t) => t.id === hoveredTabId)?.label}</span>
          {(() => {
            const index = tabs.findIndex((t) => t.id === hoveredTabId);
            if (index >= 0 && index < 9) {
              return (
                <span className="flex items-center gap-0.5 rounded bg-muted/80 px-1 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  Ctrl {index + 1}
                </span>
              );
            }
            return null;
          })()}
        </div>
      )}

    </div>
  );
}
