"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { userControllerUpdate, uploadControllerUploadFile } from "@/api";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { Camera } from "lucide-react";
import type { UserDetail } from "@/types";

type ProfileEditFormProps = {
  user: UserDetail;
  locale: string;
};

export const ProfileEditForm = ({ user, locale }: ProfileEditFormProps) => {
  const t = useTranslations("profile.edit");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user.nickname || "",
    description: user.description || "",
    gender: user.gender || "male",
  });
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  // const [backgroundUrl, setBackgroundUrl] = useState(user.background || "");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data } = await uploadControllerUploadFile({
        body: {
          file: file,
        },
      });

      if (data?.data?.[0]) {
        setAvatarUrl(data.data[0].url!);
      }
    } catch (error) {
    } finally {
      e.target.value = "";
    }
  };

  const handleBackgroundChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data } = await uploadControllerUploadFile({
        body: {
          file: file,
        },
      });

      if (data && Array.isArray(data) && data[0]) {
        // setBackgroundUrl(String(data[0]));
      }
    } catch (error) {
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userControllerUpdate({
        path: { id: String(user.id) },
        body: {
          nickname: formData.nickname,
          description: formData.description,
          gender: formData.gender as "male" | "female" | "other",
          avatar: avatarUrl,
        },
      });


      router.push(`/${locale}/account/${user.id}`);
      router.refresh();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 头像上传 */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative mt-4">
          <Avatar url={avatarUrl} className="mb-4 size-28" />
          
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="flex gap-6 mt-2">
          <label
            htmlFor="avatar-upload"
            className="text-sm bg-[#EDF1F7] hover:bg-[#8592A3] text-black/60 hover:text-white leading-7 rounded-full cursor-pointer px-4"
          >
            {t("changeAvatar")}
          </label>
          <label
            htmlFor="background-upload"
            className="text-sm bg-[#EDF1F7] hover:bg-[#8592A3] text-black/60 hover:text-white leading-7 rounded-full cursor-pointer px-4"
          >
            {t("changeAvatarFrame")}
          </label>
          <input
            id="background-upload"
            type="file"
            accept="image/*"
            onChange={handleBackgroundChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 昵称 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("nickname")}
        </label>
        <Input
          value={formData.nickname}
          onChange={(e) =>
            setFormData({ ...formData, nickname: e.target.value })
          }
          placeholder={t("nicknamePlaceholder")}
          maxLength={20}
          fullWidth
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {formData.nickname.length}/20
        </div>
      </div>

      {/* 性别 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("gender")}
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary hover:border-primary"
        >
          <option value="male">{t("genderMale")}</option>
          <option value="female">{t("genderFemale")}</option>
          <option value="other">{t("genderOther")}</option>
        </select>
      </div>

      {/* 个人签名 */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2 text-secondary">
          {t("description")}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder={t("descriptionPlaceholder")}
          maxLength={200}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary hover:border-primary"
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {formData.description.length}/200
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-4 justify-center">
        <Button type="submit" variant="default" loading={loading} size="lg" className="rounded-full h-10 max-w-2xs w-full">
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
