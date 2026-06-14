import { ArrowLeft, Check, Database, HardDrive, Info, Palette, RotateCcw } from "lucide-react";
import { useState } from "react";

import { type ThemePreference, useAppStore } from "@/app/model/use-app-store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type SettingsSection = "appearance" | "storage" | "about";

const sections = [
  { id: "appearance", label: "Внешний вид", icon: Palette },
  { id: "storage", label: "Данные", icon: HardDrive },
  { id: "about", label: "О приложении", icon: Info },
] satisfies Array<{ id: SettingsSection; label: string; icon: typeof Palette }>;

export function SettingsSidebar({
  active,
  onBack,
  onChange,
}: {
  active: SettingsSection;
  onBack: () => void;
  onChange: (value: SettingsSection) => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-60 flex-col">
      <div className="border-b p-2">
        <Button className="w-full justify-start rounded-lg" onClick={onBack} variant="secondary">
          <ArrowLeft />
          Назад в приложение
          <kbd className="ml-auto text-[10px] text-muted-foreground">Esc</kbd>
        </Button>
      </div>
      <div className="px-4 pb-2 pt-4"><p className="text-sm font-semibold">Настройки</p><p className="text-[11px] text-muted-foreground">Project TODO</p></div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              aria-pressed={active === item.id}
              className={active === item.id ? "w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground" : "w-full justify-start text-muted-foreground"}
              key={item.id}
              onClick={() => onChange(item.id)}
              variant="ghost"
            >
              <Icon />{item.label}
            </Button>
          );
        })}
      </nav>
      <p className="border-t p-3 text-xs leading-5 text-muted-foreground">Настройки сохраняются локально на этом устройстве.</p>
    </div>
  );
}

export function SettingsPage({ active }: { active: SettingsSection }) {
  const [isResetOpen, setIsResetOpen] = useState(false);
  const resetLocalData = useAppStore((state) => state.resetLocalData);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-8 py-12 max-sm:px-5">
          <SettingsContent active={active} onReset={() => setIsResetOpen(true)} />
        </div>
      </div>
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все локальные данные?</AlertDialogTitle>
            <AlertDialogDescription>Пространства, заметки, задачи и метаданные файлов будут удалены. Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={resetLocalData} variant="destructive">Сбросить данные</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SettingsContent({ active, onReset }: { active: SettingsSection; onReset: () => void }) {
  if (active === "appearance") return <Appearance />;
  if (active === "storage") return (
    <Page description="Состояние локальных данных и файлов приложения." title="Данные и хранилище">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"><Status icon={Database} label="Данные приложения" text="Сохраняются локально" /><Status icon={HardDrive} label="Файловое пространство" text="Подключение запланировано" /></div>
      <Group title="Опасная зона"><div className="flex items-start justify-between gap-5 p-4 max-sm:flex-col"><div><p className="text-sm font-medium">Сбросить локальные данные</p><p className="mt-1 text-xs text-muted-foreground">Удалит пространства, заметки, задачи и метаданные файлов.</p></div><Button onClick={onReset} variant="destructive"><RotateCcw />Сбросить</Button></div></Group>
    </Page>
  );
  if (active === "about") return <Page description="Локальное пространство для заметок, задач и файлов." title="О приложении"><div className="rounded-xl border bg-card p-5"><img alt="Логотип Project TODO" className="mb-5 size-14 rounded-xl border shadow-sm" src="/project-todo-icon-128.png" /><h2 className="text-lg font-semibold">Project TODO</h2><p className="mt-1 text-sm text-muted-foreground">Версия 0.1.0 · ранняя разработка</p></div></Page>;
  return <Appearance />;
}

function Appearance() {
  const theme = useAppStore((state) => state.themePreference);
  const setTheme = useAppStore((state) => state.setThemePreference);
  const compact = useAppStore((state) => state.isCompactMode);
  const animations = useAppStore((state) => state.areAnimationsEnabled);
  const setCompact = useAppStore((state) => state.setCompactMode);
  const setAnimations = useAppStore((state) => state.setAnimationsEnabled);
  const themes: Array<[ThemePreference, string, string]> = [["dark", "Тёмная", "bg-background"], ["system", "Системная", "bg-gradient-to-r from-background to-foreground"], ["light", "Светлая", "bg-white"]];

  return <Page description="Тема, плотность интерфейса и движение." title="Внешний вид"><Group title="Тема приложения"><div className="grid grid-cols-3 gap-3 p-4 max-sm:grid-cols-1">{themes.map(([value, label, preview]) => <button className={`rounded-lg border p-2 text-left hover:bg-muted/50 ${theme === value ? "border-foreground bg-muted/50" : ""}`} key={value} onClick={() => setTheme(value)} type="button"><span className={`mb-2 block h-16 rounded-md border ${preview}`} /><span className="flex items-center justify-between px-1 pb-1 text-xs font-medium">{label}{theme === value ? <Check className="size-3.5" /> : null}</span></button>)}</div></Group><Group title="Интерфейс"><Toggle enabled={compact} label="Компактный режим" onClick={() => setCompact(!compact)} text="Уменьшает высоту кнопок и плотнее размещает элементы." /><Toggle enabled={animations} label="Анимации интерфейса" onClick={() => setAnimations(!animations)} text="Показывает плавные переходы и анимацию сайдбара." /></Group></Page>;
}

function Page({ children, description, title }: { children: React.ReactNode; description: string; title: string }) { return <><header className="mb-10"><p className="text-xs font-medium text-muted-foreground">Настройки</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></header><div className="space-y-10">{children}</div></>; }
function Group({ children, title }: { children: React.ReactNode; title: string }) { return <section><h2 className="mb-3 text-sm font-semibold">{title}</h2><div className="divide-y overflow-hidden rounded-lg border bg-card/70">{children}</div></section>; }
function Toggle({ enabled, label, onClick, text }: { enabled: boolean; label: string; onClick: () => void; text: string }) { return <button className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40" onClick={onClick} type="button"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span><span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${enabled ? "bg-primary" : "bg-muted"}`}><span className={`size-4 rounded-full bg-background shadow-sm transition-transform ${enabled ? "translate-x-4" : ""}`} /></span></button>; }
function Status({ icon: Icon, label, text }: { icon: typeof Database; label: string; text: string }) { return <div className="rounded-xl border bg-card p-4"><Icon className="mb-5 size-4 text-muted-foreground" /><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }
