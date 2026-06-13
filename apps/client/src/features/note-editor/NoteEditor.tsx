import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  BookOpen,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  MoreHorizontal,
  PanelLeftOpen,
  Quote,
  RotateCcw,
  Star,
  Strikethrough,
  Table2,
  Text,
  Trash2,
  UnderlineIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note, NoteChanges } from "@/entities/note/model/types";

interface NoteEditorProps {
  isNotesPanelOpen: boolean;
  note: Note;
  notebooks: string[];
  onDeletePermanently: () => void;
  onMoveToNotebook: (notebook: string) => void;
  onMoveToTrash: () => void;
  onRestore: () => void;
  onShowNotesPanel: () => void;
  onToggleFavorite: () => void;
  onUpdate: (changes: NoteChanges) => void;
}

interface SlashCommand {
  description: string;
  icon: typeof Text;
  label: string;
  run: (editor: Editor) => void;
}

const slashCommands: SlashCommand[] = [
  { label: "Обычный текст", description: "Начать простой абзац", icon: Text, run: (editor) => editor.chain().focus().setParagraph().run() },
  { label: "Заголовок 1", description: "Большой заголовок раздела", icon: Heading1, run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Заголовок 2", description: "Заголовок подраздела", icon: Heading2, run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Заголовок 3", description: "Небольшой заголовок", icon: Heading3, run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Маркированный список", description: "Список с маркерами", icon: List, run: (editor) => editor.chain().focus().toggleBulletList().run() },
  { label: "Нумерованный список", description: "Последовательность шагов", icon: ListOrdered, run: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { label: "Список задач", description: "Интерактивные чекбоксы", icon: ListChecks, run: (editor) => editor.chain().focus().toggleTaskList().run() },
  { label: "Цитата", description: "Выделить важную мысль", icon: Quote, run: (editor) => editor.chain().focus().toggleBlockquote().run() },
  { label: "Блок кода", description: "Фрагмент программного кода", icon: Code2, run: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { label: "Разделитель", description: "Разделить смысловые блоки", icon: Minus, run: (editor) => editor.chain().focus().setHorizontalRule().run() },
  {
    label: "Таблица",
    description: "Таблица из трёх колонок",
    icon: Table2,
    run: (editor) => editor.chain().focus().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run(),
  },
  { label: "Жирный текст", description: "Выделить важное", icon: Bold, run: (editor) => editor.chain().focus().toggleBold().run() },
  { label: "Курсив", description: "Добавить акцент", icon: Italic, run: (editor) => editor.chain().focus().toggleItalic().run() },
  { label: "Зачёркнутый текст", description: "Отметить неактуальное", icon: Strikethrough, run: (editor) => editor.chain().focus().toggleStrike().run() },
  { label: "Строчный код", description: "Выделить команду или код", icon: Code2, run: (editor) => editor.chain().focus().toggleCode().run() },
];

function ToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: typeof Bold;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="project-editor-tool"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      type="button"
    >
      <Icon />
    </button>
  );
}

export function NoteEditor({
  isNotesPanelOpen,
  note,
  notebooks,
  onDeletePermanently,
  onMoveToNotebook,
  onMoveToTrash,
  onRestore,
  onShowNotesPanel,
  onToggleFavorite,
  onUpdate,
}: NoteEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{ left: number; query: string; top: number } | null>(null);
  const [selectedCommand, setSelectedCommand] = useState(0);
  const replacingContent = useRef(false);
  const editor = useEditor({
    content: note.content,
    contentType: "markdown",
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder: "Начните писать или введите / для команд..." }),
      Markdown,
    ],
    editorProps: {
      attributes: {
        "aria-label": "Редактор заметки",
        class: "project-tiptap-content",
      },
      handleKeyDown(view, event) {
        if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
          const { from, empty } = view.state.selection;
          if (!empty) return false;

          const coords = view.coordsAtPos(from);
          setSlashMenu({
            left: Math.max(12, Math.min(coords.left, window.innerWidth - 292)),
            query: "",
            top: Math.max(12, Math.min(coords.bottom + 8, window.innerHeight - 380)),
          });
          setSelectedCommand(0);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (!replacingContent.current) onUpdate({ content: currentEditor.getMarkdown() });
    },
  });

  const visibleCommands = useMemo(() => {
    const query = slashMenu?.query.trim().toLocaleLowerCase("ru") ?? "";
    if (!query) return slashCommands;
    return slashCommands.filter((command) =>
      `${command.label} ${command.description}`.toLocaleLowerCase("ru").includes(query),
    );
  }, [slashMenu?.query]);

  useEffect(() => {
    if (!editor) return;
    replacingContent.current = true;
    editor.commands.setContent(note.content, { contentType: "markdown", emitUpdate: false });
    editor.setEditable(!note.deletedAt);
    replacingContent.current = false;
  }, [editor, note.deletedAt, note.id]);

  useEffect(() => {
    if (!slashMenu || !editor) return;

    function handleSlashNavigation(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSlashMenu(null);
        editor.commands.focus();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setSelectedCommand((current) => (current + direction + visibleCommands.length) % visibleCommands.length);
        return;
      }
      if (event.key === "Enter" && visibleCommands[selectedCommand]) {
        event.preventDefault();
        runSlashCommand(visibleCommands[selectedCommand]);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setSlashMenu((current) => current && ({ ...current, query: current.query.slice(0, -1) }));
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setSlashMenu((current) => current && ({ ...current, query: current.query + event.key }));
        setSelectedCommand(0);
      }
    }

    document.addEventListener("keydown", handleSlashNavigation, true);
    return () => document.removeEventListener("keydown", handleSlashNavigation, true);
  }, [editor, selectedCommand, slashMenu, visibleCommands]);

  useEffect(() => {
    if (!slashMenu) return;

    function closeSlashMenu(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest(".project-slash-menu")) setSlashMenu(null);
    }

    document.addEventListener("pointerdown", closeSlashMenu);
    return () => document.removeEventListener("pointerdown", closeSlashMenu);
  }, [slashMenu]);

  function runSlashCommand(command: SlashCommand) {
    if (!editor) return;
    command.run(editor);
    setSlashMenu(null);
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Адрес ссылки", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b px-3">
        <div className="flex min-w-0 items-center gap-1">
          {!isNotesPanelOpen && (
            <Button aria-label="Показать список заметок" onClick={onShowNotesPanel} size="icon-sm" variant="ghost">
              <PanelLeftOpen />
            </Button>
          )}
          <span className="max-w-72 truncate text-sm font-medium">{note.title || "Без названия"}</span>
          <span className="ml-2 text-xs text-muted-foreground">Сохранено локально</span>
        </div>
        <div className="flex items-center gap-0.5">
          {!note.deletedAt && (
            <Button
              aria-label={note.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
              aria-pressed={note.isFavorite}
              onClick={onToggleFavorite}
              size="icon-sm"
              variant="ghost"
            >
              <Star className={note.isFavorite ? "fill-current" : ""} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Другие действия" size="icon-sm" variant="ghost"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {note.deletedAt ? (
                <>
                  <DropdownMenuItem onSelect={onRestore}><RotateCcw />Восстановить</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onDeletePermanently} variant="destructive">
                    <Trash2 />Удалить навсегда
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onSelect={onToggleFavorite}>
                    <Star className={note.isFavorite ? "fill-current" : ""} />
                    {note.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><BookOpen />Переместить в блокнот</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Блокноты</DropdownMenuLabel>
                      {notebooks.map((notebook) => (
                        <DropdownMenuItem
                          disabled={note.notebook === notebook}
                          key={notebook}
                          onSelect={() => onMoveToNotebook(notebook)}
                        >
                          {notebook}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onMoveToTrash} variant="destructive">
                    <Trash2 />Переместить в корзину
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-10 pb-32 pt-10 max-sm:px-5">
          <input
            aria-label="Заголовок заметки"
            className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
            onChange={(event) => onUpdate({ title: event.target.value })}
            placeholder="Без названия"
            readOnly={Boolean(note.deletedAt)}
            value={note.title}
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-1.5 py-0.5">{note.notebook}</span>
            {note.deletedAt && <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive">В корзине</span>}
            <span>Обновлено {note.updatedAt.toLowerCase()}</span>
          </div>

          {editor && (
            <>
              <BubbleMenu editor={editor} options={{ placement: "top" }}>
                <div className="project-selection-toolbar">
                  <ToolbarButton active={editor.isActive("bold")} icon={Bold} label="Жирный" onClick={() => editor.chain().focus().toggleBold().run()} />
                  <ToolbarButton active={editor.isActive("italic")} icon={Italic} label="Курсив" onClick={() => editor.chain().focus().toggleItalic().run()} />
                  <ToolbarButton active={editor.isActive("underline")} icon={UnderlineIcon} label="Подчёркнутый" onClick={() => editor.chain().focus().toggleUnderline().run()} />
                  <ToolbarButton active={editor.isActive("strike")} icon={Strikethrough} label="Зачёркнутый" onClick={() => editor.chain().focus().toggleStrike().run()} />
                  <ToolbarButton active={editor.isActive("code")} icon={Code2} label="Строчный код" onClick={() => editor.chain().focus().toggleCode().run()} />
                  <span className="project-editor-tool-separator" />
                  <ToolbarButton active={editor.isActive("link")} icon={Link} label="Ссылка" onClick={setLink} />
                </div>
              </BubbleMenu>
              <EditorContent className="project-tiptap-editor mt-8" editor={editor} />
            </>
          )}
        </div>
      </main>

      {slashMenu && (
        <div className="project-slash-menu" style={{ left: slashMenu.left, top: slashMenu.top }}>
          <div className="border-b px-3 py-2">
            <span className="block text-[11px] font-medium text-muted-foreground">Команды</span>
            {slashMenu.query && <span className="mt-0.5 block truncate text-xs">/{slashMenu.query}</span>}
          </div>
          <div className="p-1">
            {visibleCommands.length ? visibleCommands.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  className="project-slash-command"
                  data-selected={index === selectedCommand}
                  key={command.label}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runSlashCommand(command);
                  }}
                  type="button"
                >
                  <span className="grid size-7 place-items-center rounded-md border bg-muted/40"><Icon className="size-3.5" /></span>
                  <span><span className="block text-xs font-medium">{command.label}</span><span className="block text-[11px] text-muted-foreground">{command.description}</span></span>
                </button>
              );
            }) : <div className="px-3 py-5 text-center text-xs text-muted-foreground">Команды не найдены</div>}
          </div>
        </div>
      )}
    </div>
  );
}
