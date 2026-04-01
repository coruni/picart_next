import { ShieldX } from "lucide-react";
import { getTranslations } from "next-intl/server";

type PrivacyBlockedPlaceholderProps = {
  title?: string;
  description?: string;
  className?: string;
};

export async function PrivacyBlockedPlaceholder({
  title,
  description,
  className = "",
}: PrivacyBlockedPlaceholderProps) {
  const t = await getTranslations("privacyBlocked");

  return (
    <div
      className={`flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldX className="size-7" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {title ?? t("title")}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
        {description ?? t("description")}
      </p>
    </div>
  );
}
