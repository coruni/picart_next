import { ProfileEditForm } from "@/components/account/ProfileEditForm.client";
import { serverApi } from "@/lib/server-api";
import { notFound } from "next/navigation";

export default async function AccountEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const { data } = await serverApi.userControllerFindOne({ path: { id } });

  if (!data?.data) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="flex-1 max-w-3xl mx-auto  bg-card rounded-xl">
        <div className="px-6 h-14 flex items-center border-b border-border ">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">编辑个人资料</span>
          </div>
        </div>
        <div className="px-4 flex-1 pb-4">
          <ProfileEditForm user={data.data} locale={locale} key={id} />
        </div>
      </div>
    </div>
  );
}
