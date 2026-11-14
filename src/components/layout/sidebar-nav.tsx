
"use client";

import {
  Activity,
  ChevronDown,
  Clock,
  Command,
  Eye,
  FileSearch,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  List,
  Network,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/features/permissions/permission-provider";
import type { MenuPermission } from "@/features/permissions/api";

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  badges?: Record<string, number>;
};

type MenuNode = MenuPermission & {
  children: MenuNode[];
};

type FallbackMenu = {
  id: string;
  link: string;
  menuTitle: string;
  enTitle: string;
  icon: string;
};

const FAVORITES_STORAGE_KEY = "payeh-sidebar-favorites";
const RECENT_STORAGE_KEY = "payeh-sidebar-recent";

const MAX_FAVORITES = 2;
const MAX_RECENT_ITEMS = 5;
const VISIBLE_RECENT_ITEMS = 3;

const fallbackMenus: FallbackMenu[] = [
  {
    id: "fb-users",
    link: "/users",
    menuTitle: "مدیریت کاربران",
    enTitle: "Users",
    icon: "users",
  },
  {
    id: "fb-sessions",
    link: "/sessions",
    menuTitle: "نشست‌های فعال",
    enTitle: "Active Sessions",
    icon: "history",
  },
  {
    id: "fb-audit",
    link: "/audit-logs",
    menuTitle: "سوابق ممیزی",
    enTitle: "Audit Logs",
    icon: "file-search",
  },
  {
    id: "fb-api-test",
    link: "/api-test",
    menuTitle: "آزمایش API",
    enTitle: "API Test",
    icon: "flask-conical",
  },
];

function normalizePath(path: string | null | undefined): string {
  if (!path) return "";

  const cleanPath = path.split("?")[0].split("#")[0];

  if (cleanPath === "/") return "/";

  return cleanPath.replace(/\/+$/, "");
}

function isActivePath(
  pathname: string,
  href: string | null,
): boolean {
  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return false;
  }

  const current = normalizePath(pathname);
  const target = normalizePath(href);

  return current === target || current.startsWith(`${target}/`);
}

const iconMap: Record<string, LucideIcon> = {
  gauge: Gauge,
  users: Users,
  list: List,
  eye: Eye,
  plus: Plus,
  pencil: Pencil,
  "trash-2": Trash2,
  history: History,
  search: Search,
  "file-spreadsheet": FileSpreadsheet,
  "file-search": FileSearch,
  "flask-conical": FlaskConical,
  network: Network,
};

function iconFor(icon?: string | null): LucideIcon {
  if (!icon) return LayoutDashboard;

  return iconMap[icon.trim().toLowerCase()] ?? LayoutDashboard;
}

function buildMenuTree(items: MenuPermission[]): MenuNode[] {
  const nodes = new Map<string, MenuNode>();

  for (const item of items) {
    if (!item.showMenu) continue;

    nodes.set(item.id, {
      ...item,
      children: [],
    });
  }

  const roots: MenuNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId
      ? nodes.get(node.parentId)
      : undefined;

    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const visited = new Set<string>();

  function sortAndValidate(itemsToSort: MenuNode[]) {
    itemsToSort.sort(
      (a, b) =>
        (a.pageCode ?? Number.MAX_SAFE_INTEGER) -
        (b.pageCode ?? Number.MAX_SAFE_INTEGER),
    );

    for (const node of itemsToSort) {
      if (visited.has(node.id)) {
        node.children = [];
        continue;
      }

      visited.add(node.id);
      sortAndValidate(node.children);
    }
  }

  sortAndValidate(roots);

  for (const node of nodes.values()) {
    if (!visited.has(node.id)) {
      roots.push(node);
      sortAndValidate([node]);
    }
  }

  return roots;
}

function removeMenuRoot(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => {
    if (
      node.menuTitle.trim() === "منوها" &&
      node.parentId === null
    ) {
      return node.children;
    }

    return [node];
  });
}

function filterMenuTree(
  nodes: MenuNode[],
  query: string,
  locale: string,
): MenuNode[] {
  if (!query.trim()) return nodes;

  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase(locale);

  return nodes.reduce<MenuNode[]>((result, node) => {
    const label = node.menuTitle.toLocaleLowerCase(locale);

    const filteredChildren = filterMenuTree(
      node.children,
      query,
      locale,
    );

    if (
      label.includes(normalizedQuery) ||
      filteredChildren.length > 0
    ) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }

    return result;
  }, []);
}

function hasActiveChild(
  node: MenuNode,
  pathname: string,
): boolean {
  return node.children.some(
    (child) =>
      isActivePath(pathname, child.link) ||
      hasActiveChild(child, pathname),
  );
}

function flattenNavigableMenus(nodes: MenuNode[]): MenuNode[] {
  const result: MenuNode[] = [];

  function visit(items: MenuNode[]) {
    for (const node of items) {
      const hasValidLink =
        !!node.link &&
        node.link.startsWith("/") &&
        !node.link.startsWith("//");

      if (hasValidLink && node.children.length === 0) {
        result.push(node);
      }

      visit(node.children);
    }
  }

  visit(nodes);

  return result;
}

function readStorageArray(key: string): string[] {
  try {
    const value = localStorage.getItem(key);

    if (!value) return [];

    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string",
    );
  } catch {
    return [];
  }
}

function writeStorageArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // عدم دسترسی به Storage نباید مانع استفاده از سایدبار شود.
  }
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
  badges = {},
}: SidebarNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const { items, loading, failed, reload } =
    usePermissionContext();

  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<
    Record<string, boolean>
  >({});

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  // بارگذاری اطلاعات ذخیره‌شده در مرورگر
  useEffect(() => {
    const favorites = readStorageArray(FAVORITES_STORAGE_KEY);
    const recent = readStorageArray(RECENT_STORAGE_KEY);

    setFavoriteIds(favorites.slice(0, MAX_FAVORITES));
    setRecentIds(recent.slice(0, MAX_RECENT_ITEMS));
    setStorageReady(true);
  }, []);

  // ذخیره علاقه‌مندی‌ها
  useEffect(() => {
    if (!storageReady) return;

    writeStorageArray(
      FAVORITES_STORAGE_KEY,
      favoriteIds.slice(0, MAX_FAVORITES),
    );
  }, [favoriteIds, storageReady]);

  // ذخیره تاریخچه
  useEffect(() => {
    if (!storageReady) return;

    writeStorageArray(
      RECENT_STORAGE_KEY,
      recentIds.slice(0, MAX_RECENT_ITEMS),
    );
  }, [recentIds, storageReady]);

  const menuTree = useMemo(() => {
    if (failed) {
      return fallbackMenus.map<MenuNode>((item) => ({
        id: item.id,
        parentId: null,
        menuTitle:
          locale === "fa" ? item.menuTitle : item.enTitle,
        pageCode: null,
        version: null,
        controllerName: null,
        actionName: null,
        showMenu: true,
        icon: item.icon,
        link: item.link,
        children: [],
      }));
    }

    return removeMenuRoot(buildMenuTree(items));
  }, [items, failed, locale]);

  const navigableMenus = useMemo(
    () => flattenNavigableMenus(menuTree),
    [menuTree],
  );

  const filteredMenus = useMemo(
    () => filterMenuTree(menuTree, search, locale),
    [menuTree, search, locale],
  );

  const favoriteMenus = useMemo(
    () =>
      favoriteIds
        .map((id) => navigableMenus.find((node) => node.id === id))
        .filter((node): node is MenuNode => !!node),
    [favoriteIds, navigableMenus],
  );

  const recentMenus = useMemo(
    () =>
      recentIds
        .map((id) => navigableMenus.find((node) => node.id === id))
        .filter((node): node is MenuNode => !!node)
        .slice(0, VISIBLE_RECENT_ITEMS),
    [recentIds, navigableMenus],
  );

  const quickSearchResults = useMemo(() => {
    const query = quickSearch.trim().toLocaleLowerCase(locale);

    if (!query) return navigableMenus.slice(0, 8);

    return navigableMenus
      .filter((node) =>
        node.menuTitle.toLocaleLowerCase(locale).includes(query),
      )
      .slice(0, 10);
  }, [navigableMenus, quickSearch, locale]);

  // ثبت صفحه فعال در تاریخچه
  useEffect(() => {
    if (!storageReady || !pathname) return;

    const matched = [...navigableMenus]
      .sort(
        (a, b) =>
          normalizePath(b.link).length -
          normalizePath(a.link).length,
      )
      .find((node) => isActivePath(pathname, node.link));

    if (!matched) return;

    setRecentIds((current) => [
      matched.id,
      ...current.filter((id) => id !== matched.id),
    ].slice(0, MAX_RECENT_ITEMS));
  }, [pathname, navigableMenus, storageReady]);

  // میانبر جستجوی سریع
  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setQuickSearchOpen((current) => !current);
        setQuickSearch("");
      }

      if (event.key === "Escape") {
        setQuickSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  function toggleExpanded(id: string) {
    setExpandedItems((current) => ({
      ...current,
      [id]: !(current[id] ?? false),
    }));
  }

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= MAX_FAVORITES) {
        return current;
      }

      return [...current, id];
    });
  }

  function handleNavigate() {
    setQuickSearchOpen(false);
    setQuickSearch("");
    onNavigate?.();
  }

  function renderBadge(id: string): ReactNode {
    const count = badges[id];

    if (!count || count <= 0) return null;

    return (
      <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
        {count > 99 ? "99+" : count}
      </span>
    );
  }

function renderSectionTitle(
  icon: ReactNode,
  title: string,
  count?: ReactNode,
) {
  return (
    <div className="flex h-8 items-center gap-2 px-2">
      {icon}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[10px] tabular-nums opacity-70">
          {count}
        </span>
      )}
    </div>
  );
}

  function renderShortcutLink(node: MenuNode): ReactNode {
    const Icon = iconFor(node.icon);

    return (
      <Link
        key={node.id}
        href={node.link!}
        onClick={handleNavigate}
        className={cn(
          "flex min-h-9 min-w-0 items-center gap-3 rounded-lg px-[11px] text-sm transition-colors",
          "text-muted-foreground hover:bg-blue-500/10 hover:text-foreground",
          isActivePath(pathname, node.link) &&
            "bg-accent/70 font-medium text-foreground",
        )}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />

        <span className="min-w-0 flex-1 truncate text-start">
          {node.menuTitle}
        </span>

        {renderBadge(node.id)}
      </Link>
    );
  }

  function renderNodes(
    nodes: MenuNode[],
    depth = 0,
  ): ReactNode {
    return nodes.map((node, index) => {
      const Icon = iconFor(node.icon);

      const hasChildren = node.children.length > 0;
      const active = isActivePath(pathname, node.link);
      const childActive = hasActiveChild(node, pathname);

      const expanded =
        search.trim().length > 0 ||
        (expandedItems[node.id] ?? childActive);

      const label = node.menuTitle;
      const selected = active || childActive;

      const hasValidLink =
        !!node.link &&
        node.link.startsWith("/") &&
        !node.link.startsWith("//");

      const canFavorite = !hasChildren && hasValidLink;
      const isFavorite = favoriteIds.includes(node.id);
      const favoriteLimitReached =
        favoriteIds.length >= MAX_FAVORITES && !isFavorite;

      const iconClass = cn(
        "size-[18px] shrink-0 transition-colors duration-150",
        selected
          ? "text-foreground"
          : "text-muted-foreground/80",
      );

      const rowClass = cn(
        "flex min-h-10 w-full min-w-0 items-center gap-3 rounded-lg border text-sm",
        "transition-all duration-150 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "hover:bg-accent/70 hover:text-foreground",
        selected
          ? hasChildren
            ? "border-transparent bg-accent/60 font-medium text-foreground"
            : "border-border/70 bg-accent font-medium text-foreground shadow-sm"
          : "border-transparent text-muted-foreground",
      );

      return (
        <div
          key={node.id}
          className={cn(
            "w-full min-w-0",
            depth === 0 &&
              index < nodes.length - 1 &&
              "border-b border-border/50 pb-2",
          )}
        >
          <div className="flex w-full min-w-0 items-center gap-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.id)}
                title={collapsed ? label : undefined}
                aria-label={label}
                aria-expanded={expanded}
                className={cn(
                  rowClass,
                  "min-w-0 flex-1 px-[11px]",
                )}
              >
                <Icon className={iconClass} aria-hidden />

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-start",
                    collapsed && "sr-only",
                  )}
                >
                  {label}
                </span>

                {renderBadge(node.id)}

                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 ms-1 transition-transform duration-200 ease-in-out",
                      expanded
                        ? "rotate-0"
                        : "rtl:rotate-90 ltr:-rotate-90",
                    )}
                  />
                )}
              </button>
            ) : hasValidLink ? (
              <Link
                href={node.link!}
                onClick={handleNavigate}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  rowClass,
                  "min-w-0 flex-1 px-[11px]",
                )}
              >
                <Icon className={iconClass} aria-hidden />

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-start",
                    collapsed && "sr-only",
                  )}
                >
                  {label}
                </span>

                {renderBadge(node.id)}
              </Link>
            ) : (
              <div
                className={cn(
                  rowClass,
                  "min-w-0 flex-1 px-[11px] opacity-60",
                )}
              >
                <Icon className={iconClass} aria-hidden />

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-start",
                    collapsed && "sr-only",
                  )}
                >
                  {label}
                </span>

                {renderBadge(node.id)}
              </div>
            )}

            {canFavorite && (
              <button
                type="button"
                disabled={favoriteLimitReached}
                onClick={() => toggleFavorite(node.id)}
                title={
                  favoriteLimitReached
                    ? locale === "fa"
                      ? "حداکثر ۸ علاقه‌مندی مجاز است"
                      : "Maximum 8 favorites allowed"
                    : isFavorite
                      ? locale === "fa"
                        ? "حذف از علاقه‌مندی‌ها"
                        : "Remove from favorites"
                      : locale === "fa"
                        ? "افزودن به علاقه‌مندی‌ها"
                        : "Add to favorites"
                }
                aria-label={
                  isFavorite
                    ? locale === "fa"
                      ? `حذف ${label} از علاقه‌مندی‌ها`
                      : `Remove ${label} from favorites`
                    : locale === "fa"
                      ? `افزودن ${label} به علاقه‌مندی‌ها`
                      : `Add ${label} to favorites`
                }
                aria-pressed={isFavorite}
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isFavorite
                    ? "text-amber-500"
                    : "text-muted-foreground/50 hover:text-amber-500",
                  favoriteLimitReached &&
                    "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground/50",
                )}
              >
                <Star
                  className={cn(
                    "size-4",
                    isFavorite && "fill-current",
                  )}
                />
              </button>
            )}
          </div>

          {hasChildren && (
            <div
              aria-hidden={!expanded}
              className={cn(
                "grid min-w-0 transition-[grid-template-rows,opacity,margin] duration-200 ease-in-out",
                expanded
                  ? "grid-rows-[1fr] opacity-100 mt-1"
                  : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none",
              )}
            >
              <div className="min-h-0 min-w-0 overflow-hidden">
                <div
                  className={cn(
                    "min-w-0 space-y-1",
                    !collapsed &&
                      "ms-3 border-s border-border ps-3",
                  )}
                >
                  {renderNodes(node.children, depth + 1)}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className="space-y-3 px-4 py-3" aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 animate-pulse rounded bg-muted" />
        <div className="h-9 animate-pulse rounded bg-muted" />
        <div className="h-9 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <>
      <nav
        aria-label={t("label")}
        className="flex min-w-0 flex-col gap-1 px-2"
      >
        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={handleNavigate}
          className={cn(
            "flex h-10 min-w-0 items-center gap-3 rounded-lg border px-[11px] text-sm transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            pathname === "/dashboard"
              ? "border-border/70 bg-accent font-medium text-foreground shadow-sm"
              : "border-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground",
          )}
          title={collapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard className="size-[18px] shrink-0" />

          <span className={cn("truncate", collapsed && "sr-only")}>
            {locale === "fa" ? "داشبورد" : "Dashboard"}
          </span>
        </Link>

        {/* Search */}
        {!collapsed && (
          <div className="relative my-2 min-w-0">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                locale === "fa"
                  ? "جستجوی منو..."
                  : "Search menus..."
              }
              aria-label={
                locale === "fa"
                  ? "جستجوی منوها"
                  : "Search menus"
              }
              className="h-9 w-full min-w-0 rounded-md border border-input bg-background ps-9 pe-[4.5rem] text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />

            <button
              type="button"
              onClick={() => {
                setQuickSearchOpen(true);
                setQuickSearch("");
              }}
              title="Ctrl + K"
              aria-label={
                locale === "fa"
                  ? "جستجوی سریع"
                  : "Quick search"
              }
              className="absolute end-8 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Command className="size-3.5" />
            </button>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={
                  locale === "fa"
                    ? "پاک کردن جستجو"
                    : "Clear search"
                }
                className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded hover:bg-accent"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Favorites */}
{/* Favorites */}
{!collapsed && favoriteMenus.length > 0 && (
  <section className="mb-2 min-w-0 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-2">
    {renderSectionTitle(
      <Star className="size-3.5 text-amber-500" />,
      locale === "fa" ? "علاقه‌مندی‌ها" : "Favorites",
      `${favoriteMenus.length}/${MAX_FAVORITES}`,
    )}

    <div className="space-y-0.5">
      {favoriteMenus.map(renderShortcutLink)}
    </div>
  </section>
)}

{/* Recent pages */}
{!collapsed && recentMenus.length > 0 && (
<section className="mb-2 min-w-0 rounded-xl border border-blue-300 bg-blue-100/90 p-2 dark:border-blue-500/30 dark:bg-blue-950/60">    {renderSectionTitle(
      <Clock className="size-3.5 text-blue-500 dark:text-blue-300" />,
      locale === "fa" ? "اخیراً بازدیدشده" : "Recently visited",
      recentMenus.length,
    )}

    <div className="space-y-0.5">
      {recentMenus.map(renderShortcutLink)}
    </div>
  </section>
)}

        {/* Main menu separator */}
        {(favoriteMenus.length > 0 || recentMenus.length > 0) &&
          !collapsed && (
            <div className="my-2 border-t border-border/60" />
          )}

        {/* Dynamic menu tree */}
        <div className="min-w-0 space-y-2">
          {renderNodes(filteredMenus)}
        </div>

        {/* Empty search result */}
        {search && filteredMenus.length === 0 && (
          <p className="px-3 py-5 text-center text-xs text-muted-foreground">
            {locale === "fa"
              ? "منویی با این عنوان پیدا نشد."
              : "No matching menu found."}
          </p>
        )}

        {/* Permission loading error */}
        {failed && !collapsed && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
            <p>
              {locale === "fa"
                ? "دریافت منوها از سرور ناموفق بود."
                : "Failed to load menus from server."}
            </p>

            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 font-medium text-primary underline"
              onClick={reload}
            >
              <Activity className="size-3" />
              {t("retry")}
            </button>
          </div>
        )}
      </nav>

      {/* Quick Search Dialog */}
      {quickSearchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setQuickSearchOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              locale === "fa"
                ? "جستجوی سریع صفحات"
                : "Quick page search"
            }
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" />

              <input
                autoFocus
                type="search"
                value={quickSearch}
                onChange={(event) =>
                  setQuickSearch(event.target.value)
                }
                placeholder={
                  locale === "fa"
                    ? "نام صفحه موردنظر را جستجو کنید..."
                    : "Search for a page..."
                }
                className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />

              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                aria-label={
                  locale === "fa" ? "بستن" : "Close"
                }
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[min(55vh,420px)] overflow-y-auto p-2">
              {quickSearchResults.length > 0 ? (
                <div className="space-y-1">
                  {quickSearchResults.map((node) => {
                    const Icon = iconFor(node.icon);

                    return (
                      <Link
                        key={node.id}
                        href={node.link!}
                        onClick={handleNavigate}
                        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        <Icon className="size-[18px] shrink-0 text-muted-foreground" />

                        <span className="min-w-0 flex-1 truncate">
                          {node.menuTitle}
                        </span>

                        {renderBadge(node.id)}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {locale === "fa"
                    ? "صفحه‌ای با این عنوان پیدا نشد."
                    : "No matching page found."}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
              <span>
                {locale === "fa"
                  ? "برای جستجو نام صفحه را وارد کنید"
                  : "Type to search pages"}
              </span>

              <span className="rounded border border-border px-1.5 py-0.5">
                ESC
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
