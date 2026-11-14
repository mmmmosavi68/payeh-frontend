
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Code2,
  Folder,
  FolderOpen,
  Loader2,
  Menu as MenuIcon,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { GroupDto, GroupMenuDto } from "../types";

import {
  getGroupMenuAccess,
  listAvailableGroupMenus,
  updateGroupMenuAccess,
} from "../api";

type GroupMenuAccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupDto | null;
};

type MenuNode = GroupMenuDto & {
  children: MenuNode[];
};

function sortMenus(menus: MenuNode[]) {
  menus.sort((a, b) => {
    const aCode = a.pageCode ?? Number.MAX_SAFE_INTEGER;
    const bCode = b.pageCode ?? Number.MAX_SAFE_INTEGER;

    if (aCode !== bCode) return aCode - bCode;

    return a.menuTitle.localeCompare(b.menuTitle, "fa");
  });

  menus.forEach((menu) => sortMenus(menu.children));

  return menus;
}

function buildMenuTree(menus: GroupMenuDto[]): MenuNode[] {
  const nodes = new Map<string, MenuNode>(
    menus.map((menu) => [
      menu.id,
      { ...menu, children: [] },
    ]),
  );

  const roots: MenuNode[] = [];

  for (const menu of menus) {
    const node = nodes.get(menu.id)!;
    const parent = menu.parentId
      ? nodes.get(menu.parentId)
      : undefined;

    if (!parent || parent.id === menu.id) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }

  return sortMenus(roots);
}

function collectDescendants(node: MenuNode): string[] {
  return [
    node.id,
    ...node.children.flatMap(collectDescendants),
  ];
}

function getAllDescendants(node: MenuNode): string[] {
  return node.children.flatMap(collectDescendants);
}

function filterMenuTree(
  nodes: MenuNode[],
  search: string,
): MenuNode[] {
  if (!search.trim()) return nodes;

  const query = search.trim().toLocaleLowerCase("fa");

  function filterNode(node: MenuNode): MenuNode | null {
    const children = node.children
      .map(filterNode)
      .filter((item): item is MenuNode => item !== null);

    const matches =
      node.menuTitle.toLocaleLowerCase("fa").includes(query) ||
      (node.path ?? "").toLocaleLowerCase("fa").includes(query);

    if (!matches && children.length === 0) return null;

    return { ...node, children };
  }

  return nodes
    .map(filterNode)
    .filter((item): item is MenuNode => item !== null);
}

function formatCount(selected: number, total: number) {
  return `${selected}/${total}`;
}

type MenuAccessNodeProps = {
  node: MenuNode;
  depth: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  searching: boolean;
  onToggle: (node: MenuNode) => void;
  onExpand: (id: string) => void;
};

function MenuAccessNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  searching,
  onToggle,
  onExpand,
}: MenuAccessNodeProps) {
  const hasChildren = node.children.length > 0;
  const expanded = searching || expandedIds.has(node.id);

  const descendantIds = getAllDescendants(node);
  const selectedDescendants = descendantIds.filter((id) =>
    selectedIds.has(id),
  );

  const checked = selectedIds.has(node.id);
  const indeterminate =
    !checked && selectedDescendants.length > 0;

  const isAction = Boolean(node.path || node.pageCode);
  const Icon = isAction
    ? Code2
    : expanded
      ? FolderOpen
      : Folder;

  return (
    <div>
      <div
        className="group flex min-h-12 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/70"
        style={{ paddingInlineStart: `${depth * 24 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onExpand(node.id)}
          disabled={!hasChildren}
          aria-label={expanded ? "بستن زیرمنوها" : "باز کردن زیرمنوها"}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted-foreground/10 disabled:cursor-default disabled:opacity-30"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )
          ) : (
            <span className="size-1.5 rounded-full bg-border" />
          )}
        </button>

        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            ref={(element) => {
              if (element) {
                element.indeterminate = indeterminate;
              }
            }}
            onChange={() => onToggle(node)}
            className="size-4 shrink-0 cursor-pointer accent-primary"
            aria-label={`دسترسی به ${node.menuTitle}`}
          />

          <Icon
            className={
              isAction
                ? "size-4 shrink-0 text-blue-500"
                : "size-4 shrink-0 text-amber-500"
            }
            aria-hidden
          />

          <span className="truncate text-sm font-medium">
            {node.menuTitle}
          </span>

          {node.showMenu === false ? (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              مخفی
            </span>
          ) : null}
        </label>

        {hasChildren ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatCount(selectedDescendants.length, descendantIds.length)}
          </span>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <div className="ms-[22px] border-s border-border/70">
          {node.children.map((child) => (
            <MenuAccessNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              searching={searching}
              onToggle={onToggle}
              onExpand={onExpand}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function GroupMenuAccessDialog({
  open,
  onOpenChange,
  group,
}: GroupMenuAccessDialogProps) {
  const [menus, setMenus] = useState<GroupMenuDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(),
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const groupId = group?.id;

  useEffect(() => {
    if (!open || !groupId) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setFailed(false);

      try {
        const [availableMenus, accessIds] = await Promise.all([
          listAvailableGroupMenus(),
          getGroupMenuAccess(groupId!),
        ]);

        if (cancelled) return;

        setMenus(availableMenus);
        setSelectedIds(new Set(accessIds));
        setExpandedIds(
          new Set(availableMenus.map((menu) => menu.id)),
        );
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open, groupId]);

  const tree = useMemo(() => buildMenuTree(menus), [menus]);

  const filteredTree = useMemo(
    () => filterMenuTree(tree, search),
    [tree, search],
  );

  const selectedCount = selectedIds.size;

  function toggleMenu(node: MenuNode) {
    const ids = collectDescendants(node);

    setSelectedIds((current) => {
      const next = new Set(current);
      const shouldSelect = !current.has(node.id);

      for (const id of ids) {
        if (shouldSelect) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }

      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(menus.map((menu) => menu.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  function selectAll() {
    setSelectedIds(new Set(menus.map((menu) => menu.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleSave() {
    if (!groupId) return;

    setSaving(true);

    try {
      await updateGroupMenuAccess(groupId, {
        menuIds: Array.from(selectedIds),
      });

      toast.success("دسترسی منوهای گروه با موفقیت ذخیره شد.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ذخیره دسترسی منوها ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRetry() {
    if (!groupId) return;

    setLoading(true);
    setFailed(false);

    try {
      const [availableMenus, accessIds] = await Promise.all([
        listAvailableGroupMenus(),
        getGroupMenuAccess(groupId),
      ]);

      setMenus(availableMenus);
      setSelectedIds(new Set(accessIds));
      setExpandedIds(
        new Set(availableMenus.map((menu) => menu.id)),
      );
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;

    if (!nextOpen) {
      setSearch("");
      setFailed(false);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MenuIcon className="size-5" aria-hidden />
            مدیریت دسترسی منوها
          </DialogTitle>

          <DialogDescription>
            تعیین منوهای قابل دسترسی برای گروه
            {group ? ` «${group.groupName}»` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجو در عنوان یا مسیر منو..."
              className="h-9 ps-9"
              maxLength={100}
              disabled={loading || failed}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary tabular-nums">
              {selectedCount} منوی انتخاب‌شده
            </span>

            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                disabled={loading || menus.length === 0}
              >
                انتخاب همه
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={loading || selectedCount === 0}
              >
                پاک کردن انتخاب
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                در حال دریافت اطلاعات دسترسی‌ها...
              </div>
            ) : failed ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                <p className="text-sm text-destructive">
                  دریافت اطلاعات منوها ناموفق بود.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleRetry}
                >
                  تلاش مجدد
                </Button>
              </div>
            ) : filteredTree.length > 0 ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                <div className="mb-2 flex justify-end gap-1 border-b pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={expandAll}
                  >
                    باز کردن همه
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={collapseAll}
                  >
                    بستن همه
                  </Button>
                </div>

                {filteredTree.map((node) => (
                  <MenuAccessNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedIds={selectedIds}
                    expandedIds={expandedIds}
                    searching={search.trim().length > 0}
                    onToggle={toggleMenu}
                    onExpand={toggleExpand}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <Folder className="size-9 text-muted-foreground/50" />

                <p className="text-sm font-medium">
                  {search
                    ? "موردی با این عبارت پیدا نشد."
                    : "منویی برای نمایش وجود ندارد."}
                </p>

                {search ? (
                  <p className="text-xs text-muted-foreground">
                    عبارت جست‌وجو را تغییر دهید.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={saving}
              onClick={() => handleOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type="button"
              className="rounded-full"
              onClick={handleSave}
              disabled={loading || failed || saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              ذخیره دسترسی‌ها
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
