import { CertificationForm } from "@/components/account/CertificationForm.client";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

export default async function AccountCertificationPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("profile.certification");

  // 认证状态来自当前用户的认证状态接口（serverApi 自动附加登录态，未申请时为 null）
  const response = await serverApi.userCertificationControllerGetMyCertificationStatus();
  const certification = response.data?.data ?? null;

  return (
    <div className="page-container">
      <div className="mx-auto max-w-3xl flex-1 rounded-xl bg-card flex-col flex">
        <div className="flex h-14 items-center border-b border-border px-4 md:px-6">
          <div className="flex h-full flex-1 items-center">
            <span className="pr-6 text-base font-bold">{t("title")}</span>
          </div>
        </div>
        <div className="flex-1 px-4 pb-4 flex-col flex">
          <CertificationForm id={id} certification={certification} key={id} />
        </div>
      </div>
    </div>
  );
}