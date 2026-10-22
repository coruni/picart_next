import {
  BadgeCheck,
  FileCog,
  FileText,
  FolderTree,
  Images,
  KeyRound,
  LayoutDashboard,
  Medal,
  MessageSquareText,
  ReceiptText,
  Search,
  ShieldCheck,
  ShieldUser,
  Smile,
  Sparkles,
  Tags,
  TriangleAlert,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavKey =
  | "overview"
  | "users"
  | "articles"
  | "comments"
  | "orders"
  | "points"
  | "tags"
  | "categories"
  | "roles"
  | "permissions"
  | "banners"
  | "reports"
  | "certifications"
  | "decorations"
  | "decorationActivities"
  | "emojis"
  | "achievements"
  | "configs"
  | "search";

export type DashboardNavGroupKey = "content" | "userAccess" | "operations" | "system";

export type DashboardNavItem = {
  href: string;
  navKey: DashboardNavKey;
  icon: LucideIcon;
};

export const dashboardNavGroups: Array<{
  labelKey: DashboardNavGroupKey | null;
  items: DashboardNavItem[];
}> = [
  {
    labelKey: null,
    items: [{ href: "/dashboard", navKey: "overview", icon: LayoutDashboard }],
  },
  {
    labelKey: "content",
    items: [
      { href: "/dashboard/articles", navKey: "articles", icon: FileText },
      { href: "/dashboard/comments", navKey: "comments", icon: MessageSquareText },
      { href: "/dashboard/categories", navKey: "categories", icon: FolderTree },
      { href: "/dashboard/tags", navKey: "tags", icon: Tags },
      { href: "/dashboard/emojis", navKey: "emojis", icon: Smile },
    ],
  },
  {
    labelKey: "userAccess",
    items: [
      { href: "/dashboard/users", navKey: "users", icon: ShieldUser },
      { href: "/dashboard/roles", navKey: "roles", icon: BadgeCheck },
      { href: "/dashboard/permissions", navKey: "permissions", icon: KeyRound },
      { href: "/dashboard/certifications", navKey: "certifications", icon: ShieldCheck },
    ],
  },
  {
    labelKey: "operations",
    items: [
      { href: "/dashboard/orders", navKey: "orders", icon: ReceiptText },
      { href: "/dashboard/points", navKey: "points", icon: Medal },
      { href: "/dashboard/banners", navKey: "banners", icon: Images },
      { href: "/dashboard/reports", navKey: "reports", icon: TriangleAlert },
      { href: "/dashboard/decorations", navKey: "decorations", icon: Sparkles },
      {
        href: "/dashboard/decoration-activities",
        navKey: "decorationActivities",
        icon: Zap,
      },
      { href: "/dashboard/achievements", navKey: "achievements", icon: Trophy },
    ],
  },
  {
    labelKey: "system",
    items: [
      { href: "/dashboard/configs", navKey: "configs", icon: FileCog },
      { href: "/dashboard/search", navKey: "search", icon: Search },
    ],
  },
];

export const dashboardNavItems: DashboardNavItem[] = dashboardNavGroups.flatMap(
  (group) => group.items,
);
