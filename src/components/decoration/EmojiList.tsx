"use client";

import { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { decorationControllerGetMyDecorations } from "@/api/sdk.gen";
import type { DecorationControllerGetMyDecorationsResponse } from "@/api/types.gen";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Decoration =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][0];

export function EmojiList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(false);

  const getRarityName = (rarity?: string) => {
    if (rarity === "COMMON") return t("rarity.common");
    if (rarity === "RARE") return t("rarity.rare");
    if (rarity === "EPIC") return t("rarity.epic");
    if (rarity === "LEGENDARY") return t("rarity.legendary");
    return t("rarity.common");
  };

  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: {
            type: "EMOJI",
          },
        });

        if (response.data?.data) {
          setDecorations(response.data.data.data as Decoration[]);
        }
      } catch (error) {
        console.error("Failed to fetch decorations:", error);
        setDecorations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDecorations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-secondary">{tc("loading")}</div>
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-secondary">
        <div className="text-4xl mb-2">-</div>
        <div>{t("emptyByType", { type: t("types.emoji") })}</div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-scroll"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="grid grid-cols-2 gap-4">
        {decorations.map((decoration) => (
          <div
            key={decoration.id}
            className={cn(
              "relative rounded-xl p-4 cursor-pointer transition-all",
              decoration.isUsing
                ? "bg-primary/10"
                : "bg-muted hover:bg-muted/80",
            )}
          >
            {decoration.isUsing && (
              <div className="absolute top-3 left-3 size-6 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="size-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="relative size-20 shrink-0">
                <Image
                  fill
                  src={decoration.decoration.imageUrl}
                  alt={decoration.decoration.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-base mb-1 truncate">
                  {decoration.decoration.name}
                </div>
                <div className="text-xs text-secondary mb-2">
                  {getRarityName(decoration.decoration.rarity)} {t("series")}
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <svg
                    className="size-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {decoration.isPermanent ? (
                    <span>{t("permanent")}</span>
                  ) : decoration.expiresAt ? (
                    <span>
                      {formatDate(decoration.expiresAt, t("locale"))}{" "}
                      {t("expireAt")}
                    </span>
                  ) : (
                    <span>{t("permanent")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
