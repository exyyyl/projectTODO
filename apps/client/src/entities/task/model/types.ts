import type { WorkspaceId } from "@/entities/workspace/model/types";

export type TaskId = string;
export type TaskStatus = "planned" | "progress" | "done";

export interface Task {
  id: TaskId;
  workspaceId: WorkspaceId;
  title: string;
  status: TaskStatus;
  due: string;
}
