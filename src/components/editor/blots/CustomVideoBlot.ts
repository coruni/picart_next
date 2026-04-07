import Quill from "quill";

// 视频平台类型
export type VideoPlatform = "youtube" | "bilibili" | "tiktok" | "unknown";

// 视频值类型
export interface VideoValue {
  src: string;
  platform: VideoPlatform;
  videoId: string;
}

// 视频 URL 解析结果
export interface ParsedVideoUrl {
  platform: VideoPlatform;
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockEmbed = Quill.import("blots/block/embed") as any;

/**
 * 解析视频 URL
 * 支持 YouTube、Bilibili、TikTok
 */
export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  // YouTube 支持格式:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = trimmedUrl.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: "youtube",
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`,
    };
  }

  // Bilibili 支持格式:
  // https://www.bilibili.com/video/BVxxxx
  // https://b23.tv/BVxxxx
  // https://www.bilibili.com/video/avxxxx (旧版 AV 号)
  const bilibiliRegex = /(?:bilibili\.com\/video\/(BV[\w]+)|b23\.tv\/(BV[\w]+))(?:\/?|\?.*)?/;
  const bilibiliMatch = trimmedUrl.match(bilibiliRegex);
  if (bilibiliMatch) {
    const videoId = bilibiliMatch[1] || bilibiliMatch[2];
    // Bilibili 嵌入需要 bvid 参数
    return {
      platform: "bilibili",
      videoId,
      embedUrl: `https://player.bilibili.com/player.html?bvid=${videoId}&autoplay=0`,
      thumbnailUrl: undefined, // Bilibili 需要 API 获取缩略图
    };
  }

  // 旧版 Bilibili AV 号
  const bilibiliAvRegex = /bilibili\.com\/video\/(av\d+)/i;
  const bilibiliAvMatch = trimmedUrl.match(bilibiliAvRegex);
  if (bilibiliAvMatch) {
    const videoId = bilibiliAvMatch[1];
    return {
      platform: "bilibili",
      videoId,
      embedUrl: `https://player.bilibili.com/player.html?avid=${videoId.replace("av", "")}&autoplay=0`,
      thumbnailUrl: undefined,
    };
  }

  // TikTok 支持格式:
  // https://www.tiktok.com/@username/video/VIDEO_ID
  // https://vm.tiktok.com/VIDEO_ID (短链接)
  // https://www.tiktok.com/t/ZTxxxx (分享链接)
  const tiktokRegex = /tiktok\.com\/(?:@[\w.-]+\/video\/(\d+)|t\/[\w]+)/;
  const tiktokMatch = trimmedUrl.match(tiktokRegex);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1] || "";
    // TikTok 嵌入 URL
    return {
      platform: "tiktok",
      videoId,
      embedUrl: videoId
        ? `https://www.tiktok.com/embed/${videoId}`
        : trimmedUrl, // 短链接使用原 URL
      thumbnailUrl: undefined,
    };
  }

  // TikTok 短链接 vm.tiktok.com
  const tiktokShortRegex = /vm\.tiktok\.com\/([\w]+)/;
  const tiktokShortMatch = trimmedUrl.match(tiktokShortRegex);
  if (tiktokShortMatch) {
    return {
      platform: "tiktok",
      videoId: tiktokShortMatch[1],
      embedUrl: trimmedUrl, // 短链接保持原样
      thumbnailUrl: undefined,
    };
  }

  // 如果都不匹配，但包含常见视频域名，尝试通用嵌入
  if (trimmedUrl.includes("youtube") || trimmedUrl.includes("youtu.be")) {
    return {
      platform: "youtube",
      videoId: "unknown",
      embedUrl: trimmedUrl,
    };
  }

  if (trimmedUrl.includes("bilibili")) {
    return {
      platform: "bilibili",
      videoId: "unknown",
      embedUrl: trimmedUrl,
    };
  }

  if (trimmedUrl.includes("tiktok")) {
    return {
      platform: "tiktok",
      videoId: "unknown",
      embedUrl: trimmedUrl,
    };
  }

  return null;
}

/**
 * 获取平台显示名称
 */
export function getPlatformName(platform: VideoPlatform): string {
  const names: Record<VideoPlatform, string> = {
    youtube: "YouTube",
    bilibili: "Bilibili",
    tiktok: "TikTok",
    unknown: "Video",
  };
  return names[platform] || "Video";
}

/**
 * 获取平台图标 SVG
 */
export function getPlatformIcon(platform: VideoPlatform): string {
  const icons: Record<VideoPlatform, string> = {
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    bilibili: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.08 1.04-1.25 1.77-.08.34-.12.7-.12 1.05.04 1.13.59 2.24 1.5 2.92.73.55 1.64.81 2.52.74.96-.09 1.86-.54 2.45-1.29.5-.62.75-1.41.75-2.21V.02z"/></svg>`,
    unknown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  };
  return icons[platform] || icons.unknown;
}

/**
 * 自定义视频 Blot
 */
export class CustomVideoBlot extends BlockEmbed {
  static blotName = "video";
  static tagName = "DIV";
  static className = "ql-video-wrapper";

  static create(value: string | VideoValue) {
    const node = document.createElement("div") as HTMLElement;
    node.classList.add("ql-video-wrapper");

    const src = typeof value === "string" ? value : value.src;
    const parsed = parseVideoUrl(src);

    if (!parsed) {
      // 如果解析失败，显示错误提示
      node.innerHTML = `<div class="ql-video-error">Invalid video URL</div>`;
      return node;
    }

    const platform = parsed.platform;
    const embedUrl = parsed.embedUrl;
    const platformName = getPlatformName(platform);
    const platformIcon = getPlatformIcon(platform);

    // 创建视频容器
    const videoContainer = document.createElement("div");
    videoContainer.className = "ql-video-container";
    videoContainer.setAttribute("data-platform", platform);

    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", embedUrl);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("title", `${platformName} video player`);
    iframe.className = "ql-video-iframe";

    // 创建点击遮罩层 - 用于捕获点击事件（iframe 会阻止事件冒泡）
    const overlay = document.createElement("div");
    overlay.className = "ql-video-overlay";
    overlay.setAttribute("data-video-overlay", "true");

    videoContainer.appendChild(iframe);
    videoContainer.appendChild(overlay);
    node.appendChild(videoContainer);

    // 保存数据属性
    node.setAttribute("data-src", src);
    node.setAttribute("data-platform", platform);
    node.setAttribute("data-video-id", parsed.videoId);

    return node;
  }

  static value(domNode: HTMLElement): VideoValue {
    const src = domNode.getAttribute("data-src") || "";
    const platform = (domNode.getAttribute("data-platform") as VideoPlatform) || "unknown";
    const videoId = domNode.getAttribute("data-video-id") || "";

    return {
      src,
      platform,
      videoId,
    };
  }

  static formats(domNode: HTMLElement): Record<string, unknown> {
    const formats: Record<string, unknown> = {};
    const platform = domNode.getAttribute("data-platform");
    const videoId = domNode.getAttribute("data-video-id");

    if (platform) formats.platform = platform;
    if (videoId) formats.videoId = videoId;

    return formats;
  }
}
