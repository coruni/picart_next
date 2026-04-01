"use client";

import {
  userControllerSendVerificationCode,
  userControllerUpdate,
  userControllerUpdateProfileContact,
} from "@/api";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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

function getApiMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return "";
}

export function ContactSettingForm({
  field,
  userId,
  initialValue,
  type = "text",
}: ContactSettingFormProps) {
  const isEmailField = field === "email";
  const t = useTranslations("setting.contact");
  const updateUser = useUserStore((state) => state.updateUser);
  const displayValue = (initialValue ?? "").trim();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setValue("");
    setError("");
    setSuccess("");
    setVerificationCode("");
    setEmailModalOpen(false);
    setCountdown(0);
  }, [field, initialValue]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    const trimmedValue = value.trim();

    setError("");
    setSuccess("");

    if (!trimmedValue) {
      setError(t("email.required"));
      return;
    }

    if (!isValidEmail(trimmedValue)) {
      setError(t("email.invalid"));
      return;
    }

    setSendingCode(true);

    try {
      await userControllerSendVerificationCode({
        body: {
          email: trimmedValue,
          type: "verification",
        },
      });

      setCountdown(60);
      setSuccess(t("email.codeSent"));
    } catch (sendError) {
      console.error("Failed to send email verification code:", sendError);
      if (
        countdown > 0 &&
        getApiMessage(sendError) === "response.error.tooManyRequests"
      ) {
        setError("");
        setSuccess(t("email.codeSent"));
      } else {
        setError(t("email.codeSendError"));
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError(t(`${field}.required`));
      return;
    }

    if (isEmailField && !isValidEmail(trimmedValue)) {
      setError(t("email.invalid"));
      return;
    }

    if (isEmailField) {
      setSendingCode(true);

      try {
        await userControllerSendVerificationCode({
          body: {
            email: trimmedValue,
            type: "verification",
          },
        });

        setVerificationCode("");
        setCountdown(60);
        setSuccess(t("email.codeSent"));
        setEmailModalOpen(true);
      } catch (sendError) {
        console.error("Failed to send email verification code:", sendError);
        if (
          countdown > 0 &&
          getApiMessage(sendError) === "response.error.tooManyRequests"
        ) {
          setError("");
          setSuccess(t("email.codeSent"));
          setEmailModalOpen(true);
        } else {
          setError(t("email.codeSendError"));
        }
      } finally {
        setSendingCode(false);
      }

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
        body: { address: trimmedValue },
      });

      updateUser({ address: trimmedValue });
      setValue(trimmedValue);
      setSuccess(t(`${field}.success`));
    } catch (submitError) {
      console.error(`Failed to update ${field}:`, submitError);
      setError(t(`${field}.updateError`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailUpdate = async () => {
    const trimmedValue = value.trim();
    const trimmedCode = verificationCode.trim();

    setError("");
    setSuccess("");

    if (!trimmedValue) {
      setError(t("email.required"));
      return;
    }

    if (!isValidEmail(trimmedValue)) {
      setError(t("email.invalid"));
      return;
    }

    if (!trimmedCode) {
      setError(t("email.codeRequired"));
      return;
    }

    if (!userId) {
      setError(t("pending"));
      return;
    }

    setSubmitting(true);

    try {
      await userControllerUpdateProfileContact({
        body: {
          email: trimmedValue,
          verificationCode: trimmedCode,
        },
      });

      updateUser({ email: trimmedValue });
      setSuccess(t("email.success"));
      setEmailModalOpen(false);
      setVerificationCode("");
      setCountdown(0);
      setValue("");
    } catch (submitError) {
      console.error("Failed to update email:", submitError);
      setError(t("email.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
            loading={submitting || (isEmailField && sendingCode)}
            disabled={!userId}
            className="rounded-full"
          >
            {t(`${field}.submit`)}
          </Button>
        </div>
      </form>

      {isEmailField ? (
        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader className="mb-0 space-y-2">
              <DialogTitle>{t("email.modalTitle")}</DialogTitle>
              <DialogDescription>
                {t("email.modalDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {t("email.label")}
                </label>
                <Input
                  type="email"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={t("email.placeholder")}
                  fullWidth
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {t("email.codeLabel")}
                </label>
                <div className="flex gap-3">
                  <Input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder={t("email.codePlaceholder")}
                    fullWidth
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleSendVerificationCode()}
                    disabled={sendingCode || countdown > 0 || submitting}
                    loading={sendingCode}
                    className="shrink-0 rounded-full px-4"
                  >
                    {countdown > 0
                      ? t("email.resendIn", { seconds: countdown })
                      : t("email.sendCode")}
                  </Button>
                </div>
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
            {!error && success ? (
              <p className="mt-4 text-sm text-primary">{success}</p>
            ) : null}

            <DialogFooter className="mt-6 flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailModalOpen(false)}
                className="rounded-full"
              >
                {t("email.cancel")}
              </Button>
              <Button
                type="button"
                loading={submitting}
                onClick={() => void handleEmailUpdate()}
                className="rounded-full"
              >
                {t("email.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
