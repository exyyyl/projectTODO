import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Asset, AssetId } from "@/entities/asset/model/types";
import { clearStoredNotes, deleteStoredNote, saveNote, scheduleNoteSave } from "@/entities/note/api/note-repository";
import type { Note, NoteChanges, NoteId } from "@/entities/note/model/types";
import type { Task, TaskId, TaskStatus } from "@/entities/task/model/types";
import type { Workspace, WorkspaceId } from "@/entities/workspace/model/types";
import { isTauriRuntime } from "@/shared/lib/runtime";

export type WorkspaceView = "home" | "notes" | "tasks" | "files";
export type ThemePreference = "dark" | "light" | "system";

interface AppState {
  activeView: WorkspaceView;
  themePreference: ThemePreference;
  isCompactMode: boolean;
  areAnimationsEnabled: boolean;
  isSidebarOpen: boolean;
  hasHydrated: boolean;
  haveNotesInitialized: boolean;
  activeSidebarItem: Record<WorkspaceView, string>;
  workspaces: Workspace[];
  activeWorkspaceId: WorkspaceId;
  notes: Note[];
  tasks: Task[];
  assets: Asset[];
  assetCollections: Record<WorkspaceId, string[]>;
  noteNotebooks: Record<WorkspaceId, string[]>;
  activeNoteIdByWorkspace: Record<WorkspaceId, NoteId | undefined>;
  createWorkspace: (name: string) => void;
  createNote: () => void;
  createTask: (title: string) => void;
  importAssets: (files: File[]) => void;
  createAssetCollection: (name: string) => void;
  createNoteNotebook: (name: string) => void;
  setActiveWorkspace: (workspaceId: WorkspaceId) => void;
  setActiveView: (view: WorkspaceView) => void;
  setThemePreference: (theme: ThemePreference) => void;
  setCompactMode: (isCompact: boolean) => void;
  setAnimationsEnabled: (areEnabled: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  initializeStoredNotes: (notes: Note[]) => void;
  resetLocalData: () => void;
  setActiveSidebarItem: (view: WorkspaceView, itemId: string) => void;
  setActiveNote: (noteId: NoteId) => void;
  updateNote: (noteId: NoteId, changes: NoteChanges) => void;
  deleteNotePermanently: (noteId: NoteId) => void;
  updateTaskStatus: (taskId: TaskId, status: TaskStatus) => void;
  updateAsset: (assetId: AssetId, changes: Partial<Pick<Asset, "name" | "collection" | "tags">>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  activeView: "home",
  themePreference: "dark",
  isCompactMode: false,
  areAnimationsEnabled: true,
  isSidebarOpen: true,
  hasHydrated: false,
  haveNotesInitialized: false,
  activeWorkspaceId: "personal",
  workspaces: [
    {
      id: "personal",
      name: "Первое пространство",
      rootPath: "",
      accent: "P",
    },
    {
      id: "study",
      name: "Учёба",
      rootPath: "",
      accent: "У",
    },
  ],
  notes: [
    {
      id: "note-app-ideas",
      workspaceId: "personal",
      title: "Идеи для приложения",
      content:
        "Продумать быстрый импорт файлов и связи между заметками.\n\nГлавная цель — создать спокойное local-first пространство, которое не требует регистрации и работает без интернета.",
      tag: "Проект",
      notebook: "Проект",
      isFavorite: true,
      updatedAt: "Сегодня, 14:32",
    },
    {
      id: "note-architecture",
      workspaceId: "personal",
      title: "Конспект по архитектуре",
      content:
        "Local-first подход, индексирование и переносимые пространства.\n\nSQLite используется как локальный индекс, а пользовательские файлы остаются доступны напрямую.",
      tag: "Учёба",
      notebook: "Учёба",
      isFavorite: false,
      updatedAt: "Вчера",
    },
    {
      id: "note-resources",
      workspaceId: "personal",
      title: "Список полезных ресурсов",
      content: "Подборка статей и референсов для будущего редактора.",
      tag: "Референсы",
      notebook: "Проект",
      isFavorite: false,
      updatedAt: "9 июня",
    },
    {
      id: "note-study-plan",
      workspaceId: "study",
      title: "План на семестр",
      content: "Собрать дедлайны, материалы и задачи по каждому предмету.",
      tag: "Учёба",
      notebook: "Учёба",
      isFavorite: false,
      updatedAt: "Сегодня",
    },
  ],
  tasks: [
    { id: "task-note-screen", workspaceId: "personal", title: "Продумать экран заметки", status: "planned", due: "Сегодня" },
    { id: "task-file-grid", workspaceId: "personal", title: "Собрать референсы файловой сетки", status: "planned", due: "Без срока" },
    { id: "task-navigation", workspaceId: "personal", title: "Навигационный фундамент", status: "progress", due: "Сегодня" },
    { id: "task-theme", workspaceId: "personal", title: "Тёмная тема приложения", status: "progress", due: "Сегодня" },
    { id: "task-tauri", workspaceId: "personal", title: "Создать каркас Tauri", status: "done", due: "11 июня" },
    { id: "task-exam", workspaceId: "study", title: "Подготовиться к экзамену", status: "planned", due: "20 июня" },
  ],
  assets: [
    { id: "asset-dashboard", workspaceId: "personal", name: "dashboard-reference.png", kind: "PNG", size: "2.4 МБ", collection: "Референсы", tags: ["Вдохновение"], isImage: true },
    { id: "asset-architecture", workspaceId: "personal", name: "architecture-notes.pdf", kind: "PDF", size: "840 КБ", collection: "Дизайн", tags: ["Важное"], isImage: false },
    { id: "asset-editor", workspaceId: "personal", name: "editor-layout.jpg", kind: "JPG", size: "1.8 МБ", collection: "Дизайн", tags: ["Вдохновение"], isImage: true },
    { id: "asset-research", workspaceId: "personal", name: "research-links.md", kind: "MD", size: "12 КБ", collection: "Референсы", tags: [], isImage: false },
    { id: "asset-syllabus", workspaceId: "study", name: "syllabus.pdf", kind: "PDF", size: "320 КБ", collection: "Учёба", tags: ["Важное"], isImage: false },
  ],
  assetCollections: {
    personal: ["Дизайн", "Референсы"],
    study: ["Учёба"],
  },
  noteNotebooks: {
    personal: ["Проект", "Учёба"],
    study: ["Учёба"],
  },
  activeNoteIdByWorkspace: {
    personal: "note-app-ideas",
    study: "note-study-plan",
  },
  activeSidebarItem: {
    home: "inbox",
    notes: "all-notes",
    tasks: "my-tasks",
    files: "all-files",
  },
  createWorkspace: (name) =>
    set((state) => {
      const workspace: Workspace = {
        id: `workspace-${Date.now()}`,
        name,
        rootPath: "",
        accent: name.trim().charAt(0).toUpperCase(),
      };

      return {
        workspaces: [...state.workspaces, workspace],
        activeWorkspaceId: workspace.id,
        activeView: "home",
      };
    }),
  createNote: () =>
    set((state) => {
      const note: Note = {
        id: `note-${Date.now()}`,
        workspaceId: state.activeWorkspaceId,
        title: "Без названия",
        content: "",
        tag: "Без тега",
        notebook: getNotebookFromFilter(state.activeSidebarItem.notes) ?? "Проект",
        isFavorite: false,
        updatedAt: "Только что",
      };

      void saveNote(note).catch((error) => console.error("Failed to create note", error));

      return {
        notes: [note, ...state.notes],
        activeNoteIdByWorkspace: {
          ...state.activeNoteIdByWorkspace,
          [state.activeWorkspaceId]: note.id,
        },
        activeView: "notes",
      };
    }),
  createTask: (title) =>
    set((state) => ({
      tasks: [
        {
          id: `task-${Date.now()}`,
          workspaceId: state.activeWorkspaceId,
          title,
          status: "planned",
          due: "Без срока",
        },
        ...state.tasks,
      ],
      activeView: "tasks",
    })),
  importAssets: (files) =>
    set((state) => ({
      assets: [
        ...files.map((file): Asset => {
          const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
          const isImage = file.type.startsWith("image/");

          return {
            id: `asset-${Date.now()}-${file.name}`,
            workspaceId: state.activeWorkspaceId,
            name: file.name,
            kind: extension,
            size: formatFileSize(file.size),
            collection: "Без коллекции",
            tags: [],
            previewUrl: isImage ? URL.createObjectURL(file) : undefined,
            isImage,
          };
        }),
        ...state.assets,
      ],
      activeView: "files",
    })),
  createAssetCollection: (name) =>
    set((state) => ({
      assetCollections: {
        ...state.assetCollections,
        [state.activeWorkspaceId]: [
          ...(state.assetCollections[state.activeWorkspaceId] ?? []),
          name,
        ],
      },
    })),
  createNoteNotebook: (name) =>
    set((state) => {
      const normalizedName = name.trim();
      const notebooks = state.noteNotebooks[state.activeWorkspaceId] ?? [];
      if (!normalizedName || notebooks.includes(normalizedName)) return state;

      return {
        noteNotebooks: {
          ...state.noteNotebooks,
          [state.activeWorkspaceId]: [...notebooks, normalizedName],
        },
        activeSidebarItem: {
          ...state.activeSidebarItem,
          notes: `notebook:${normalizedName}`,
        },
      };
    }),
  setActiveWorkspace: (activeWorkspaceId) =>
    set({
      activeWorkspaceId,
      activeView: "home",
    }),
  setActiveView: (activeView) => set({ activeView }),
  setThemePreference: (themePreference) => set({ themePreference }),
  setCompactMode: (isCompactMode) => set({ isCompactMode }),
  setAnimationsEnabled: (areAnimationsEnabled) => set({ areAnimationsEnabled }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  initializeStoredNotes: (notes) =>
    set((state) => ({
      notes,
      haveNotesInitialized: true,
      activeNoteIdByWorkspace: Object.fromEntries(
        state.workspaces.map((workspace) => {
          const activeNoteId = state.activeNoteIdByWorkspace[workspace.id];
          const hasActiveNote = notes.some((note) => note.id === activeNoteId);
          const fallbackNote = notes.find((note) => note.workspaceId === workspace.id);
          return [workspace.id, hasActiveNote ? activeNoteId : fallbackNote?.id];
        }),
      ),
    })),
  resetLocalData: () => {
    void clearStoredNotes().finally(() => {
      localStorage.removeItem("project-todo-state");
      window.location.reload();
    });
  },
  setActiveSidebarItem: (view, itemId) =>
    set((state) => ({
      activeSidebarItem: {
        ...state.activeSidebarItem,
        [view]: itemId,
      },
    })),
  setActiveNote: (noteId) =>
    set((state) => ({
      activeNoteIdByWorkspace: {
        ...state.activeNoteIdByWorkspace,
        [state.activeWorkspaceId]: noteId,
      },
    })),
  updateNote: (noteId, changes) =>
    set((state) => {
      const notes = state.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...changes,
              updatedAt: "Только что",
            }
          : note,
      );
      const updatedNote = notes.find((note) => note.id === noteId);
      if (updatedNote) scheduleNoteSave(updatedNote);
      return { notes };
    }),
  deleteNotePermanently: (noteId) =>
    set((state) => {
      void deleteStoredNote(noteId).catch((error) => console.error("Failed to delete note", error));
      return {
        notes: state.notes.filter((note) => note.id !== noteId),
        activeNoteIdByWorkspace: {
          ...state.activeNoteIdByWorkspace,
          [state.activeWorkspaceId]: undefined,
        },
      };
    }),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    })),
  updateAsset: (assetId, changes) =>
    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === assetId ? { ...asset, ...changes } : asset)),
    })),
    }),
    {
      name: "project-todo-state",
      version: 1,
      partialize: (state) => ({
        activeView: state.activeView,
        themePreference: state.themePreference,
        isCompactMode: state.isCompactMode,
        areAnimationsEnabled: state.areAnimationsEnabled,
        isSidebarOpen: state.isSidebarOpen,
        activeSidebarItem: state.activeSidebarItem,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        notes: isTauriRuntime() ? undefined : state.notes,
        tasks: state.tasks,
        assets: state.assets.map(({ previewUrl: _previewUrl, ...asset }) => asset),
        assetCollections: state.assetCollections,
        noteNotebooks: state.noteNotebooks,
        activeNoteIdByWorkspace: state.activeNoteIdByWorkspace,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

function getNotebookFromFilter(filter: string) {
  if (filter === "project-notes") return "Проект";
  if (filter === "study-notes") return "Учёба";
  if (filter.startsWith("notebook:")) return filter.slice("notebook:".length);
  return undefined;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
