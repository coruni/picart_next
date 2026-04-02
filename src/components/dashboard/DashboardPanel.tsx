import { cn } from "@/lib";

type DashboardPanelProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  headerExtra?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function DashboardPanel({
  title,
  description,
  action,
  headerExtra,
  className,
  headerClassName,
  contentClassName,
  children,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card",
        className,
      )}
    >
      {headerExtra ? (
        <div
          className={cn(
            "border-b border-border/70 bg-card",
            headerClassName,
          )}
        >
          {headerExtra}
        </div>
      ) : (
        <div
          className={cn(
            "border-b border-border/70 bg-card",
            headerClassName,
          )}
        >
          <div className="flex flex-col gap-2.5 px-3 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.01em] text-foreground md:text-base">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        </div>
      )}
      <div className={cn("px-3 py-3", contentClassName)}>{children}</div>
    </section>
  );
}
