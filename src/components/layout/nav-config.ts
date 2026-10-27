import {
  LayoutDashboard,
  MonitorSmartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  key: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    key: "main",
    items: [{ key: "dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    key: "management",
    items: [
      { key: "users", href: "/users", icon: Users },
      { key: "sessions", href: "/sessions", icon: MonitorSmartphone },
    ],
  },
];