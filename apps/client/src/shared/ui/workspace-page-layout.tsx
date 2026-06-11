import type { ReactNode } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { cn } from "@/lib/utils";

interface WorkspacePageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  contentClassName?: string;
}

export function WorkspacePageLayout({
  title,
  description,
  actions,
  children,
  bodyClassName,
  contentClassName,
}: WorkspacePageLayoutProps) {
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaceName = useAppStore(
    (state) =>
      state.workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ??
      "Рабочее пространство",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b">
        <div className="mx-auto flex min-h-24 w-full max-w-[1480px] items-center justify-between gap-6 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{workspaceName}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </header>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
        <div className={cn("mx-auto w-full max-w-[1480px] p-6", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
