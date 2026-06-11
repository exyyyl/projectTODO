import type { WorkspaceId } from "@/entities/workspace/model/types";

export type NoteId = string;

export interface Note {
  id: NoteId;
  workspaceId: WorkspaceId;
  title: string;
  content: string;
  tag: string;
  updatedAt: string;
}
