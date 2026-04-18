"use client";

import Artplayer from "artplayer";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  cover?: string;
  title?: string;
}

// Helper to probe video duration for problematic formats like WebM
const probeVideoDuration = (url: string): Promise<number | undefined> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    let resolved = false;
    let seekAttempts = 0;
    const MAX_SEEK_ATTEMPTS = 3;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("durationchange", onDurationChange);
        video.removeEventListener("error", onError);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("seeked", onSeeked);
        video.src = "";
        video.load();
      }
    };

    const onLoadedMetadata = () => {
      if (video.duration && video.duration > 0 && video.duration !== Infinity) {
        cleanup();
        resolve(video.duration);
      }
    };

    const onDurationChange = () => {
      if (video.duration && video.duration > 0 && video.duration !== Infinity) {
        cleanup();
        resolve(video.duration);
      }
    };

    const onError = () => {
      cleanup();
      resolve(undefined);
    };

    const onSeeked = () => {
      if (resolved) return;
      if (video.duration && video.duration > 0 && video.duration !== Infinity) {
        cleanup();
        resolve(video.duration);
      }
    };

    // For WebM: when canplay fires, try seek-to-end to force duration calculation
    const onCanPlay = () => {
      if (resolved) return;

      // If duration is still not available or is Infinity, try seek-to-end trick
      if (!video.duration || video.duration === 0 || video.duration === Infinity) {
        if (seekAttempts >= MAX_SEEK_ATTEMPTS) {
          cleanup();
          resolve(undefined);
          return;
        }
        seekAttempts++;

        // Add seeked listener before seeking
        video.addEventListener("seeked", onSeeked);

        // Try different seek strategies
        if (seekAttempts === 1) {
          // First try: seek to a very large time
          video.currentTime = 1e9;
        } else if (seekAttempts === 2) {
          // Second try: seek to 1 hour
          video.currentTime = 3600;
        } else {
          // Last try: seek to 100 seconds
          video.currentTime = 100;
        }

        // Timeout for this seek attempt
        setTimeout(() => {
          if (!resolved) {
            video.removeEventListener("seeked", onSeeked);
            // Try again if not resolved
            if (seekAttempts < MAX_SEEK_ATTEMPTS) {
              onCanPlay();
            } else {
              cleanup();
              resolve(undefined);
            }
          }
        }, 500);
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("error", onError);
    video.addEventListener("canplay", onCanPlay);

    video.src = url;
    video.load();

    // Timeout after 8 seconds
    setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 8000);
  });
};

export function VideoPlayer({ videoUrl, cover, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artplayerRef = useRef<Artplayer | null>(null);
  const durationProbedRef = useRef(false);

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
      moreVideoAttr: {
        preload: "metadata",
        crossOrigin: "anonymous",
      },
    });

    art.on("ready", () => {
      const video = art.video;
      if (!video) return;

      // Probe duration for WebM or when duration is not available
      const isWebM = videoUrl.toLowerCase().includes(".webm");
      if ((isWebM || !video.duration || video.duration === 0 || Number.isNaN(video.duration)) && !durationProbedRef.current) {
        durationProbedRef.current = true;
        probeVideoDuration(videoUrl).then((duration) => {
          if (duration && duration > 0) {
            console.log("[VideoPlayer] Probed duration:", duration);
            // Force update ArtPlayer's duration
            if (art.video) {
              Object.defineProperty(art.video, "duration", {
                value: duration,
                writable: false,
                configurable: true,
              });
              // Trigger duration update
              art.emit("video:durationchange");
            }
          }
        });
      }

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
