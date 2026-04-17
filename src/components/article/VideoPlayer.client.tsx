"use client";

import Artplayer from "artplayer";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  cover?: string;
  title?: string;
}

export function VideoPlayer({ videoUrl, cover, title }: VideoPlayerProps) {
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
      autoSize: true,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: false,
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: false,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#6680ff",
      lang: navigator.language.toLowerCase(),
      quality: [],
      highlight: [],
      icons: {},
      customType: {},
      plugins: [],
    });

    art.on("video:loadedmetadata", () => {
      console.log("[VideoPlayer] Metadata loaded, duration:", art.duration);
    });

    art.on("error", (error) => {
      console.error("[VideoPlayer] ArtPlayer error:", error);
    });

    artplayerRef.current = art;

    return () => {
      if (artplayerRef.current) {
        artplayerRef.current.destroy();
        artplayerRef.current = null;
      }
    };
  }, [videoUrl, cover, title]);

  return (
    <div className="relative z-10 w-full overflow-hidden bg-black">
      <div ref={containerRef} className="aspect-video w-full" />
    </div>
  );
}
