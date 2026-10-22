import { cn } from "@/lib";

type DashboardPageFrameProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function DashboardPageFrame({
  children,
  className,
  title,
  description,
  actions,
}: DashboardPageFrameProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6",
        className,
      )}
    >
      {(title || description || actions) && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
