import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { ArrowLeft, CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Note } from "@/entities/note/model/types";

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onUpdate: (changes: Partial<Pick<Note, "title" | "content">>) => void;
}

export function NoteEditor({ note, onBack, onUpdate }: NoteEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-3">
        <div className="flex min-w-0 items-center gap-1">
          <Button aria-label="Назад к заметкам" onClick={onBack} size="icon-sm" variant="ghost">
            <ArrowLeft />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <span className="max-w-72 truncate text-sm font-medium">{note.title || "Без названия"}</span>
          <span className="ml-2 text-xs text-muted-foreground">Сохранено локально</span>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <CircleHelp className="size-3.5" />
          Markdown-команды применяются во время набора
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-10 pb-32 pt-12 max-sm:px-5">
          <input
            aria-label="Заголовок заметки"
            className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
            onChange={(event) => onUpdate({ title: event.target.value })}
            placeholder="Без названия"
            value={note.title}
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-1.5 py-0.5">{note.tag}</span>
            <span>Обновлено {note.updatedAt.toLowerCase()}</span>
          </div>

          <MDXEditor
            className="project-markdown-editor mt-8"
            contentEditableClassName="project-markdown-content"
            key={note.id}
            markdown={note.content}
            onChange={(content) => onUpdate({ content })}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              tablePlugin(),
              codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
              codeMirrorPlugin({
                codeBlockLanguages: {
                  text: "Текст",
                  js: "JavaScript",
                  ts: "TypeScript",
                  tsx: "TSX",
                  css: "CSS",
                  html: "HTML",
                  json: "JSON",
                  rust: "Rust",
                },
              }),
              markdownShortcutPlugin(),
              toolbarPlugin({
                toolbarClassName: "project-markdown-toolbar",
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BlockTypeSelect />
                    <BoldItalicUnderlineToggles />
                    <CodeToggle />
                    <CreateLink />
                    <Separator />
                    <ListsToggle />
                    <InsertTable />
                    <InsertCodeBlock />
                    <InsertThematicBreak />
                  </>
                ),
              }),
            ]}
          />
        </div>
      </main>
    </div>
  );
}
