import type { WorkspaceView } from "@/app/model/use-app-store";

export type NavigationIcon =
  | "archive"
  | "calendar"
  | "check"
  | "clock"
  | "file"
  | "folder"
  | "inbox"
  | "layout"
  | "star"
  | "tag";

export interface SidebarItem {
  id: string;
  label: string;
  icon: NavigationIcon;
}

export interface SidebarSection {
  id: string;
  label?: string;
  addLabel?: string;
  items: SidebarItem[];
}

export const sidebarByView: Record<WorkspaceView, SidebarSection[]> = {
  home: [
    {
      id: "overview",
      items: [
        { id: "inbox", label: "Входящие", icon: "inbox" },
        { id: "recent", label: "Недавнее", icon: "clock" },
        { id: "favorites", label: "Избранное", icon: "star" },
      ],
    },
    {
      id: "collections",
      label: "Общие коллекции",
      addLabel: "Создать коллекцию",
      items: [
        { id: "study", label: "Учёба", icon: "folder" },
        { id: "references", label: "Референсы", icon: "folder" },
      ],
    },
  ],
  notes: [
    {
      id: "notes",
      items: [
        { id: "all-notes", label: "Все заметки", icon: "file" },
        { id: "favorite-notes", label: "Избранные", icon: "star" },
        { id: "trash-notes", label: "Корзина", icon: "archive" },
      ],
    },
    {
      id: "notebooks",
      label: "Блокноты",
      addLabel: "Создать блокнот",
      items: [
        { id: "project-notes", label: "Проект", icon: "folder" },
        { id: "study-notes", label: "Учёба", icon: "folder" },
      ],
    },
  ],
  tasks: [
    {
      id: "tasks",
      items: [
        { id: "my-tasks", label: "Мои задачи", icon: "check" },
        { id: "today", label: "Сегодня", icon: "calendar" },
        { id: "upcoming", label: "Предстоящие", icon: "clock" },
      ],
    },
    {
      id: "projects",
      label: "Проекты",
      addLabel: "Создать проект",
      items: [
        { id: "app-project", label: "Приложение", icon: "folder" },
        { id: "study-project", label: "Учёба", icon: "folder" },
      ],
    },
  ],
  files: [
    {
      id: "files",
      items: [
        { id: "all-files", label: "Все файлы", icon: "layout" },
        { id: "recent-files", label: "Недавние", icon: "clock" },
        { id: "favorite-files", label: "Избранные", icon: "star" },
        { id: "archive-files", label: "Архив", icon: "archive" },
      ],
    },
    {
      id: "file-collections",
      label: "Коллекции",
      addLabel: "Создать коллекцию",
      items: [
        { id: "design", label: "Дизайн", icon: "folder" },
        { id: "references", label: "Референсы", icon: "folder" },
      ],
    },
    {
      id: "tags",
      label: "Теги",
      addLabel: "Создать тег",
      items: [
        { id: "important", label: "Важное", icon: "tag" },
        { id: "inspiration", label: "Вдохновение", icon: "tag" },
      ],
    },
  ],
};
