export type WorkspaceId = string;

export interface Workspace {
  id: WorkspaceId;
  name: string;
  rootPath: string;
  accent: string;
}
