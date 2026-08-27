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
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * 我的认证状态类型（来自 userCertificationControllerGetMyCertificationStatus）
 */
export type CertificationRecord = NonNullable<
  UserCertificationControllerGetMyCertificationStatusResponses[200]["data"]
>;

/** 认证申请状态 */
export type CertificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

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

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-6 mt-4 text-sm text-muted-foreground">{t("subtitle")}</p>

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
