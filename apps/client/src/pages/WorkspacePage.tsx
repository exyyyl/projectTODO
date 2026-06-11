import { FilesPage } from "@/pages/files/FilesPage";
import { HomePage } from "@/pages/home/HomePage";
import { NotesPage } from "@/pages/notes/NotesPage";
import { TasksPage } from "@/pages/tasks/TasksPage";
import { useAppStore } from "@/app/model/use-app-store";

export function WorkspacePage() {
  const activeView = useAppStore((state) => state.activeView);

  if (activeView === "home") {
    return <HomePage />;
  }

  if (activeView === "tasks") {
    return <TasksPage />;
  }

  if (activeView === "files") {
    return <FilesPage />;
  }

  return <NotesPage />;
}
