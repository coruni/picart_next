import {
  CollectionAddArticlesButton,
  CollectionArticleListClient,
  CollectionDetailEditButton,
} from "@/components/account";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
import { cn, formatCompactNumber } from "@/lib";
import { getCurrentUserId } from "@/lib/current-user";
import { generateCollectionMetadata } from "@/lib/seo";
import { serverApi } from "@/lib/server-api";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";

const getCollectionDetail = cache(async (collectionId: string) => {
  const response = await serverApi.collectionControllerFindOne({
    path: { id: Number(collectionId) },
  });

  return response.data?.data ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; collectionId: string; locale: string }>;
}): Promise<Metadata> {
  const { collectionId, locale } = await params;
  const collection = await getCollectionDetail(collectionId);
  return generateCollectionMetadata(collection, locale);
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string; collectionId: string; locale: string }>;
}) {
  const { collectionId } = await params;
  const [tCollection, tAccountInfo, locale, currentUserId, collection, itemsResponse] =
    await Promise.all([
      getTranslations("accountCollectionList"),
      getTranslations("accountInfo"),
      getLocale(),
      getCurrentUserId(),
      getCollectionDetail(collectionId),
      serverApi.collectionControllerGetCollectionItems({
        path: { id: Number(collectionId) },
        query: {
          page: 1,
          limit: 10,
        },
      }),
    ]);

  if (!collection) {
    notFound();
  }

  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  return (
    <>
      <div className="rounded-t-xl bg-card sticky top-header z-10">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 font-semibold">
          <span>{collection.name}</span>
          {currentUserId === String(collection.userId) ? (
            <div className="flex items-center gap-3">
              <CollectionAddArticlesButton
                collectionId={collection.id}
                currentUserId={String(collection.userId)}
              />
              <CollectionDetailEditButton
                collection={{
                  id: collection.id,
                  name: collection.name,
                  description: collection.description || "",
                  isPublic: collection.isPublic,
                  avatar:
                    typeof collection.avatar === "string"
                      ? collection.avatar
                      : "",
                  cover: collection.cover || "",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
      <section className="overflow-hidden bg-card mb-2">
        {collection.cover && (
          <div className="relative h-42 w-full bg-muted">
            <ImageWithFallback
              fill
              quality={95}
              src={collection.cover}
              alt={collection.name}
              className="object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
          </div>
        )}

        <div
          className={cn(
            "relative px-4 pb-5 border-b border-border",
            !collection.cover && "pt-5",
          )}
        >
          <div
            className={cn(
              " flex items-start gap-4",
              collection.cover && "-mt-9",
            )}
          >
            <div className="relative size-18 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-sm">
              {collection.avatar || collection.cover ? (
                <ImageWithFallback
                  fill
                  quality={95}
                  src={(collection.avatar as string) || collection.cover}
                  alt={collection.name}
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-primary">
                  <span className="text-xl font-semibold">
                    {collection.name.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-3">
              <h1 className="truncate text-white/95 font-semibold ">
                {collection.name}
              </h1>
              <div className="mt-2 text-xs text-secondary">
                {formatCompactNumber(collection.itemCount || 0, {
                  locale,
                  labels: compactNumberLabels,
                })}{" "}
                {tCollection("posts")} /{" "}
                {formatCompactNumber(collection.user?.followerCount || 0, {
                  locale,
                  labels: compactNumberLabels,
                })}{" "}
                {tCollection("followers")}
              </div>
            </div>
          </div>

          {collection.description ? (
            <p className="mt-4 text-xs  text-secondary">
              {collection.description}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Link
              href={`/account/${collection.user.id}`}
              className="inline-flex items-center justify-self-end gap-3 rounded-xl bg-muted/80 px-3 py-2 transition-colors hover:bg-primary/10"
            >
              <Avatar
                url={collection.user.avatar}
                frameUrl={
                  collection.user.equippedDecorations?.AVATAR_FRAME?.imageUrl
                }
                className="size-9 shrink-0"
                alt={collection.user.nickname || collection.user.username}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">
                  {collection.user.nickname || collection.user.username}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  @{collection.user.username}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <CollectionArticleListClient
        initItems={itemsResponse.data?.data?.data || []}
        initPage={2}
        initTotal={itemsResponse.data?.data?.meta?.total || 0}
        collectionId={collection.id}
      />
    </>
  );
}
