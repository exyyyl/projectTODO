import { ArrowRight, CheckCircle2, FileText, LayoutGrid } from "lucide-react";

import { useAppStore, type WorkspaceView } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import { WorkspacePageLayout } from "@/shared/ui/workspace-page-layout";

const summary = [
  {
    id: "notes",
    label: "Заметки",
    value: "12",
    description: "3 обновлены сегодня",
    icon: FileText,
  },
  {
    id: "tasks",
    label: "Задачи",
    value: "5",
    description: "2 требуют внимания",
    icon: CheckCircle2,
  },
  {
    id: "files",
    label: "Файлы",
    value: "48",
    description: "4 добавлены недавно",
    icon: LayoutGrid,
  },
] as const;

export function HomePage() {
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <WorkspacePageLayout
      description="Всё важное из рабочего пространства в одном месте."
      title="Главная"
    >
        <section className="grid grid-cols-3 gap-4">
          {summary.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className="group rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                key={item.id}
                onClick={() => setActiveView(item.id as WorkspaceView)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg border bg-muted/40">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-5 text-2xl font-semibold tracking-tight">{item.value}</p>
                <p className="mt-1 text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </button>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Недавняя активность</h2>
            <Button size="sm" variant="ghost">Показать всё</Button>
          </div>
          <div className="divide-y rounded-xl border bg-card">
            {[
              ["Идеи для приложения", "Заметка обновлена", "14:32"],
              ["dashboard-reference.png", "Файл добавлен в Референсы", "12:18"],
              ["Навигационный фундамент", "Задача перемещена в работу", "10:45"],
            ].map(([title, description, time]) => (
              <div className="flex items-center gap-3 px-4 py-3" key={title}>
                <div className="grid size-8 place-items-center rounded-lg bg-muted">
                  <FileText className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>
        </section>
    </WorkspacePageLayout>
  );
}
