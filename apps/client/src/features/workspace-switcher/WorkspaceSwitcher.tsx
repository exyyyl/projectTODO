import { Check, ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaces = useAppStore((state) => state.workspaces);
  const createWorkspace = useAppStore((state) => state.createWorkspace);
  const deleteWorkspace = useAppStore((state) => state.deleteWorkspace);
  const renameWorkspace = useAppStore((state) => state.renameWorkspace);
  const setActiveWorkspace = useAppStore((state) => state.setActiveWorkspace);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    if (editingWorkspaceId) renameWorkspace(editingWorkspaceId, trimmedName);
    else createWorkspace(trimmedName);
    setName("");
    setEditingWorkspaceId(null);
    setIsMenuOpen(false);
    setIsCreateOpen(false);
  }

  function openCreateDialog() {
    setIsMenuOpen(false);
    window.setTimeout(() => setIsCreateOpen(true), 0);
  }

  function openRenameDialog(workspaceId: string, workspaceName: string) {
    setEditingWorkspaceId(workspaceId);
    setName(workspaceName);
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
            <div className="group flex items-center rounded-md focus-within:bg-accent hover:bg-accent" key={workspace.id}>
              <DropdownMenuItem
                className="min-w-0 flex-1 gap-2 focus:bg-transparent"
                onSelect={() => {
                  setActiveWorkspace(workspace.id);
                  setIsMenuOpen(false);
                }}
              >
                <span className="grid size-6 place-items-center rounded-md bg-muted text-[10px] font-semibold">{workspace.accent}</span>
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {workspace.id === activeWorkspaceId && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label={`Действия с пространством «${workspace.name}»`} className="mr-1 grid size-6 place-items-center rounded opacity-0 hover:bg-muted group-hover:opacity-100" type="button">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onSelect={() => openRenameDialog(workspace.id, workspace.name)}><Pencil />Переименовать</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={workspaces.length <= 1}
                    onSelect={() => setWorkspaceToDelete({ id: workspace.id, name: workspace.name })}
                    variant="destructive"
                  >
                    <Trash2 />Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openCreateDialog}>
            <Plus />
            Новое пространство
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setEditingWorkspaceId(null);
          setName("");
        }
      }}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>{editingWorkspaceId ? "Переименовать пространство" : "Новое пространство"}</DialogTitle>
              <DialogDescription>
                {editingWorkspaceId ? "Название изменится только на этом устройстве." : "Создайте отдельное место для заметок, задач и файлов."}
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
                {editingWorkspaceId ? "Сохранить" : "Создать пространство"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(workspaceToDelete)} onOpenChange={(open) => {
        if (!open) setWorkspaceToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пространство?</AlertDialogTitle>
            <AlertDialogDescription>
              Пространство «{workspaceToDelete?.name}» и все его локальные заметки, задачи и файлы будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (workspaceToDelete) deleteWorkspace(workspaceToDelete.id);
                setWorkspaceToDelete(null);
              }}
              variant="destructive"
            >
              Удалить пространство
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
