import { Check, ChevronDown, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceSwitcher() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaces = useAppStore((state) => state.workspaces);
  const createWorkspace = useAppStore((state) => state.createWorkspace);
  const setActiveWorkspace = useAppStore((state) => state.setActiveWorkspace);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    createWorkspace(trimmedName);
    setName("");
    setIsMenuOpen(false);
    setIsCreateOpen(false);
  }

  function openCreateDialog() {
    setIsMenuOpen(false);
    window.setTimeout(() => setIsCreateOpen(true), 0);
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between" variant="ghost">
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-semibold text-background">
                {activeWorkspace.accent}
              </span>
              <span className="truncate">{activeWorkspace.name}</span>
            </span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[224px]">
          <DropdownMenuLabel>Рабочие пространства</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              className="gap-2"
              key={workspace.id}
              onSelect={() => {
                setActiveWorkspace(workspace.id);
                setIsMenuOpen(false);
              }}
            >
              <span className="grid size-6 place-items-center rounded-md bg-muted text-[10px] font-semibold">
                {workspace.accent}
              </span>
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              {workspace.id === activeWorkspaceId && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openCreateDialog}>
            <Plus />
            Новое пространство
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Новое пространство</DialogTitle>
              <DialogDescription>
                Создайте отдельное место для заметок, задач и файлов.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-5">
              <Label htmlFor="workspace-name">Название</Label>
              <Input
                autoFocus
                id="workspace-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Например, Личный проект"
                value={name}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCreateOpen(false)} type="button" variant="outline">
                Отмена
              </Button>
              <Button disabled={!name.trim()} type="submit">
                Создать пространство
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
