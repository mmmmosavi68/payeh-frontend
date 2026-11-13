
"use client";

import {
  ChevronDown,
  ChevronLeft,
  Code2,
  Folder,
  FolderOpen,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuDto } from "../types";

type MenuTreeNode = MenuDto & {
  children: MenuTreeNode[];
};

type MenusTreeProps = {
  menus: MenuDto[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onCreateRoot: () => void;
  onCreateChild: (menu: MenuDto) => void;
  onEdit: (menu: MenuDto) => void;
  onDelete: (menu: MenuDto) => void;
};

function sortMenus(menus: MenuDto[]) {
  return [...menus].sort((a, b) => {
    const aCode = a.pageCode ?? Number.MAX_SAFE_INTEGER;
    const bCode = b.pageCode ?? Number.MAX_SAFE_INTEGER;

    if (aCode !== bCode) return aCode - bCode;

    return a.menuTitle.localeCompare(b.menuTitle, "fa");
  });
}

function hasParentCycle(
  menuId: string,
  menusById: Map<string, MenuDto>,
) {
  const visited = new Set<string>();
  let currentId: string | null = menuId;

  while (currentId) {
    if (visited.has(currentId)) return true;

    visited.add(currentId);

    const current = menusById.get(currentId);
    currentId = current?.parentId ?? null;
  }

  return false;
}

function buildMenuTree(menus: MenuDto[]): MenuTreeNode[] {
  const menusById = new Map(menus.map((menu) => [menu.id, menu]));

  const nodes = new Map<string, MenuTreeNode>(
    menus.map((menu) => [
      menu.id,
      { ...menu, children: [] },
    ]),
  );

  const roots: MenuTreeNode[] = [];

  for (const menu of menus) {
    const node = nodes.get(menu.id)!;
    const parentId = menu.parentId;

    if (
      !parentId ||
      parentId === menu.id ||
      !menusById.has(parentId) ||
      hasParentCycle(menu.id, menusById)
    ) {
      roots.push(node);
      continue;
    }

    nodes.get(parentId)!.children.push(node);
  }

  function sortNodes(items: MenuTreeNode[]) {
    items.sort((a, b) => {
      const aCode = a.pageCode ?? Number.MAX_SAFE_INTEGER;
      const bCode = b.pageCode ?? Number.MAX_SAFE_INTEGER;

      if (aCode !== bCode) return aCode - bCode;

      return a.menuTitle.localeCompare(b.menuTitle, "fa");
    });

    items.forEach((item) => sortNodes(item.children));
  }

  sortNodes(roots);

  return roots;
}

function filterMenuTree(
  nodes: MenuTreeNode[],
  search: string,
): MenuTreeNode[] {
  if (!search) return nodes;

  const query = search.trim().toLocaleLowerCase("fa");

  function filterNode(node: MenuTreeNode): MenuTreeNode | null {
    const children = node.children
      .map(filterNode)
      .filter((item): item is MenuTreeNode => item !== null);

    const matches =
      node.menuTitle.toLocaleLowerCase("fa").includes(query) ||
      (node.controllerName ?? "").toLocaleLowerCase("fa").includes(query) ||
      (node.actionName ?? "").toLocaleLowerCase("fa").includes(query);

    if (!matches && children.length === 0) return null;

    return {
      ...node,
      children,
    };
  }

  return nodes
    .map(filterNode)
    .filter((item): item is MenuTreeNode => item !== null);
}

type MenuNodeProps = {
  node: MenuTreeNode;
  depth: number;
  expandedIds: Set<string>;
  searching: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onToggle: (id: string) => void;
  onCreateChild: (menu: MenuDto) => void;
  onEdit: (menu: MenuDto) => void;
  onDelete: (menu: MenuDto) => void;
};

function MenuNode({
  node,
  depth,
  expandedIds,
  searching,
  canCreate,
  canUpdate,
  canDelete,
  onToggle,
  onCreateChild,
  onEdit,
  onDelete,
}: MenuNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = searching || expandedIds.has(node.id);
  const isAction = Boolean(node.controllerName || node.actionName);

  const Icon = isAction
    ? Code2
    : isExpanded
      ? FolderOpen
      : Folder;

  return (
    <div>
      <div
        className={cn(
          "group flex min-h-12 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/70",
          !node.isActive && "opacity-60",
        )}
        style={{ paddingInlineStart: `${depth * 24 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={isExpanded ? "بستن زیرمنوها" : "باز کردن زیرمنوها"}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors",
            hasChildren
              ? "hover:bg-muted-foreground/10"
              : "cursor-default opacity-30",
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )
          ) : (
            <span className="size-1.5 rounded-full bg-border" />
          )}
        </button>

        <Icon
          className={cn(
            "size-4 shrink-0",
            isAction ? "text-blue-500" : "text-amber-500",
          )}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">
              {node.menuTitle}
            </span>

            {isAction && (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                Action
              </span>
            )}

            {!node.showMenu && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                مخفی
              </span>
            )}

            {!node.isActive && (
              <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                غیرفعال
              </span>
            )}
          </div>

          {(node.controllerName || node.actionName) && (
            <p
              dir="ltr"
              className="mt-0.5 truncate text-xs text-muted-foreground"
            >
              {[node.controllerName, node.actionName]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          {canCreate && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8"
              title="افزودن زیرمنو"
              aria-label={`افزودن زیرمنو برای ${node.menuTitle}`}
              onClick={() => onCreateChild(node)}
            >
              <Plus className="size-4" />
            </Button>
          )}

          {canUpdate && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8"
              title="ویرایش"
              aria-label={`ویرایش ${node.menuTitle}`}
              onClick={() => onEdit(node)}
            >
              <Pencil className="size-4" />
            </Button>
          )}

          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 text-destructive hover:text-destructive"
              title="حذف"
              aria-label={`حذف ${node.menuTitle}`}
              onClick={() => onDelete(node)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-s border-border/70 ms-[22px]">
          {node.children.map((child) => (
            <MenuNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              searching={searching}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onToggle={onToggle}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MenusTree({
  menus,
  canCreate,
  canUpdate,
  canDelete,
  onCreateRoot,
  onCreateChild,
  onEdit,
  onDelete,
}: MenusTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildMenuTree(menus), [menus]);

  const filteredTree = useMemo(
    () => filterMenuTree(tree, search),
    [tree, search],
  );

  useEffect(() => {
    setExpandedIds(new Set(menus.map((menu) => menu.id)));
  }, [menus]);

  function toggleNode(id: string) {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در عنوان، کنترلر یا اکشن منو..."
            aria-label="جست‌وجو در منوها"
            maxLength={100}
            className="h-9 ps-9"
          />
        </div>

        {canCreate && (
          <Button
            type="button"
            className="rounded-full"
            onClick={onCreateRoot}
          >
            <Plus className="size-4" aria-hidden />
            افزودن منوی اصلی
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <MenuIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">ساختار منوها</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {menus.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={expandAll}
              disabled={menus.length === 0}
            >
              باز کردن همه
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              disabled={menus.length === 0}
            >
              بستن همه
            </Button>
          </div>
        </div>

        {filteredTree.length > 0 ? (
          <div className="p-3">
            {filteredTree.map((node) => (
              <MenuNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                searching={search.trim().length > 0}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onToggle={toggleNode}
                onCreateChild={onCreateChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <Folder className="size-9 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              {search ? "موردی با این عبارت پیدا نشد." : "هنوز منویی ثبت نشده است."}
            </p>
            <p className="text-xs text-muted-foreground">
              {search
                ? "عبارت جست‌وجو را تغییر دهید."
                : "برای شروع، یک منوی اصلی ایجاد کنید."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
