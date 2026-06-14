import {
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
import { useMemo } from "react";

import { useAppStore } from "@/app/model/use-app-store";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  if (hour < 22) return "Добрый вечер";
  return "Доброй ночи";
}

function getTodayString() {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

const STATUS_ICONS = {
  planned: Circle,
  progress: Loader2,
  done: CheckCircle2,
} as const;

const STATUS_COLORS = {
  planned: "text-muted-foreground",
  progress: "text-blue-500",
  done: "text-emerald-500",
} as const;

export function HomePage() {
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaceName = useAppStore(
    (state) => state.workspaces.find((w) => w.id === state.activeWorkspaceId)?.name ?? "Рабочее пространство"
  );
  const allNotes = useAppStore((state) => state.notes);
  const allTasks = useAppStore((state) => state.tasks);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const setActiveNote = useAppStore((state) => state.setActiveNote);
  const createNote = useAppStore((state) => state.createNote);
  const createTask = useAppStore((state) => state.createTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  const notes = useMemo(
    () => allNotes.filter((n) => n.workspaceId === activeWorkspaceId && !n.deletedAt),
    [allNotes, activeWorkspaceId]
  );
  const tasks = useMemo(
    () => allTasks.filter((t) => t.workspaceId === activeWorkspaceId),
    [allTasks, activeWorkspaceId]
  );

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done" && (t.due === "Сегодня" || t.due === "Только что")),
    [tasks]
  );
  const recentNotes = useMemo(() => {
    const ORDER = ["Только что", "Сегодня", "Вчера"];
    return [...notes]
      .sort((a, b) => {
        const ai = ORDER.findIndex((s) => a.updatedAt?.startsWith(s));
        const bi = ORDER.findIndex((s) => b.updatedAt?.startsWith(s));
        return (bi === -1 ? 99 : bi) - (ai === -1 ? 99 : ai);
      })
      .slice(0, 5);
  }, [notes]);
  const favoriteNotes = useMemo(() => notes.filter((n) => n.isFavorite).slice(0, 3), [notes]);

  const doneCount = useMemo(() => tasks.filter((t) => t.status === "done").length, [tasks]);
  const progressCount = useMemo(() => tasks.filter((t) => t.status === "progress").length, [tasks]);

  const isProductionLocked = !import.meta.env.DEV;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Hero greeting */}
      <div className="shrink-0 border-b bg-gradient-to-b from-muted/30 to-transparent px-6 py-8">
        <div className="mx-auto max-w-[960px]">
          <p className="text-xs font-medium text-muted-foreground">{getTodayString()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {getGreeting()},{" "}
            <span className="text-foreground/80">{workspaceName}</span>
          </h1>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={createNote}
              className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
              type="button"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              Новая заметка
            </button>
            <button
              onClick={() => { if (!isProductionLocked) createTask("Новая задача"); }}
              disabled={isProductionLocked}
              className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              <Plus className="size-3.5 text-muted-foreground" />
              Новая задача
            </button>
            <button
              onClick={() => setActiveView("notes")}
              className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
              type="button"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              Все заметки
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[960px] flex-1 px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* Left column */}
          <div className="min-w-0 space-y-6">

            {/* Today's tasks */}
            {!isProductionLocked && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock3 className="size-3.5 text-muted-foreground" />
                    На сегодня
                    {todayTasks.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {todayTasks.length}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => setActiveView("tasks")}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                  >
                    Все задачи →
                  </button>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
                    Задач на сегодня нет — отличный повод добавить новую
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border bg-card overflow-hidden">
                    {todayTasks.map((task) => {
                      const StatusIcon = STATUS_ICONS[task.status];
                      return (
                        <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateTaskStatus(task.id, task.status === "planned" ? "progress" : "done")
                            }
                            className="shrink-0"
                          >
                            <StatusIcon
                              className={`size-4 transition-colors ${STATUS_COLORS[task.status]} ${task.status === "progress" ? "animate-spin" : ""}`}
                            />
                          </button>
                          <p className="flex-1 truncate text-sm">{task.title}</p>
                          <span className="text-[11px] text-muted-foreground">{task.due}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Recent notes */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-medium">
                  <FileText className="size-3.5 text-muted-foreground" />
                  Недавние заметки
                </h2>
                <button
                  onClick={() => setActiveView("notes")}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                >
                  Все заметки →
                </button>
              </div>
              {recentNotes.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
                  Заметок пока нет
                </div>
              ) : (
                <div className="divide-y rounded-xl border bg-card overflow-hidden">
                  {recentNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        setActiveNote(note.id);
                        setActiveView("notes");
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted">
                        <FileText className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{note.title || "Без названия"}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {note.content?.slice(0, 80) || "Пустая заметка"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[11px] text-muted-foreground">{note.updatedAt}</span>
                        {note.tag && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground/60">{note.tag}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Stats */}
            <section>
              <h2 className="mb-3 text-sm font-medium">Статистика</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("notes")}
                  className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-xl font-semibold tracking-tight">{notes.length}</p>
                  <p className="text-xs text-muted-foreground">Заметок</p>
                </button>
                <button
                  type="button"
                  disabled={isProductionLocked}
                  onClick={() => { if (!isProductionLocked) setActiveView("tasks"); }}
                  className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-card"
                >
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-xl font-semibold tracking-tight">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Задач</p>
                </button>
                <div className="rounded-xl border bg-card p-3">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <p className="mt-2 text-xl font-semibold tracking-tight">{doneCount}</p>
                  <p className="text-xs text-muted-foreground">Выполнено</p>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <Loader2 className="size-4 text-blue-500" />
                  <p className="mt-2 text-xl font-semibold tracking-tight">{progressCount}</p>
                  <p className="text-xs text-muted-foreground">В работе</p>
                </div>
              </div>
            </section>

            {/* Favorites */}
            {favoriteNotes.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  Избранное
                </h2>
                <div className="space-y-1.5">
                  {favoriteNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        setActiveNote(note.id);
                        setActiveView("notes");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{note.title || "Без названия"}</p>
                        <p className="text-[10px] text-muted-foreground">{note.updatedAt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
