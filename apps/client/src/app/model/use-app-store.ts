import { create } from "zustand";

import type { Asset, AssetId } from "@/entities/asset/model/types";
import type { Note, NoteId } from "@/entities/note/model/types";
import type { Task, TaskId, TaskStatus } from "@/entities/task/model/types";
import type { Workspace, WorkspaceId } from "@/entities/workspace/model/types";

export type WorkspaceView = "home" | "notes" | "tasks" | "files";

interface AppState {
  activeView: WorkspaceView;
  activeSidebarItem: Record<WorkspaceView, string>;
  workspaces: Workspace[];
  activeWorkspaceId: WorkspaceId;
  notes: Note[];
  tasks: Task[];
  assets: Asset[];
  assetCollections: Record<WorkspaceId, string[]>;
  activeNoteIdByWorkspace: Record<WorkspaceId, NoteId | undefined>;
  createWorkspace: (name: string) => void;
  createNote: () => void;
  createTask: (title: string) => void;
  importAssets: (files: File[]) => void;
  createAssetCollection: (name: string) => void;
  setActiveWorkspace: (workspaceId: WorkspaceId) => void;
  setActiveView: (view: WorkspaceView) => void;
  setActiveSidebarItem: (view: WorkspaceView, itemId: string) => void;
  setActiveNote: (noteId: NoteId) => void;
  updateNote: (noteId: NoteId, changes: Partial<Pick<Note, "title" | "content">>) => void;
  updateTaskStatus: (taskId: TaskId, status: TaskStatus) => void;
  updateAsset: (assetId: AssetId, changes: Partial<Pick<Asset, "name" | "collection" | "tags">>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "home",
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
      updatedAt: "Сегодня, 14:32",
    },
    {
      id: "note-architecture",
      workspaceId: "personal",
      title: "Конспект по архитектуре",
      content:
        "Local-first подход, индексирование и переносимые пространства.\n\nSQLite используется как локальный индекс, а пользовательские файлы остаются доступны напрямую.",
      tag: "Учёба",
      updatedAt: "Вчера",
    },
    {
      id: "note-resources",
      workspaceId: "personal",
      title: "Список полезных ресурсов",
      content: "Подборка статей и референсов для будущего редактора.",
      tag: "Референсы",
      updatedAt: "9 июня",
    },
    {
      id: "note-study-plan",
      workspaceId: "study",
      title: "План на семестр",
      content: "Собрать дедлайны, материалы и задачи по каждому предмету.",
      tag: "Учёба",
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
        updatedAt: "Только что",
      };

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
  setActiveWorkspace: (activeWorkspaceId) =>
    set({
      activeWorkspaceId,
      activeView: "home",
    }),
  setActiveView: (activeView) => set({ activeView }),
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
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...changes,
              updatedAt: "Только что",
            }
          : note,
      ),
    })),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    })),
  updateAsset: (assetId, changes) =>
    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === assetId ? { ...asset, ...changes } : asset)),
    })),
}));

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
