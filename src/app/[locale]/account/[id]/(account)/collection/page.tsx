import { CollectionListClient } from "@/components/account";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

export default async function AccountCollectionPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("accountCollectionPage");
  const response = await serverApi.collectionControllerFindAll({
    query: {
      page: 1,
      limit: 10,
      userId: Number(id),
    },
  });

  return (
    <div className=" px-2">
      <CollectionListClient
        initCollections={response.data?.data?.data || []}
        initPage={2}
        initTotal={response.data?.data?.meta?.total || 0}
        userId={Number(id)}
        emptyMessage={t("message")}
      />
    </div>
  );
}
