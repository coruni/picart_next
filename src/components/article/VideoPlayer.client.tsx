"use client";

import Artplayer from "artplayer";
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  Settings,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";

interface VideoPlayerProps {
  videoUrl: string;
  cover?: string;
  title?: string;
}

// Convert Lucide icon to SVG string for ArtPlayer
const iconToSvg = (Icon: React.ComponentType<{ size?: number }>, size = 20) => {
  return ReactDOMServer.renderToStaticMarkup(<Icon size={size} />);
};

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
      autoSize: false,
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
      icons: {
        play: iconToSvg(Play),
        pause: iconToSvg(Pause),
        volume: iconToSvg(Volume2),
        volumeSmall: iconToSvg(Volume1),
        volumeMuted: iconToSvg(VolumeX),
        volumeClose: iconToSvg(VolumeOff),
        fullscreen: iconToSvg(Maximize),
        fullscreenExit: iconToSvg(Minimize),
        fullscreenWeb: iconToSvg(Maximize),
        fullscreenExitWeb: iconToSvg(Minimize),
        pip: iconToSvg(PictureInPicture),
        setting: iconToSvg(Settings),
      },
      customType: {},
      plugins: [],
      moreVideoAttr: {
        preload: "metadata",
        crossOrigin: "anonymous",
      },
    });

    art.on("ready", () => {
      art.template.$player.style.width = "100%";
      art.template.$player.style.height = "100%";

      const video = art.video;
      if (!video) return;

      // Force load metadata if duration is not available
      if (video.readyState < 1 || video.duration === 0 || Number.isNaN(video.duration)) {
        video.preload = "metadata";
        video.load();
      }
    });

    art.on("video:loadedmetadata", () => {
      console.log("[VideoPlayer] Metadata loaded, duration:", art.duration);
    });

    // Additional event: canplay can indicate duration is ready
    art.on("video:canplay", () => {
      const video = art.video;
      if (video && video.duration > 0) {
        console.log("[VideoPlayer] Can play, duration:", video.duration);
      }
    });

    // Durationchange event specifically tracks duration changes
    art.on("video:durationchange", () => {
      console.log("[VideoPlayer] Duration changed:", art.duration);
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
