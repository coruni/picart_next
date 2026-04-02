import { UserDetail } from "@/types";

export type AccountPrivacySection =
  | "comments"
  | "collections"
  | "favorites"
  | "followers"
  | "followings"
  | "tags";

const privacyFieldMap: Record<
  AccountPrivacySection,
  keyof NonNullable<UserDetail["config"]>
> = {
  comments: "hideComments",
  collections: "hideCollections",
  favorites: "hideFavorites",
  followers: "hideFollowers",
  followings: "hideFollowings",
  tags: "hideTags",
};

export function isAccountOwner(
  userId: string | number | null | undefined,
  viewerId: string | number | null | undefined,
) {
  if (userId == null || viewerId == null) {
    return false;
  }

  return String(userId) === String(viewerId);
}

export function isAccountSectionHidden(
  user: Pick<UserDetail, "id" | "config">,
  section: AccountPrivacySection,
  viewerId?: string | number | null,
) {
  if (isAccountOwner(user.id, viewerId)) {
    return false;
  }

  const privacyField = privacyFieldMap[section];
  return Boolean(user.config?.[privacyField]);
}
