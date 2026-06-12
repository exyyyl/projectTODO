import { Bell, Check, ChevronRight, Database, HardDrive, Info, Keyboard, Palette, RotateCcw, Settings2 } from "lucide-react";
import { useState } from "react";

import { type ThemePreference, useAppStore } from "@/app/model/use-app-store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type SettingsSection = "general" | "appearance" | "notifications" | "storage" | "shortcuts" | "about";

const sections = [
  { id: "general", label: "Общие", icon: Settings2, group: "Приложение" },
  { id: "appearance", label: "Внешний вид", icon: Palette, group: "Приложение" },
  { id: "notifications", label: "Уведомления", icon: Bell, group: "Приложение" },
  { id: "storage", label: "Данные и хранилище", icon: HardDrive, group: "Система" },
  { id: "shortcuts", label: "Горячие клавиши", icon: Keyboard, group: "Система" },
  { id: "about", label: "О приложении", icon: Info, group: "Система" },
] satisfies Array<{ id: SettingsSection; label: string; icon: typeof Settings2; group: string }>;

export function SettingsSidebar({ active, onChange }: { active: SettingsSection; onChange: (value: SettingsSection) => void }) {
  return (
    <div className="flex h-full min-h-0 w-60 flex-col">
      <div className="flex h-12 items-center border-b px-4">
        <div><p className="text-sm font-semibold">Настройки</p><p className="text-[11px] text-muted-foreground">Project TODO</p></div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        {["Приложение", "Система"].map((group) => (
          <section className="mb-5 space-y-1" key={group}>
            <p className="flex h-7 items-center px-2 text-xs font-medium text-muted-foreground">{group}</p>
            {sections.filter((item) => item.group === group).map((item) => {
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
          </section>
        ))}
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
        <div className="mx-auto w-full max-w-4xl px-8 py-10 max-sm:px-5">
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
  if (active === "notifications") return <Page description="Напоминания о задачах и событиях приложения." title="Уведомления"><Empty icon={Bell} text="Система уведомлений появится после подключения локальной базы данных." /></Page>;
  if (active === "storage") return (
    <Page description="Состояние локальных данных и файлов приложения." title="Данные и хранилище">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"><Status icon={Database} label="Данные приложения" text="Сохраняются локально" /><Status icon={HardDrive} label="Файловое пространство" text="Подключение запланировано" /></div>
      <Group title="Опасная зона"><div className="flex items-start justify-between gap-5 p-4 max-sm:flex-col"><div><p className="text-sm font-medium">Сбросить локальные данные</p><p className="mt-1 text-xs text-muted-foreground">Удалит пространства, заметки, задачи и метаданные файлов.</p></div><Button onClick={onReset} variant="destructive"><RotateCcw />Сбросить</Button></div></Group>
    </Page>
  );
  if (active === "shortcuts") return <Page description="Быстрые действия, которые уже работают." title="Горячие клавиши"><Group title="Навигация и создание"><Shortcut label="Глобальный поиск" keys={["Ctrl", "K"]} /><Shortcut label="Новая заметка" keys={["Ctrl", "N"]} /><Shortcut label="Новая задача" keys={["Ctrl", "Shift", "T"]} /><Shortcut label="Скрыть сайдбар" keys={["Ctrl", "\\"]} /></Group></Page>;
  if (active === "about") return <Page description="Локальное пространство для заметок, задач и файлов." title="О приложении"><div className="rounded-xl border bg-card p-5"><div className="mb-5 grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">P</div><h2 className="text-lg font-semibold">Project TODO</h2><p className="mt-1 text-sm text-muted-foreground">Версия 0.1.0 · ранняя разработка</p></div></Page>;
  return <Page description="Основное поведение приложения и рабочего пространства." title="Общие"><Group title="Запуск"><LocalToggle label="Запускать при входе" text="Открывать приложение вместе с системой." /><LocalToggle initial label="Восстанавливать рабочее место" text="Продолжать с последнего открытого раздела." /></Group><Group title="Рабочее пространство"><Action label="Пространство по умолчанию" text="Первое пространство" /><Action label="Язык интерфейса" text="Русский" /></Group></Page>;
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

function Page({ children, description, title }: { children: React.ReactNode; description: string; title: string }) { return <><header className="mb-8 border-b pb-6"><p className="text-xs font-medium text-muted-foreground">Настройки</p><h1 className="mt-2 text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></header><div className="space-y-8">{children}</div></>; }
function Group({ children, title }: { children: React.ReactNode; title: string }) { return <section><h2 className="mb-3 text-sm font-medium">{title}</h2><div className="divide-y overflow-hidden rounded-xl border bg-card">{children}</div></section>; }
function Toggle({ enabled, label, onClick, text }: { enabled: boolean; label: string; onClick: () => void; text: string }) { return <button className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40" onClick={onClick} type="button"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span><span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${enabled ? "bg-primary" : "bg-muted"}`}><span className={`size-4 rounded-full bg-background shadow-sm transition-transform ${enabled ? "translate-x-4" : ""}`} /></span></button>; }
function LocalToggle({ initial = false, label, text }: { initial?: boolean; label: string; text: string }) { const [enabled, setEnabled] = useState(initial); return <Toggle enabled={enabled} label={label} onClick={() => setEnabled(!enabled)} text={text} />; }
function Action({ label, text }: { label: string; text: string }) { return <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40" type="button"><span className="text-sm font-medium">{label}</span><span className="flex items-center gap-2 text-xs text-muted-foreground">{text}<ChevronRight className="size-4" /></span></button>; }
function Shortcut({ keys, label }: { keys: string[]; label: string }) { return <div className="flex items-center justify-between gap-4 p-4"><span className="text-sm font-medium">{label}</span><span className="flex gap-1">{keys.map((key) => <kbd className="rounded-md border bg-muted px-2 py-1 text-[11px] text-muted-foreground" key={key}>{key}</kbd>)}</span></div>; }
function Status({ icon: Icon, label, text }: { icon: typeof Database; label: string; text: string }) { return <div className="rounded-xl border bg-card p-4"><Icon className="mb-5 size-4 text-muted-foreground" /><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }
function Empty({ icon: Icon, text }: { icon: typeof Bell; text: string }) { return <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"><div><Icon className="mx-auto mb-3 size-5 text-muted-foreground" /><p className="max-w-sm text-sm text-muted-foreground">{text}</p></div></div>; }
