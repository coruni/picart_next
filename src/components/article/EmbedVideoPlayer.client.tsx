"use client";

import Artplayer from "artplayer";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";

interface EmbedVideoPlayerProps {
  /** 直链视频地址（.mp4/.webm 等） */
  videoUrl: string;
  /** 封面图地址（可选） */
  cover?: string;
}

// Convert Lucide icon to SVG string for ArtPlayer
const iconToSvg = (Icon: React.ComponentType<{ size?: number }>, size = 20) => {
  return ReactDOMServer.renderToStaticMarkup(<Icon size={size} />);
};

/**
 * 文章内容内嵌直链视频渲染组件
 *
 * 专用于编辑器插入的直链视频（ql-video-direct），
 * 与文章头部 VideoPlayer（article.type === "video"）相互独立：
 * - 精简播放器配置，适配内容流内嵌场景
 * - 不含调试日志，避免生产环境刷屏
 * - 容器固定为 16:9 标准规格，视频内容以 contain 方式完整可见
 *   （不变形、不裁剪，非 16:9 视频在容器内上下/左右留黑边）
 */
export function EmbedVideoPlayer({ videoUrl, cover }: EmbedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artplayerRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (artplayerRef.current) {
      artplayerRef.current.destroy();
      artplayerRef.current = null;
    }

    const art = new Artplayer({
      container: containerRef.current,
      url: videoUrl,
      poster: cover ?? "",
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: false,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: false,
      fullscreen: true,
      fullscreenWeb: false,
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: false,
      playsInline: true,
      autoPlayback: false,
      airplay: false,
      theme: "#6680ff",
      lang: navigator.language.toLowerCase(),
      quality: [],
      highlight: [],
      icons: {
        play: iconToSvg(Play),
        pause: iconToSvg(Pause),
        volume: iconToSvg(Volume2),
        volumeSmall: iconToSvg(Volume1),
        volumeMuted: iconToSvg(VolumeX),
        volumeClose: iconToSvg(VolumeOff),
        fullscreen: iconToSvg(Maximize),
        fullscreenExit: iconToSvg(Minimize),
      },
      customType: {},
      plugins: [],
      moreVideoAttr: {
        preload: "metadata",
        // 注意：不能设置 crossOrigin: "anonymous"。
        // 直链视频（CDN .mp4 等）通常不带 CORS 响应头，
        // 设置后浏览器会因跨域策略拒绝加载视频。
      },
    });

    art.on("ready", () => {
      art.template.$player.style.width = "100%";
      art.template.$player.style.height = "100%";

      const video = art.video;
      if (!video) return;

      // 固定 16:9 容器内保持视频完整可见（contain），不变形不裁剪
      video.style.objectFit = "contain";
      video.style.width = "100%";
      video.style.height = "100%";

      // Force load metadata if duration is not available
      if (
        video.readyState < 1 ||
        video.duration === 0 ||
        Number.isNaN(video.duration)
      ) {
        video.preload = "metadata";
        video.load();
      }
    });

    artplayerRef.current = art;

    return () => {
      if (artplayerRef.current) {
        artplayerRef.current.destroy();
        artplayerRef.current = null;
      }
    };
  }, [videoUrl, cover]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
      .art-video-player {
      position:unset !important;
      }
    `,
        }}
      />

      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </>
  );
}
