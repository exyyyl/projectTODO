import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  File,
  FileText,
  FolderClosed,
  Home,
  Inbox,
  LayoutGrid,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
} from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/features/workspace-switcher/WorkspaceSwitcher";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { sidebarByView } from "@/shared/config/navigation";

const icons = {
  inbox: Inbox,
  archive: Archive,
  calendar: CalendarDays,
  check: CheckCircle2,
  clock: Clock3,
  file: File,
  folder: FolderClosed,
  layout: LayoutGrid,
  star: Star,
  tag: Tag,
} as const;

const layoutOptions = [
  { id: "home", label: "Главная", icon: Home },
  { id: "notes", label: "Заметки", icon: FileText },
  { id: "tasks", label: "Тудушка", icon: ListTodo },
  { id: "files", label: "Файлы", icon: LayoutGrid },
] as const;

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const activeView = useAppStore((state) => state.activeView);
  const activeSidebarItem = useAppStore((state) => state.activeSidebarItem[activeView]);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const setActiveSidebarItem = useAppStore((state) => state.setActiveSidebarItem);
  const sidebarSections = sidebarByView[activeView];

  useEffect(() => {
    const layout = layoutRef.current;
    const sidebar = sidebarRef.current;
    const sidebarContent = sidebarContentRef.current;

    if (!layout || !sidebar || !sidebarContent) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = gsap.timeline({
      defaults: {
        duration: reduceMotion ? 0 : 0.28,
        ease: "power3.inOut",
        overwrite: "auto",
      },
    });

    if (isSidebarOpen) {
      gsap.set(sidebar, { visibility: "visible" });
      gsap.set(sidebarContent, { x: -18, autoAlpha: 0 });
      timeline
        .to(layout, { gridTemplateColumns: "240px minmax(0, 1fr)" }, 0)
        .to(sidebarContent, {
          x: 0,
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility",
        }, 0.08);
    } else {
      timeline
        .to(sidebarContent, { x: -18, autoAlpha: 0, duration: reduceMotion ? 0 : 0.18 }, 0)
        .to(layout, {
          gridTemplateColumns: "0px minmax(0, 1fr)",
          onComplete: () => gsap.set(sidebar, { visibility: "hidden" }),
        }, 0.04);
    }

    return () => {
      timeline.kill();
    };
  }, [isSidebarOpen]);

  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)] bg-background">
      <header className="flex items-center justify-between gap-4 border-b px-3">
        <div className="flex items-center gap-2">
          <Button
            aria-label={isSidebarOpen ? "Скрыть сайдбар" : "Показать сайдбар"}
            aria-pressed={!isSidebarOpen}
            onClick={() => setIsSidebarOpen((value) => !value)}
            size="icon-sm"
            variant="ghost"
          >
            {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <div
            aria-label="Режим рабочего пространства"
            className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5"
            role="group"
          >
          {layoutOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeView === option.id;

            return (
              <Button
                aria-pressed={isActive}
                className={
                  isActive
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground"
                }
                key={option.id}
                onClick={() => setActiveView(option.id)}
                size="sm"
                variant="ghost"
              >
                <Icon />
                {option.label}
              </Button>
            );
          })}
          </div>
        </div>
        <Button className="w-64 justify-start text-muted-foreground" variant="outline">
          <Search />
          Найти что угодно
          <kbd className="ml-auto text-[11px] text-muted-foreground">Ctrl K</kbd>
        </Button>
      </header>

      <div ref={layoutRef} className="grid min-h-0 grid-cols-[240px_minmax(0,1fr)]">
        <aside ref={sidebarRef} className="min-h-0 overflow-hidden border-r bg-sidebar text-sidebar-foreground">
          <div ref={sidebarContentRef} className="flex h-full min-h-0 w-60 flex-col">
          <div className="flex h-12 items-center border-b px-2">
            <WorkspaceSwitcher />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-2">
            {sidebarSections.map((section) => (
              <section className="space-y-1" key={section.id}>
                {section.label && (
                  <div className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
                    <span>{section.label}</span>
                    {section.addLabel && (
                      <Button aria-label={section.addLabel} size="icon-xs" variant="ghost">
                        <Plus />
                      </Button>
                    )}
                  </div>
                )}
                <nav aria-label={section.label ?? "Навигация раздела"} className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = icons[item.icon];
                    const isActive = activeSidebarItem === item.id;

                    return (
                      <Button
                        aria-pressed={isActive}
                        className={
                          isActive
                            ? "w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground"
                            : "w-full justify-start text-muted-foreground"
                        }
                        key={item.id}
                        onClick={() => setActiveSidebarItem(activeView, item.id)}
                        variant="ghost"
                      >
                        <Icon />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>
              </section>
            ))}
          </div>

          <div className="space-y-0.5 border-t p-2">
            <Button className="w-full justify-start text-muted-foreground" variant="ghost">
              <Archive />
              Архив
            </Button>
            <Button className="w-full justify-start text-muted-foreground" variant="ghost">
              <Settings />
              Настройки
            </Button>
          </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <WorkspacePage />
        </main>
      </div>
    </div>
  );
}
