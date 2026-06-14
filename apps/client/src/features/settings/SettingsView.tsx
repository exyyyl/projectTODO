import { ArrowLeft, Check, Database, HardDrive, Info, Palette, RotateCcw, Sparkles, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type SettingsSection = "appearance" | "storage" | "updates" | "about";

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: typeof Palette;
}

interface SidebarCategory {
  title: string;
  items: SidebarItem[];
}

const categories: SidebarCategory[] = [
  {
    title: "Личные",
    items: [
      { id: "appearance", label: "Внешний вид", icon: Palette },
      { id: "storage", label: "Данные", icon: HardDrive },
    ],
  },
  {
    title: "Приложение",
    items: [
      { id: "updates", label: "Что нового", icon: Sparkles },
      { id: "about", label: "О приложении", icon: Info },
    ],
  },
];

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
    <div className="flex h-full min-h-0 w-60 flex-col bg-sidebar border-r">
      <div className="border-b p-2">
        <Button className="w-full justify-start rounded-lg hover:bg-muted/65 text-muted-foreground hover:text-foreground transition-colors" onClick={onBack} variant="ghost">
          <ArrowLeft className="mr-2 size-4" />
          Назад в приложение
          <kbd className="ml-auto text-[10px] text-muted-foreground">Esc</kbd>
        </Button>
      </div>
      
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-2 pt-4">
        {categories.map((category) => (
          <div key={category.title} className="space-y-1">
            <h3 className="px-3 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {category.title}
            </h3>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <Button
                    aria-pressed={isActive}
                    className={`w-full justify-start gap-2.5 px-3 py-1.5 h-9 rounded-md transition-all ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    }`}
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    variant="ghost"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function SettingsPage({ active }: { active: SettingsSection }) {
  const [isResetOpen, setIsResetOpen] = useState(false);
  const resetLocalData = useAppStore((state) => state.resetLocalData);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto bg-background/30">
        <div className="mx-auto w-full max-w-2xl px-8 py-12 max-sm:px-5">
          <SettingsContent active={active} onReset={() => setIsResetOpen(true)} />
        </div>
      </div>
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все локальные данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Пространства, заметки, задачи и метаданные файлов будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
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
      <Group title="Состояние хранилища">
        <div className="grid grid-cols-2 gap-px bg-border">
          <Status icon={Database} label="Данные приложения" text="Сохраняются локально" />
          <Status icon={HardDrive} label="Файловое пространство" text="Подключение запланировано" />
        </div>
      </Group>

      <Group title="Опасная зона">
        <SettingRow
          label="Сбросить локальные данные"
          description="Удалит пространства, заметки, задачи и метаданные файлов без возможности восстановления."
          control={
            <Button onClick={onReset} variant="destructive" size="sm">
              <RotateCcw className="mr-1.5 size-3.5" />
              Сбросить
            </Button>
          }
        />
      </Group>
    </Page>
  );
  if (active === "updates") return <Updates />;
  if (active === "about") return (
    <Page description="Локальное пространство для заметок, задач и файлов." title="О приложении">
      <div className="rounded-xl border bg-card p-6 flex items-start gap-4 shadow-sm">
        <img alt="Логотип Project TODO" className="size-16 rounded-2xl border shadow-inner shrink-0" src="/project-todo-icon-128.png" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Project TODO</h2>
          <p className="text-sm text-muted-foreground font-medium">Версия 0.1.0 · ранняя разработка</p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            Современный минималистичный органайзер для ваших повседневных дел, мыслей и проектов. Сделано с акцентом на скорость работы и приватность.
          </p>
        </div>
      </div>
    </Page>
  );
  return <Appearance />;
}

function DropdownSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: any) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-muted/60 hover:bg-muted border border-border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-foreground min-w-[150px] justify-between shadow-sm"
        type="button"
      >
        <span className="flex items-center gap-1.5">
          {selectedOption?.label}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-[170px] rounded-lg border bg-popover text-popover-foreground shadow-lg p-1 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left font-medium"
                  type="button"
                >
                  <span className="flex items-center gap-1.5">
                    {opt.label}
                  </span>
                  {isSelected && <Check className="size-3.5 text-foreground" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Appearance() {
  const theme = useAppStore((state) => state.themePreference);
  const setTheme = useAppStore((state) => state.setThemePreference);
  const animations = useAppStore((state) => state.areAnimationsEnabled);
  const setAnimations = useAppStore((state) => state.setAnimationsEnabled);

  const themeOptions = [
    { value: "system", label: "Системная тема" },
    { value: "light", label: "Светлая тема" },
    { value: "dark", label: "Тёмная тема" }
  ];

  return (
    <Page description="Тема, плотность интерфейса и движение." title="Внешний вид">
      <Group title="Цветовое оформление">
        <SettingRow
          label="Тема интерфейса"
          description="Выберите цветовую схему для интерфейса приложения."
          control={
            <DropdownSelect
              value={theme}
              onChange={setTheme}
              options={themeOptions}
            />
          }
        />
      </Group>

      <Group title="Интерфейс и поведение">
        <Toggle
          enabled={animations}
          label="Анимации интерфейса"
          onClick={() => setAnimations(!animations)}
          text="Показывает плавные переходы, анимацию сайдбара и микро-анимации."
        />
      </Group>
    </Page>
  );
}

function Updates() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fixes: true,
    improvements: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const improvements = [
    { tag: "Настройки", color: "emerald", text: "Полностью обновленный интерфейс настроек с чистыми боковыми панелями, категориями и унифицированными карточками опций." },
    { tag: "Настройки", color: "emerald", text: "Добавлена вкладка «Что нового» с интерактивной лентой обновлений, оформленной по стандартам ведущих продуктовых инструментов." },
    { tag: "Интерфейс", color: "blue", text: "Адаптирована сетка выбора тем под мобильные дисплеи и экраны малой ширины." },
    { tag: "Анимации", color: "purple", text: "Плавные переходы элементов управления и микро-анимации при наведении на переключатели." }
  ];

  const fixes = [
    { tag: "База данных", color: "amber", text: "Решена проблема с несоответствием схем локальной БД при обновлении миграций приложения." },
    { tag: "Производительность", color: "rose", text: "Устранены мелкие задержки отклика и снижен оверхед рендеринга боковой панели." },
    { tag: "Компактность", color: "blue", text: "Исправлено редкое сбрасывание состояния компактного режима при повторных сессиях." }
  ];

  const tagColors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Date & Version header */}
      <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground/80">
        <span>14 июня 2026</span>
        <span className="size-1 rounded-full bg-muted-foreground/40" />
        <span className="bg-foreground text-background dark:bg-foreground dark:text-background px-2 py-0.5 rounded-full text-[10px]">
          v0.1.0
        </span>
        <span className="size-1 rounded-full bg-muted-foreground/40" />
        <span className="text-emerald-500 font-medium">Актуальная версия</span>
      </div>

      {/* Main Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Сессии разработки в Project TODO</h1>
        <p className="text-sm text-muted-foreground/90 leading-relaxed">
          В этом обновлении мы сфокусировались на визуальной эстетике и удобстве взаимодействия. Настройки стали чище, а благодаря новой вкладке обновлений вы всегда будете видеть актуальный список изменений.
        </p>
      </div>

      {/* Video / Media Player */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/80 bg-zinc-950 flex items-center justify-center group cursor-pointer shadow-md">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-purple-500/5 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Glowing play button */}
        <div className="relative z-10 size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-white/20 group-hover:border-white/40 shadow-xl">
          <div className="w-0 h-0 border-y-7 border-y-transparent border-l-12 border-l-white ml-1.5" />
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-4 pt-4 border-t">
        {/* Improvements */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("improvements")}
            className="flex w-full items-center gap-2 text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors py-1"
          >
            {expandedSections.improvements ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            <span>Улучшения</span>
          </button>
          
          {expandedSections.improvements && (
            <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              {improvements.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                  <div className="space-x-2">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${tagColors[item.color]}`}>
                      {item.tag}
                    </span>
                    <span className="text-foreground/90">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixes */}
        <div className="space-y-2 border-t pt-4">
          <button
            onClick={() => toggleSection("fixes")}
            className="flex w-full items-center gap-2 text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors py-1"
          >
            {expandedSections.fixes ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            <span>Исправления</span>
          </button>
          
          {expandedSections.fixes && (
            <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              {fixes.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                  <div className="space-x-2">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${tagColors[item.color]}`}>
                      {item.tag}
                    </span>
                    <span className="text-foreground/90">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Page({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Group({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-0.5">{title}</h2>
      <div className="rounded-xl border bg-card shadow-sm divide-y divide-border/60">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 p-4 first:rounded-t-xl last:rounded-b-xl">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground leading-normal">{description}</p>
      </div>
      <div className="flex shrink-0 items-center">
        {control}
      </div>
    </div>
  );
}

function Toggle({ enabled, label, onClick, text }: { enabled: boolean; label: string; onClick: () => void; text: string }) {
  return (
    <button
      className="flex w-full items-center justify-between gap-6 p-4 text-left hover:bg-muted/30 transition-colors first:rounded-t-xl last:rounded-b-xl"
      onClick={onClick}
      type="button"
    >
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold text-foreground leading-tight">{label}</span>
        <span className="block text-xs text-muted-foreground leading-normal">{text}</span>
      </span>
      <span className={`flex h-5.5 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${enabled ? "bg-foreground" : "bg-muted-foreground/20"}`}>
        <span className={`size-4.5 rounded-full bg-background shadow-md transition-transform duration-200 ${enabled ? "translate-x-4.5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function Status({ icon: Icon, label, text }: { icon: typeof Database; label: string; text: string }) {
  return (
    <div className="bg-card p-4 flex items-start gap-3 first:rounded-t-xl last:rounded-b-xl">
      <div className="p-2 rounded-lg bg-muted/50 border shrink-0">
        <Icon className="size-4 text-foreground/80" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground leading-normal">{text}</p>
      </div>
    </div>
  );
}
