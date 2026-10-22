import { userControllerGetProfile } from "@/api";
import { CACHE_TAG_VALUES, type CacheTag } from "@/lib/cache-tags";
import { TOKEN_COOKIE_NAME } from "@/lib/request-auth";
import { getServerCookie } from "@/lib/server-cookies";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// 与 dashboard 的 looksLikeAdminRole 保持同一条判定规则
const ADMIN_ROLE_PATTERN = /admin|root|super|manage|运营|管理|super-admin/i;

function hasAdminRole(
  roles?: Array<{ displayName?: string; name?: string }> | null,
) {
  return (roles ?? []).some((role) =>
    ADMIN_ROLE_PATTERN.test(
      [role.displayName, role.name].filter(Boolean).join(" "),
    ),
  );
}

/**
 * 前台缓存失效入口。
 * 写操作都在浏览器里直连后端 API，服务端无从感知，因此由客户端在成功后调这里。
 */
export async function POST(request: NextRequest) {
  const token = await getServerCookie(TOKEN_COOKIE_NAME);

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let allowed = false;

  try {
    const { data } = await userControllerGetProfile({
      headers: { Authorization: `Bearer ${token}` },
    });
    allowed = hasAdminRole(data?.data?.roles);
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!allowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tags?: unknown;
  } | null;

  const requested = Array.isArray(body?.tags) ? body.tags : [];
  const tags = [
    ...new Set(
      requested.filter(
        (tag): tag is CacheTag =>
          typeof tag === "string" &&
          CACHE_TAG_VALUES.includes(tag as CacheTag),
      ),
    ),
  ];

  if (tags.length === 0) {
    return NextResponse.json({ message: "No valid tags" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ revalidated: tags });
}
