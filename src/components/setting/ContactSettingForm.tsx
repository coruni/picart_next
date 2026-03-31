"use client";

import { userControllerUpdate } from "@/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";

type ContactSettingFormProps = {
  field: "email" | "address";
  userId?: string | null;
  initialValue?: string | null;
  type?: "email" | "text";
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactSettingForm({
  field,
  userId,
  initialValue,
  type = "text",
}: ContactSettingFormProps) {
  const t = useTranslations("setting.contact");
  const updateUser = useUserStore((state) => state.updateUser);
  const displayValue = (initialValue ?? "").trim();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setValue("");
    setError("");
    setSuccess("");
  }, [field, initialValue]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError(t(`${field}.required`));
      return;
    }

    if (field === "email" && !isValidEmail(trimmedValue)) {
      setError(t("email.invalid"));
      return;
    }

    if (!userId) {
      setError(t("pending"));
      return;
    }

    setSubmitting(true);

    try {
      await userControllerUpdate({
        path: { id: userId },
        body:
          field === "email"
            ? { email: trimmedValue }
            : { address: trimmedValue },
      });

      updateUser(
        field === "email"
          ? { email: trimmedValue }
          : { address: trimmedValue },
      );
      setValue(trimmedValue);
      setSuccess(t(`${field}.success`));
    } catch (submitError) {
      console.error(`Failed to update ${field}:`, submitError);
      setError(t(`${field}.updateError`));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-foreground">
            {t(`${field}.label`)}
          </label>
          {displayValue ? (
            <span className="max-w-[65%] truncate text-sm text-muted-foreground">
              {displayValue}
            </span>
          ) : null}
        </div>
        <Input
          type={type}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t(`${field}.placeholder`)}
          fullWidth
          disabled={!userId || submitting}
          error={!!error}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      {!error && success ? (
        <p className="mt-3 text-sm text-primary">{success}</p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          size="md"
          loading={submitting}
          disabled={!userId}
          className="rounded-full"
        >
          {t(`${field}.submit`)}
        </Button>
      </div>
    </form>
  );
}
