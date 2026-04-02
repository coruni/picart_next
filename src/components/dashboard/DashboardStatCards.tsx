import { cn } from "@/lib";
import type { LucideIcon } from "lucide-react";
import { formatDashboardCount } from "./utils";

type DashboardStatCardsProps = {
  items: Array<{
    key: string;
    label: string;
    value: number;
    description?: string;
    icon: LucideIcon;
    accent: string;
  }>;
};

export function DashboardStatCards({
  items,
  locale,
}: DashboardStatCardsProps & { locale?: string }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.key}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b",
                item.accent,
              )}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {formatDashboardCount(item.value, locale)}
                </p>
                {item.description ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80">
                <Icon className="size-5 text-foreground" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
