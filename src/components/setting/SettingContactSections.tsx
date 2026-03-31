"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/useUserStore";
import { ContactSettingForm } from "./ContactSettingForm";

type ContactField = "email" | "address";

export function SettingContactSections() {
  const t = useTranslations("setting.contact");
  const user = useUserStore((state) => state.user);
  const [expandedField, setExpandedField] = useState<ContactField | null>(
    "email",
  );

  const toggleField = (field: ContactField) => {
    setExpandedField((current) => (current === field ? null : field));
  };

  const sections: Array<{ field: ContactField; type?: "email" | "text" }> = [
    { field: "email", type: "email" },
    { field: "address" },
  ];

  return (
    <section className="mt-6 divide-y divide-border">
      {sections.map(({ field, type }) => {
        const isExpanded = expandedField === field;
        const initialValue =
          field === "email" ? user?.email || "" : user?.address || "";

        return (
          <div key={field} className="py-1">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => toggleField(field)}
              className="flex h-auto w-full items-center justify-between px-0 py-4 text-left hover:bg-transparent!"
            >
              <span className="text-base font-semibold text-foreground">
                {t(`${field}.title`)}
              </span>
              {isExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </Button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                {isExpanded ? (
                  <ContactSettingForm
                    field={field}
                    type={type}
                    userId={user?.id != null ? String(user.id) : null}
                    initialValue={initialValue}
                  />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
