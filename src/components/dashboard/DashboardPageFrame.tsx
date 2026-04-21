import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib";
import { ChevronRight, Home } from "lucide-react";

type DashboardPageFrameProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  showBreadcrumb?: boolean;
  actions?: React.ReactNode;
};

// 面包屑路径映射
const breadcrumbMap: Record<string, string> = {
  dashboard: "概览",
  users: "用户管理",
  articles: "文章管理",
  comments: "评论管理",
  orders: "订单管理",
  configs: "配置管理",
  tags: "标签管理",
  categories: "分类管理",
  roles: "角色管理",
  permissions: "权限管理",
  banners: "轮播管理",
  reports: "举报管理",
  decorations: "装饰品管理",
  emojis: "表情管理",
  achievements: "成就管理",
  points: "积分管理",
  search: "搜索管理",
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const allPaths = pathname.split("/").filter(Boolean);
  const paths = allPaths.filter((p: string, i: number) => p !== "dashboard" || i === 0);

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-primary transition-colors"
      >
        <Home className="size-3.5" />
        <span className="hidden sm:inline">首页</span>
      </Link>
      {paths.slice(1).map((path: string, index: number, arr: string[]) => {
        const isLast = index === arr.length - 1;
        const label = breadcrumbMap[path] || path;
        const href = "/" + paths.slice(0, index + 2).join("/");

        return (
          <div key={path} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-border" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-primary transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardPageFrame({
  children,
  className,
  title,
  description,
  showBreadcrumb = true,
  actions,
}: DashboardPageFrameProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-6",
        className,
      )}
    >
      {(showBreadcrumb || title || description || actions) && (
        <header className="space-y-4">
          {showBreadcrumb && <Breadcrumb pathname={pathname} />}
          {(title || description || actions) && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                {title && (
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
        </header>
      )}
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
    </div>
  );
}
