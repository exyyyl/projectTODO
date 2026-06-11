import type { WorkspaceId } from "@/entities/workspace/model/types";

export type AssetId = string;

export interface Asset {
  id: AssetId;
  workspaceId: WorkspaceId;
  name: string;
  kind: string;
  size: string;
  collection: string;
  tags: string[];
  previewUrl?: string;
  isImage: boolean;
}
