import { NextRequest, NextResponse } from "next/server";

// 图片代理：下载海报导出 canvas 时，跨域封面图会污染 canvas 导致 toDataURL 失败。
// 通过该接口在服务端获取图片并以同源响应返回，canvas 即可安全导出。
const ALLOWED_IMAGE_HOSTS = ["api.cerylab.com", "cerylab.com", "coslark.org"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new NextResponse("Unsupported protocol", { status: 400 });
  }

  const hostAllowed = ALLOWED_IMAGE_HOSTS.some(
    (host) =>
      target.hostname === host || target.hostname.endsWith(`.${host}`),
  );
  if (!hostAllowed) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const res = await fetch(target.toString());
    if (!res.ok) {
      return new NextResponse("Fetch failed", { status: 502 });
    }

    const blob = await res.blob();
    if (blob.size > MAX_IMAGE_SIZE) {
      return new NextResponse("Too large", { status: 413 });
    }

    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Fetch error", { status: 502 });
  }
}
