import {
  ArrowLeft,
  File,
  FileText,
  Grid2X2,
  Image,
  List,
  Plus,
  Tag,
  Upload,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetId } from "@/entities/asset/model/types";
import { cn } from "@/lib/utils";
import { WorkspacePageLayout } from "@/shared/ui/workspace-page-layout";

type FileView = "grid" | "list";

export function FilesPage() {
  const [view, setView] = useState<FileView>("grid");
  const [openAssetId, setOpenAssetId] = useState<AssetId | null>(null);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const allAssets = useAppStore((state) => state.assets);
  const activeSidebarItem = useAppStore((state) => state.activeSidebarItem.files);
  const collections = useAppStore(
    (state) => state.assetCollections[state.activeWorkspaceId] ?? [],
  );
  const importAssets = useAppStore((state) => state.importAssets);
  const createAssetCollection = useAppStore((state) => state.createAssetCollection);
  const updateAsset = useAppStore((state) => state.updateAsset);
  const assets = useMemo(() => {
    const workspaceAssets = allAssets.filter((asset) => asset.workspaceId === activeWorkspaceId);

    if (activeSidebarItem === "design") {
      return workspaceAssets.filter((asset) => asset.collection === "Дизайн");
    }
    if (activeSidebarItem === "references") {
      return workspaceAssets.filter((asset) => asset.collection === "Референсы");
    }
    if (activeSidebarItem === "important") {
      return workspaceAssets.filter((asset) => asset.tags.includes("Важное"));
    }
    if (activeSidebarItem === "inspiration") {
      return workspaceAssets.filter((asset) => asset.tags.includes("Вдохновение"));
    }

    return workspaceAssets;
  }, [activeSidebarItem, activeWorkspaceId, allAssets]);
  const openAsset = allAssets.find((asset) => asset.id === openAssetId);

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      importAssets(files);
    }
    event.target.value = "";
  }

  function handleCreateCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = collectionName.trim();
    if (!name) return;
    createAssetCollection(name);
    setCollectionName("");
    setIsCollectionOpen(false);
  }

  if (openAsset) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <div className="flex items-center gap-2">
            <Button aria-label="Назад к файлам" onClick={() => setOpenAssetId(null)} size="icon-sm" variant="ghost">
              <ArrowLeft />
            </Button>
            <span className="max-w-96 truncate text-sm font-medium">{openAsset.name}</span>
          </div>
          <Button variant="outline">Открыть оригинал</Button>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]">
          <main className="grid min-h-0 place-items-center overflow-auto bg-muted/10 p-8">
            {openAsset.previewUrl ? (
              <img alt={openAsset.name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" src={openAsset.previewUrl} />
            ) : (
              <div className="grid aspect-[4/3] w-full max-w-xl place-items-center rounded-2xl border bg-card">
                <FileText className="size-20 text-muted-foreground" />
              </div>
            )}
          </main>
          <aside className="min-h-0 overflow-y-auto border-l p-5">
            <h2 className="text-sm font-semibold">Сведения о файле</h2>
            <div className="mt-5 grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="asset-name">Название</Label>
                <Input id="asset-name" onChange={(event) => updateAsset(openAsset.id, { name: event.target.value })} value={openAsset.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-collection">Коллекция</Label>
                <select
                  className="h-8 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="asset-collection"
                  onChange={(event) => updateAsset(openAsset.id, { collection: event.target.value })}
                  value={openAsset.collection}
                >
                  <option>Без коллекции</option>
                  {collections.map((collection) => <option key={collection}>{collection}</option>)}
                </select>
              </div>
              <div>
                <Label>Теги</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Важное", "Вдохновение"].map((tag) => {
                    const active = openAsset.tags.includes(tag);
                    return (
                      <Button
                        key={tag}
                        onClick={() => updateAsset(openAsset.id, {
                          tags: active ? openAsset.tags.filter((item) => item !== tag) : [...openAsset.tags, tag],
                        })}
                        size="sm"
                        variant={active ? "secondary" : "outline"}
                      >
                        <Tag />{tag}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <dl className="grid gap-3 border-t pt-5 text-xs">
                <div className="flex justify-between"><dt className="text-muted-foreground">Тип</dt><dd>{openAsset.kind}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Размер</dt><dd>{openAsset.size}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspacePageLayout
        actions={
          <>
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              <Button aria-label="Сетка" aria-pressed={view === "grid"} onClick={() => setView("grid")} size="icon-sm" variant={view === "grid" ? "secondary" : "ghost"}><Grid2X2 /></Button>
              <Button aria-label="Список" aria-pressed={view === "list"} onClick={() => setView("list")} size="icon-sm" variant={view === "list" ? "secondary" : "ghost"}><List /></Button>
            </div>
            <Button onClick={() => setIsCollectionOpen(true)} variant="outline"><Plus />Коллекция</Button>
            <Button onClick={() => fileInputRef.current?.click()}><Upload />Импортировать</Button>
            <input className="hidden" multiple onChange={handleImport} ref={fileInputRef} type="file" />
          </>
        }
        description="Визуальная библиотека материалов и документов."
        title="Файлы"
      >
        {assets.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-xl border border-dashed text-center">
            <div><File className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Файлов пока нет</p></div>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {assets.map((asset) => <AssetCard asset={asset} key={asset.id} onOpen={() => setOpenAssetId(asset.id)} />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            {assets.map((asset) => (
              <button className="flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/40" key={asset.id} onClick={() => setOpenAssetId(asset.id)} type="button">
                <AssetIcon asset={asset} className="size-4" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{asset.name}</span>
                <span className="text-xs text-muted-foreground">{asset.collection}</span>
                <span className="w-20 text-right text-xs text-muted-foreground">{asset.size}</span>
              </button>
            ))}
          </div>
        )}
      </WorkspacePageLayout>

      <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
        <DialogContent>
          <form onSubmit={handleCreateCollection}>
            <DialogHeader><DialogTitle>Новая коллекция</DialogTitle><DialogDescription>Коллекции помогают группировать файлы внутри пространства.</DialogDescription></DialogHeader>
            <div className="grid gap-2 py-5"><Label htmlFor="collection-name">Название</Label><Input id="collection-name" onChange={(event) => setCollectionName(event.target.value)} placeholder="Например, Исследование" value={collectionName} /></div>
            <DialogFooter><Button onClick={() => setIsCollectionOpen(false)} type="button" variant="outline">Отмена</Button><Button disabled={!collectionName.trim()} type="submit">Создать</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssetCard({ asset, onOpen }: { asset: ReturnType<typeof useAppStore.getState>["assets"][number]; onOpen: () => void }) {
  return (
    <button className="group overflow-hidden rounded-xl border bg-card text-left transition-colors hover:bg-muted/30" onClick={onOpen} type="button">
      <div className={cn("grid aspect-[4/3] place-items-center border-b bg-muted/30", asset.isImage && "bg-violet-500/10")}>
        {asset.previewUrl ? <img alt="" className="h-full w-full object-cover" src={asset.previewUrl} /> : <AssetIcon asset={asset} className="size-10 text-muted-foreground" />}
      </div>
      <div className="p-3"><h2 className="truncate text-sm font-medium">{asset.name}</h2><p className="mt-1 text-xs text-muted-foreground">{asset.kind} · {asset.size}</p></div>
    </button>
  );
}

function AssetIcon({ asset, className }: { asset: ReturnType<typeof useAppStore.getState>["assets"][number]; className?: string }) {
  if (asset.isImage) return <Image className={className} />;
  if (asset.kind === "PDF") return <FileText className={className} />;
  return <File className={className} />;
}
