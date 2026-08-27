"use client";

import {
  uploadControllerUploadFile,
  userCertificationControllerApply,
  type UserCertificationControllerGetMyCertificationStatusResponses,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRouter } from "@/i18n/routing";
import { getErrorMessage, showToast } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { formatDateYMD } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Ban, Clock, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * 我的认证状态类型（来自 userCertificationControllerGetMyCertificationStatus）
 */
type CertificationRecord = NonNullable<
  UserCertificationControllerGetMyCertificationStatusResponses[200]["data"]
>;

/** 认证申请状态 */
type CertificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";

type CertificationFormProps = {
  id: string;
  /** 当前认证状态（服务端从 getMyCertificationStatus 获取，未申请时为 null） */
  certification: CertificationRecord | null;
};

type CertificationType = "OFFICIAL" | "CREATOR";

type MaterialItem = {
  url: string;
  name: string;
};

export const CertificationForm = ({
  id,
  certification,
}: CertificationFormProps) => {
  const t = useTranslations("profile.certification");
  const router = useRouter();

  const [type, setType] = useState<CertificationType>("CREATOR");
  const [realName, setRealName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [slogan, setSlogan] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 已有待审核或已通过的认证时禁止重复申请
  const hasPendingOrApproved =
    certification?.status === "PENDING" || certification?.status === "APPROVED";

  const statusText = (status?: string): string => {
    switch (status as CertificationStatus) {
      case "PENDING":
        return t("statusPending");
      case "APPROVED":
        return t("statusApproved");
      case "REJECTED":
        return t("statusRejected");
      case "REVOKED":
        return t("statusRevoked");
      default:
        return status || "-";
    }
  };

  const typeText = (itemType?: string): string => {
    return itemType === "OFFICIAL" ? t("typeOfficial") : t("typeCreator");
  };

  const handleMaterialsChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    for (const file of files) {
      setUploading(true);
      try {
        const metadata = await buildUploadMetadata([file]);
        const { data } = await uploadControllerUploadFile({
          body: { file, metadata },
        });
        const url = data?.data?.[0]?.url;
        if (url) {
          setMaterials((prev) => [...prev, { url, name: file.name }]);
        }
      } catch (error) {
        showToast(getErrorMessage(error, t("submitFailed")));
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveMaterial = (url: string) => {
    setMaterials((prev) => prev.filter((item) => item.url !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || hasPendingOrApproved) return;

    if (type === "OFFICIAL" && !organizationName.trim()) {
      showToast(t("organizationNameRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await userCertificationControllerApply({
        body: {
          type,
          realName: realName.trim() || undefined,
          organizationName: organizationName.trim() || undefined,
          description: description.trim() || undefined,
          slogan: slogan.trim() || undefined,
          materials: materials.length ? materials.map((m) => m.url) : undefined,
        },
      });

      showToast(t("submitSuccess"));
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push(`/account/${id}`);
    } catch (error) {
      const err = error as { code?: number; status?: number };
      if (err.code === 409 || err.status === 409) {
        showToast(t("alreadyExists"));
      } else {
        showToast(getErrorMessage(error, t("submitFailed")));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== 已有认证记录：不显示申请表单 ====================
  if (certification) {
    // ---------- 已通过：展示认证信息 ----------
    if (certification.status === "APPROVED") {
      return (
        <div className="mb-6 mt-4 flex-1 justify-center items-center flex-col flex">
          <div className="rounded-xl border border-border bg-card p-6 text-center w-full">
            <div className="mx-auto mb-3 flex size-24 items-center justify-center rounded-full text-green-600">
              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="approve-icon-circle"
                />
                <polyline
                  points="24,36 32,44 48,26"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="approve-icon-check"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              {typeText(certification.type)}
            </p>
            <p className="mt-1 text-lg font-extrabold text-green-600">
              {t("statusApproved")}
            </p>
            <div className="mx-auto mt-5 max-w-sm space-y-3 text-left text-sm">
              {certification.organizationName && (
                <div className="flex items-center justify-between gap-6">
                  <span className="shrink-0 text-muted-foreground">
                    {t("organizationNameLabel")}
                  </span>
                  <span className="text-right">
                    {certification.organizationName}
                  </span>
                </div>
              )}
              {certification.slogan && (
                <div className="flex items-center justify-between gap-6">
                  <span className="shrink-0 text-muted-foreground">
                    {t("slogan")}
                  </span>
                  <span className="text-right">{certification.slogan}</span>
                </div>
              )}
              {certification.reviewedAt && (
                <div className="flex items-center justify-between gap-6">
                  <span className="shrink-0 text-muted-foreground">
                    {t("certifiedAtLabel")}
                  </span>
                  <span className="text-right">
                    {formatDateYMD(certification.reviewedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ---------- 审核中 / 已拒绝 / 已撤销：状态占位（内容由用户自行编写） ----------
    return (
      <div className="mb-6 mt-4 flex-1 justify-center items-center flex-col flex">
        <div className="rounded-xl border border-border bg-card p-6 text-center w-full">
          <div
            className={cn(
              "mx-auto mb-3 flex size-24 items-center justify-center rounded-full",
              certification.status === "REJECTED" && "text-red-500",
              certification.status === "PENDING" && "bg-blue-50 text-blue-500",
              certification.status === "REVOKED" && "bg-gray-100 text-gray-500",
            )}
          >
            {certification.status === "REJECTED" && (
              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="reject-icon-circle"
                />
                <line
                  x1="24"
                  y1="24"
                  x2="48"
                  y2="48"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="reject-icon-line-1"
                />
                <line
                  x1="48"
                  y1="24"
                  x2="24"
                  y2="48"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="reject-icon-line-2"
                />
              </svg>
            )}
            {certification.status === "PENDING" && <Clock size={24} />}
            {certification.status === "REVOKED" && <Ban size={24} />}
          </div>
          <p className="text-sm text-muted-foreground">
            {typeText(certification.type)}
          </p>
          <p className="mt-1 text-base font-semibold">
            {statusText(certification.status)}
          </p>
          {certification.status === "REJECTED" &&
            certification.reviewReason && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reviewReason")}: {certification.reviewReason}
              </p>
            )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-6 mt-4 text-sm text-muted-foreground">{t("subtitle")}</p>

      {/* 当前认证状态 */}
      {/* {certification && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-secondary">
            {t("recordsTitle")}
          </label>
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {typeText(certification.type)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    certification.status === "APPROVED" && "text-green-600",
                    certification.status === "REJECTED" && "text-red-500",
                    (certification.status === "PENDING" ||
                      certification.status === undefined) &&
                      "text-muted-foreground",
                  )}
                >
                  {statusText(certification.status)}
                </span>
              </div>
              {certification.slogan && (
                <p className="mt-1 text-muted-foreground">
                  {certification.slogan}
                </p>
              )}
              {certification.reviewReason && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reviewReason")}: {certification.reviewReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* 认证类型 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("type")}
        </label>
        <Select
          value={type}
          onChange={(value) => setType(value as CertificationType)}
          options={[
            { value: "OFFICIAL", label: t("typeOfficial") },
            { value: "CREATOR", label: t("typeCreator") },
          ]}
        />
      </div>

      {/* 真实姓名/主体名称 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("realName")}
        </label>
        <Input
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          placeholder={t("realNamePlaceholder")}
          fullWidth
        />
      </div>

      {/* 机构名称（官方认证必填） */}
      {type === "OFFICIAL" && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-secondary">
            {t("organizationName")}
          </label>
          <Input
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder={t("organizationNamePlaceholder")}
            fullWidth
          />
        </div>
      )}

      {/* 认证说明 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          maxLength={500}
          rows={4}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-primary focus:border-primary hover:border-primary"
        />
      </div>

      {/* 认证标语 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("slogan")}
        </label>
        <Input
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          placeholder={t("sloganPlaceholder")}
          maxLength={20}
          showMaxLength
          fullWidth
        />
        <div className="mt-1 text-xs text-gray-400">{t("sloganHint")}</div>
      </div>

      {/* 证明材料 */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("materials")}
        </label>
        <input
          id="certification-materials"
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleMaterialsChange}
          className="hidden"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="certification-materials"
            className="text-sm bg-[#EDF1F7] hover:bg-[#8592A3] text-black/60 hover:text-white leading-7 rounded-full cursor-pointer px-4"
          >
            {t("uploadMaterial")}
          </label>
          {materials.map((item) => (
            <span
              key={item.url}
              className="flex items-center gap-1.5 rounded-lg bg-muted p-1 pr-2 text-sm text-muted-foreground"
            >
              <ImageWithFallback
                src={item.url}
                alt={item.name}
                width={32}
                height={32}
                className="size-8 rounded-md object-cover"
              />
              <span className="max-w-32 truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveMaterial(item.url)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("removeMaterial")}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {uploading && (
            <span className="text-sm text-muted-foreground">...</span>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">{t("materialsHint")}</div>
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-4 justify-center">
        <Button
          type="submit"
          variant="default"
          loading={submitting}
          disabled={hasPendingOrApproved}
          size="lg"
          className="rounded-full h-10 max-w-2xs w-full"
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>

      {hasPendingOrApproved && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("alreadyExists")}
        </p>
      )}
    </form>
  );
};
