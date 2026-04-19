"use client";

import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { ProgressEventCallback } from "@ffmpeg/ffmpeg";

type CompressionStep = "compressing" | "trimming";

export type VideoCompressionResult = {
  blob: Blob;
  duration: number;
  wasTrimmed: boolean;
};

type CompressionProfile = {
  audioBitrate: number;
  extension: "mp4" | "webm";
  mimeType: "video/mp4" | "video/webm";
  audioCodec: string;
  extraArgs?: string[];
  videoCodec: string;
};

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE_URL =
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;
const MIN_DURATION_SECONDS = 5;
const MAX_VIDEO_HEIGHT = 720;
const MAX_VIDEO_WIDTH = 1280;
const DEFAULT_MARGIN_RATIO = 0.92;

const compressionProfiles: CompressionProfile[] = [
  {
    audioBitrate: 96_000,
    extension: "mp4",
    mimeType: "video/mp4",
    audioCodec: "aac",
    videoCodec: "libx264",
    extraArgs: ["-preset", "ultrafast", "-tune", "fastdecode"],
  },
  {
    audioBitrate: 96_000,
    extension: "mp4",
    mimeType: "video/mp4",
    audioCodec: "aac",
    videoCodec: "mpeg4",
  },
];

let ffmpegInstancePromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstancePromise) {
    ffmpegInstancePromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });

      return ffmpeg;
    })().catch((error) => {
      ffmpegInstancePromise = null;
      throw error;
    });
  }

  return ffmpegInstancePromise;
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to read video metadata"));
    };
    video.src = objectUrl;
  });
}

function getTargetDuration(
  originalDuration: number,
  outputSize: number,
  maxFileSize: number,
): number {
  if (
    outputSize <= maxFileSize ||
    originalDuration <= MIN_DURATION_SECONDS
  ) {
    return originalDuration;
  }

  const estimatedDuration =
    (originalDuration * maxFileSize * DEFAULT_MARGIN_RATIO) / outputSize;

  return Math.max(
    MIN_DURATION_SECONDS,
    Math.min(originalDuration, Math.floor(estimatedDuration)),
  );
}

function getVideoBitrate(targetDuration: number, maxFileSize: number, audioBitrate: number) {
  const totalBitrate = Math.floor(
    ((maxFileSize * 8 * DEFAULT_MARGIN_RATIO) / Math.max(targetDuration, 1)),
  );
  const remaining = totalBitrate - audioBitrate;

  return Math.max(400_000, Math.min(remaining, 2_500_000));
}

function createCommand(
  inputName: string,
  outputName: string,
  duration: number,
  maxFileSize: number,
  profile: CompressionProfile,
) {
  const videoBitrate = getVideoBitrate(duration, maxFileSize, profile.audioBitrate);
  const scaleFilter =
    `scale=${MAX_VIDEO_WIDTH}:${MAX_VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,` +
    "pad=ceil(iw/2)*2:ceil(ih/2)*2";

  return [
    "-i",
    inputName,
    "-t",
    duration.toFixed(2),
    "-vf",
    scaleFilter,
    "-r",
    "30",
    "-c:v",
    profile.videoCodec,
    ...(profile.extraArgs ?? []),
    "-b:v",
    `${videoBitrate}`,
    "-maxrate",
    `${videoBitrate}`,
    "-bufsize",
    `${videoBitrate * 2}`,
    "-c:a",
    profile.audioCodec,
    "-b:a",
    `${profile.audioBitrate}`,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "faststart",
    outputName,
  ];
}

export async function compressVideoWithFfmpeg(
  videoFile: File,
  maxFileSize: number,
  onProgress?: (progress: number, step: CompressionStep) => void,
): Promise<VideoCompressionResult> {
  if (videoFile.size <= maxFileSize) {
    return {
      blob: videoFile,
      duration: await getVideoDuration(videoFile),
      wasTrimmed: false,
    };
  }

  const [{ fetchFile }, ffmpeg, originalDuration] = await Promise.all([
    import("@ffmpeg/util"),
    getFFmpeg(),
    getVideoDuration(videoFile),
  ]);

  const safeBaseName = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_") || "video";
  const inputExtension = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
  const inputName = `${safeBaseName}-input.${inputExtension}`;

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

  const progressHandler: ProgressEventCallback = ({ progress }) => {
    if (!onProgress) return;
    const step: CompressionStep =
      currentDuration < originalDuration ? "trimming" : "compressing";
    onProgress(Math.min(99, Math.max(0, Math.round(progress * 100))), step);
  };

  let currentDuration = Math.max(
    MIN_DURATION_SECONDS,
    Number.isFinite(originalDuration) && originalDuration > 0
      ? originalDuration
      : MIN_DURATION_SECONDS,
  );
  let lastError: Error | null = null;

  ffmpeg.on("progress", progressHandler);

  try {
    for (const profile of compressionProfiles) {
      currentDuration = Math.max(
        MIN_DURATION_SECONDS,
        Number.isFinite(originalDuration) && originalDuration > 0
          ? originalDuration
          : MIN_DURATION_SECONDS,
      );

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const outputName = `${safeBaseName}-output-${attempt}.${profile.extension}`;

        try {
          const exitCode = await ffmpeg.exec(
            createCommand(inputName, outputName, currentDuration, maxFileSize, profile),
          );

          if (exitCode !== 0) {
            throw new Error(`ffmpeg exited with code ${exitCode}`);
          }

          const data = await ffmpeg.readFile(outputName);
          if (!(data instanceof Uint8Array)) {
            throw new Error("ffmpeg returned invalid output");
          }

          const outputSize = data.byteLength;
          const nextDuration = getTargetDuration(
            currentDuration,
            outputSize,
            maxFileSize,
          );

          if (outputSize <= maxFileSize || nextDuration >= currentDuration) {
            if (onProgress) {
              onProgress(100, currentDuration < originalDuration ? "trimming" : "compressing");
            }

            const outputBytes = new Uint8Array(data.byteLength);
            outputBytes.set(data);

            return {
              blob: new Blob([outputBytes.buffer], { type: profile.mimeType }),
              duration: currentDuration,
              wasTrimmed: currentDuration < originalDuration,
            };
          }

          currentDuration = nextDuration;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("ffmpeg compression failed");
          break;
        } finally {
          await ffmpeg.deleteFile(outputName).catch(() => undefined);
        }
      }
    }
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
  }

  throw lastError || new Error("Failed to compress video");
}
