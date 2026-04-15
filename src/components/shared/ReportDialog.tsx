"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export type ReportReasonOption = {
  id: string;
  label: string;
  reason: string;
  category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
};

export function createDefaultReportReasons(
  t: (key: string) => string,
): ReportReasonOption[] {
  return [
    {
      id: "spam-site",
      label: t("reportOptions.spamSite"),
      reason: t("reportOptions.spamSite"),
      category: "SPAM",
    },
    {
      id: "account-trading",
      label: t("reportOptions.accountTrading"),
      reason: t("reportOptions.accountTrading"),
      category: "OTHER",
    },
    {
      id: "privacy-leak",
      label: t("reportOptions.privacyLeak"),
      reason: t("reportOptions.privacyLeak"),
      category: "INAPPROPRIATE",
    },
    {
      id: "sensitive-content",
      label: t("reportOptions.sensitiveContent"),
      reason: t("reportOptions.sensitiveContent"),
      category: "INAPPROPRIATE",
    },
    {
      id: "abuse-threat",
      label: t("reportOptions.abuseThreat"),
      reason: t("reportOptions.abuseThreat"),
      category: "ABUSE",
    },
    {
      id: "copyright",
      label: t("reportOptions.copyright"),
      reason: t("reportOptions.copyright"),
      category: "COPYRIGHT",
    },
    {
      id: "impersonation",
      label: t("reportOptions.impersonation"),
      reason: t("reportOptions.impersonation"),
      category: "OTHER",
    },
    {
      id: "community-violation",
      label: t("reportOptions.communityViolation"),
      reason: t("reportOptions.communityViolation"),
      category: "OTHER",
    },
    {
      id: "minor-safety",
      label: t("reportOptions.minorSafety"),
      reason: t("reportOptions.minorSafety"),
      category: "INAPPROPRIATE",
    },
    {
      id: "other",
      label: t("reportOptions.other"),
      reason: "",
      category: "OTHER",
    },
  ];
}

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: ReportReasonOption[];
  loading?: boolean;
  onSubmit: (payload: { category: ReportReasonOption["category"]; reason: string }) => Promise<void> | void;
};

export function ReportDialog({
  open,
  onOpenChange,
  reasons,
  loading = false,
  onSubmit,
}: ReportDialogProps) {
  const t = useTranslations("articleMenu");
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReasonId("");
      setCustomReason("");
    }
  }, [open]);

  const selectedReason = reasons.find((item) => item.id === selectedReasonId);
  const finalReason =
    selectedReasonId === "other" ? customReason.trim() : selectedReason?.reason ?? "";
  const canSubmit = Boolean(selectedReason && finalReason);

  const handleSubmit = async () => {
    if (!selectedReason || !finalReason) {
      return;
    }

    await onSubmit({
      category: selectedReason.category,
      reason: finalReason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-border bg-card p-5">
        <DialogHeader className="mb-0 flex-1 space-y-0 p-0! text-center sm:text-center">
          <DialogTitle className="text-lg font-semibold">
            {t("reportDialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="-mx-2 mt-4 max-h-[55vh] overflow-y-auto">
          {reasons.map((reason) => {
            const checked = selectedReasonId === reason.id;

            return (
              <div key={reason.id}>
                <button
                  type="button"
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition-[opacity,transform] hover:bg-primary/10 focus:outline-0"
                  onClick={() => setSelectedReasonId(reason.id)}
                >
                  <span className="text-sm text-foreground">{reason.label}</span>
                  <div
                    className={cn(
                      "relative flex size-4 shrink-0 items-center justify-center rounded-full border-2 box-border border-gray-400 transition-colors dark:border-gray-600",
                      "group-hover:border-primary",
                      checked && "border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full bg-primary opacity-0 transition-opacity",
                        checked && "opacity-100",
                      )}
                    />
                  </div>
                </button>

                {reason.id === "other" && checked && (
                  <div className="px-2 pb-2">
                    <textarea
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value)}
                      placeholder={t("reportDialog.otherPlaceholder")}
                      className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      maxLength={300}
                    />
                    <div className="mt-1 text-right text-xs text-secondary">
                      {customReason.length}/300
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            className="h-10 w-full rounded-full"
            disabled={!canSubmit || loading}
            loading={loading}
            onClick={() => void handleSubmit()}
          >
            {t("reportDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
