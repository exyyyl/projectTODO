import { ArrowLeft, ArrowRight, CalendarDays, Check, Circle, Plus } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
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
import type { TaskStatus } from "@/entities/task/model/types";
import { WorkspacePageLayout } from "@/shared/ui/workspace-page-layout";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "planned", title: "Запланировано" },
  { id: "progress", title: "В работе" },
  { id: "done", title: "Готово" },
];

export function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const allTasks = useAppStore((state) => state.tasks);
  const tasks = useMemo(
    () => allTasks.filter((task) => task.workspaceId === activeWorkspaceId),
    [activeWorkspaceId, allTasks],
  );
  const createTask = useAppStore((state) => state.createTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    createTask(trimmedTitle);
    setTitle("");
    setIsCreateOpen(false);
  }

  return (
    <>
      <WorkspacePageLayout
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus />
            Новая задача
          </Button>
        }
        bodyClassName="overflow-x-auto overflow-y-hidden"
        contentClassName="h-full min-w-[960px]"
        description="Планирование работы по статусам и проектам."
        title="Тудушка"
      >
        <div className="grid h-full grid-cols-3 gap-4">
          {columns.map((column, columnIndex) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);

            return (
              <section className="flex min-h-0 flex-col rounded-xl border bg-muted/20" key={column.id}>
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{column.title}</span>
                    <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                  </div>
                  <Button aria-label={`Добавить задачу в «${column.title}»`} onClick={() => setIsCreateOpen(true)} size="icon-sm" variant="ghost">
                    <Plus />
                  </Button>
                </div>
                <div className="space-y-2 overflow-y-auto p-2">
                  {columnTasks.map((task) => (
                    <article className="group rounded-lg border bg-card p-3 shadow-sm" key={task.id}>
                      <div className="flex items-start gap-2">
                        <button
                          aria-label={task.status === "done" ? "Вернуть задачу в работу" : "Завершить задачу"}
                          className="mt-0.5 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => updateTaskStatus(task.id, task.status === "done" ? "progress" : "done")}
                          type="button"
                        >
                          {task.status === "done" ? <Check className="size-4" /> : <Circle className="size-4" />}
                        </button>
                        <h2 className="min-w-0 flex-1 text-sm font-medium leading-5">{task.title}</h2>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {task.due}
                        <div className="ml-auto flex opacity-0 transition-opacity group-hover:opacity-100">
                          {columnIndex > 0 && (
                            <Button
                              aria-label="Переместить задачу влево"
                              onClick={() => updateTaskStatus(task.id, columns[columnIndex - 1].id)}
                              size="icon-xs"
                              variant="ghost"
                            >
                              <ArrowLeft />
                            </Button>
                          )}
                          {columnIndex < columns.length - 1 && (
                            <Button
                              aria-label="Переместить задачу вправо"
                              onClick={() => updateTaskStatus(task.id, columns[columnIndex + 1].id)}
                              size="icon-xs"
                              variant="ghost"
                            >
                              <ArrowRight />
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">
                      В этой колонке пока нет задач
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </WorkspacePageLayout>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
              <DialogDescription>Задача появится в колонке «Запланировано».</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-5">
              <Label htmlFor="task-title">Название</Label>
              <Input
                autoFocus
                id="task-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, Продумать экран файлов"
                value={title}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCreateOpen(false)} type="button" variant="outline">Отмена</Button>
              <Button disabled={!title.trim()} type="submit">Создать задачу</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
