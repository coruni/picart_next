import { Button } from "@/components/ui/Button";
import { AlertCircle, LoaderCircle } from "lucide-react";

type DashboardLoadingViewProps = {
  text: string;
};

export function DashboardLoadingView({ text }: DashboardLoadingViewProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
        <LoaderCircle className="size-4 animate-spin" />
        <span>{text}</span>
      </div>
    </div>
  );
}

type DashboardErrorViewProps = {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
};

export function DashboardErrorView({
  title,
  description,
  retryLabel,
  onRetry,
}: DashboardErrorViewProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-error-500/10 text-error-500">
          <AlertCircle className="size-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <Button className="mt-5 h-7 rounded-full px-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      </div>
    </div>
  );
}
