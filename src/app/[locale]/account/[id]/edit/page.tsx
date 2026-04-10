import { ProfileEditForm } from "@/components/account/ProfileEditForm.client";
import { getTranslations } from "next-intl/server";

import { getAccountUser } from "../account-user";

export default async function AccountEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("profile.edit");
  const user = await getAccountUser(id);

  return (
    <div className="page-container">
      <div className="mx-auto max-w-3xl flex-1 rounded-xl bg-card">
        <div className="flex h-14 items-center border-b border-border px-4 md:px-6">
          <div className="flex h-full flex-1 items-center">
            <span className="pr-6 text-base font-bold">{t("title")}</span>
          </div>
        </div>
        <div className="flex-1 px-4 pb-4">
          <ProfileEditForm user={user} locale={locale} key={id} />
        </div>
      </div>
    </div>
  );
}
