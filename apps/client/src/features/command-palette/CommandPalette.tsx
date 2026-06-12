import { FileText, Home, LayoutGrid, ListTodo, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { type WorkspaceView, useAppStore } from "@/app/model/use-app-store";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { id: "home", label: "Открыть главную", icon: Home },
  { id: "notes", label: "Открыть заметки", icon: FileText },
  { id: "tasks", label: "Открыть тудушку", icon: ListTodo },
  { id: "files", label: "Открыть файлы", icon: LayoutGrid },
] satisfies Array<{ id: WorkspaceView; label: string; icon: typeof Home }>;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const setActiveView = useAppStore((state) => state.setActiveView);
  const createNote = useAppStore((state) => state.createNote);
  const createTask = useAppStore((state) => state.createTask);

  const commands = useMemo(() => {
    const actions = [
      ...navigationItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        run: () => setActiveView(item.id),
      })),
      { label: "Создать новую заметку", icon: Plus, run: createNote },
      { label: "Создать новую задачу", icon: Plus, run: () => createTask("Новая задача") },
    ];

    return actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));
  }, [createNote, createTask, query, setActiveView]);

  function runCommand(command: () => void) {
    command();
    setQuery("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Глобальный поиск</DialogTitle>
        <DialogDescription className="sr-only">Быстрый переход и создание элементов.</DialogDescription>
        <label className="relative block border-b">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="h-12 rounded-none border-0 bg-transparent pl-11 pr-4 text-sm focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти действие..."
            value={query}
          />
        </label>
        <div className="max-h-80 overflow-y-auto p-2">
          {commands.length > 0 ? commands.map((command) => {
            const Icon = command.icon;
            return (
              <button
                className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                key={command.label}
                onClick={() => runCommand(command.run)}
                type="button"
              >
                <Icon className="size-4" />
                {command.label}
              </button>
            );
          }) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</p>
          )}
        </div>
        <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">Esc закрыть · Ctrl K открыть</div>
      </DialogContent>
    </Dialog>
  );
}
