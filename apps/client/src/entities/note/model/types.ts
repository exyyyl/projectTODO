import type { WorkspaceId } from "@/entities/workspace/model/types";

export type NoteId = string;

export interface Note {
  id: NoteId;
  workspaceId: WorkspaceId;
  title: string;
  content: string;
  tag: string;
  notebook: string;
  isFavorite: boolean;
  deletedAt?: string;
  updatedAt: string;
}

export type NoteChanges = Partial<Omit<Note, "id" | "workspaceId">>;
