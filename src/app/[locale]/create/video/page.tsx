"use client";

import {
  articleControllerCreate,
  articleControllerFindOne,
  articleControllerUpdate,
  categoryControllerFindAll,
  uploadControllerGetUploadConfig,
  uploadControllerUploadFile,
} from "@/api";
import { Button } from "@/components/ui/Button";
import { CategoryOption, CategorySelect } from "@/components/ui/CategorySelect";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { TagSelect } from "@/components/ui/TagSelect";
import { useForm } from "@/hooks/useForm";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { compressVideoWithFfmpeg } from "@/lib/videoCompression";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import fixWebmDuration from "fix-webm-duration";

type CreateVideoFormData = {
  title: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  tagNames: string[];
  cover: string;
  videoUrl: string;
  requireFollow: boolean;
  requirePayment: boolean;
  requireMembership: boolean;
  listRequireLogin: boolean;
  requireLogin: boolean;
  viewPrice: number;
  sort: number;
  type: "video";
};

type VideoFrame = {
  id: string;
  dataUrl: string;
  time: number;
};

type UploadVideoItem = {
  id: string;
  fileName: string;
  remoteUrl?: string;
  status: "uploading" | "ready";
};

const toNumericTagIds = (value: string[]) =>
  value.map((item) => Number(item)).filter((item) => Number.isFinite(item));

// 从视频中提取帧
async function extractVideoFrames(
  videoFile: File,
  frameCount: number = 7,
): Promise<VideoFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const frames: VideoFrame[] = [];
    let frameIndex = 0;

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // 计算提取时间点：跳过前10%防止首帧无内容，均匀分布
      const duration = video.duration;
      const skipStart = duration * 0.1;
      const usableDuration = duration - skipStart;
      const interval = usableDuration / frameCount;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const captureFrame = (index: number) => {
        if (index >= frameCount) {
          resolve(frames);
          return;
        }

        const time = skipStart + index * interval;
        video.currentTime = time;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

        frames.push({
          id: `frame-${frameIndex}-${Date.now()}`,
          dataUrl,
          time: video.currentTime,
        });

        frameIndex++;
        captureFrame(frameIndex);
      };

      // 开始捕获第一帧
      captureFrame(0);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

// 将 dataURL 转换为 File
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

// 压缩视频到 720p 30fps，支持时长截断
async function compressVideo(
  videoFile: File,
  maxFileSize: number, // 最大文件大小（字节）
  onProgress?: (progress: number, step: string) => void,
): Promise<{ blob: Blob; duration: number; wasTrimmed: boolean }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    // 记录原始时长
    let originalDuration = 0;
    // 计算目标时长（初始为完整时长）
    let targetDuration = 0;
    const startTime = 0;
    let wasTrimmed = false;

    const attemptCompression = async () => {
      const chunks: Blob[] = [];
      let mediaRecorder: MediaRecorder | null = null;
      let recordingStarted = false;

      // 计算目标尺寸（720p，保持宽高比）
      const targetHeight = 720;
      const aspectRatio = video.videoWidth / video.videoHeight;
      const targetWidth = Math.round(targetHeight * aspectRatio);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 设置帧率
      const targetFrameRate = 30;

      // 尝试使用不同的 MIME 类型 - WebM 优先（fix-webm-duration 可以修复时长）
      const mimeTypes = [
        'video/webm;codecs="vp9"',
        'video/webm;codecs="vp8"',
        "video/webm",
        'video/mp4;codecs="avc1.42E01E"',
        "video/mp4",
      ];

      let selectedMimeType = "";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          console.log("[Video Compression] Using MIME type:", mime);
          break;
        }
      }

      // 如果没有支持的 MIME 类型，使用默认 WebM
      if (!selectedMimeType) {
        console.warn("[Video Compression] No specific MIME type supported, using default WebM");
      }

      // 计算码率（720p 30fps 建议 2.5-5 Mbps）
      const bitsPerPixel = 0.08; // 降低一点以控制文件大小
      const videoBitrate = Math.round(
        targetWidth * targetHeight * targetFrameRate * bitsPerPixel,
      );

      // 捕获视频流
      const videoStream = canvas.captureStream(targetFrameRate);

      // 设置开始和结束时间（提前定义，供音频同步使用）
      const effectiveStartTime = startTime;
      const effectiveEndTime =
        targetDuration > 0 ? startTime + targetDuration : originalDuration;

      // 尝试从原始视频获取音频轨道
      let audioVideo: HTMLVideoElement | null = null;
      let audioContext: AudioContext | null = null;
      try {
        // 创建一个新的视频元素来获取音频流
        audioVideo = document.createElement("video");
        audioVideo.src = video.src;
        audioVideo.muted = false;
        audioVideo.crossOrigin = "anonymous";

        // 等待音频视频准备好
        await new Promise<void>((resolve, reject) => {
          audioVideo!.onloadedmetadata = () => resolve();
          audioVideo!.onerror = () => reject(new Error("Failed to load audio"));
          audioVideo!.load();
        });

        // 捕获音频流（通过 Web Audio API）
        const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Web Audio API not supported");
        }
        audioContext = new AudioContextClass();
        const source = audioContext.createMediaElementSource(audioVideo);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        // 将音频轨道添加到视频流
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
          videoStream.addTrack(audioTrack);
          console.log("[Video Compression] Audio track added");
        }
      } catch (audioError) {
        console.warn("[Video Compression] Failed to capture audio:", audioError);
        // 继续压缩，只是没有音频
      }

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: videoBitrate,
      };
      if (selectedMimeType) {
        recorderOptions.mimeType = selectedMimeType;
      }
      mediaRecorder = new MediaRecorder(videoStream, recorderOptions);

      // 开始录制时同步播放音频
      if (audioVideo) {
        audioVideo.currentTime = effectiveStartTime;
        audioVideo.play().catch(() => {
          console.warn("[Video Compression] Failed to play audio");
        });
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 使用实际录制的 MIME 类型，如果没有则回退到预设的
        const actualMimeType = mediaRecorder?.mimeType || selectedMimeType || "video/webm";
        let blob = new Blob(chunks, { type: actualMimeType });
        const actualDuration =
          targetDuration > 0 ? targetDuration : originalDuration;

        // 检查文件大小
        if (blob.size > maxFileSize && actualDuration > 5) {
          // 文件太大，需要截断时长
          // 根据当前大小估算需要的时长
          const currentSize = blob.size;
          const targetSize = maxFileSize * 0.9; // 留 10% 余量
          const estimatedDuration = (targetSize / currentSize) * actualDuration;

          // 限制最小 5 秒，避免无限循环
          targetDuration = Math.max(5, Math.floor(estimatedDuration));
          wasTrimmed = true;

          // 重置并重新压缩
          chunks.length = 0;
          void attemptCompression();
        } else {
          // 文件大小符合要求或已经无法再截断
          // 修复 WebM 时长元数据
          if (actualMimeType.includes("webm") && actualDuration > 0) {
            try {
              const fixedBlob = await fixWebmDuration(blob, actualDuration * 1000);
              // fix-webm-duration 返回的是 ArrayBuffer，需要重新包装成 Blob
              blob = new Blob([fixedBlob], { type: "video/webm" });
              console.log("[Video Compression] Fixed WebM duration:", actualDuration, "type:", blob.type);
            } catch (e) {
              console.warn("[Video Compression] Failed to fix WebM duration:", e);
              // 修复失败时保持原始 blob
            }
          }
          resolve({ blob, duration: actualDuration, wasTrimmed });
        }
      };

      mediaRecorder.onerror = (e) => {
        reject(new Error(`MediaRecorder error: ${e}`));
      };

      // 开始录制
      mediaRecorder.start(100);
      recordingStarted = true;

      // 跳转到开始时间
      video.currentTime = effectiveStartTime;

      const drawFrame = () => {
        if (!recordingStarted) return;

        // 检查是否到达结束时间
        if (video.currentTime >= effectiveEndTime || video.ended) {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          video.pause();
          return;
        }

        // 绘制视频帧（保持比例并居中）
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          canvas.width / video.videoWidth,
          canvas.height / video.videoHeight,
        );
        const x = (canvas.width - video.videoWidth * scale) / 2;
        const y = (canvas.height - video.videoHeight * scale) / 2;

        ctx.drawImage(
          video,
          x,
          y,
          video.videoWidth * scale,
          video.videoHeight * scale,
        );

        // 更新进度
        if (onProgress && video.duration) {
          const currentProgress =
            (video.currentTime - effectiveStartTime) /
            (effectiveEndTime - effectiveStartTime);
          const progress = Math.min(currentProgress * 100, 99);
          const step = wasTrimmed ? "trimming" : "compressing";
          onProgress(Math.round(progress), step);
        }

        requestAnimationFrame(drawFrame);
      };

      video.onseeked = () => {
        if (!recordingStarted) return;
        video.play();
      };

      video.onplay = () => {
        drawFrame();
      };

      video.onerror = () => {
        reject(new Error("Failed to play video"));
      };
    };

    video.onloadedmetadata = () => {
      originalDuration = video.duration;
      targetDuration = 0; // 初始使用完整时长
      void attemptCompression();
    };

    video.onerror = () => {
      reject(new Error("Failed to load video for compression"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

// 上传封面帧
async function uploadFrame(dataUrl: string): Promise<string> {
  const file = dataUrlToFile(dataUrl, `cover-${Date.now()}.jpg`);
  const metadata = await buildUploadMetadata([file]);

  const { data } = await uploadControllerUploadFile({
    body: { file, metadata },
  });

  return data?.data?.[0]?.url || "";
}

export default function CreateVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");
  const isEditMode = !!articleId;

  const tPost = useTranslations("createPost");
  const tVideo = useTranslations("createVideo");
  const tTag = useTranslations("tagSelect");

  const [articleLoading, setArticleLoading] = useState(isEditMode);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");
  const [videoItem, setVideoItem] = useState<UploadVideoItem | null>(null);

  const [parentCategories, setParentCategories] = useState<CategoryOption[]>(
    [],
  );
  const [childCategories, setChildCategories] = useState<CategoryOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [initialTagOptions, setInitialTagOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [showChildSelect, setShowChildSelect] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const initialParentCategoriesRef = useRef<CategoryOption[]>([]);
  const childrenMapRef = useRef<Map<number, CategoryOption[]>>(new Map());
  const parentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const childSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const childSearchSeqRef = useRef(0);
  const parentSearchSeqRef = useRef(0);
  const lastParentQueryRef = useRef<string | null>(null);
  const lastChildQueryRef = useRef<string | null>(null);
  const parentSearchAbortControllerRef = useRef<AbortController | null>(null);
  const childSearchAbortControllerRef = useRef<AbortController | null>(null);
  const uploadConfigRef = useRef<{ maxFileSize: number } | null>(null);
  const hasFetchedArticleRef = useRef(false);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isSubmitting,
    handleSubmit,
    setFieldValues,
  } = useForm<CreateVideoFormData>({
    initialValues: {
      title: "",
      content: "",
      categoryId: "",
      tagIds: [],
      tagNames: [],
      cover: "",
      videoUrl: "",
      requireLogin: false,
      requireFollow: false,
      requirePayment: false,
      requireMembership: false,
      listRequireLogin: false,
      viewPrice: 0,
      sort: 0,
      type: "video",
    },
    validationRules: {
      title: {
        required: tPost("form.titleRequired"),
        minLength: { value: 4, message: tPost("form.titleMinLength") },
        maxLength: { value: 200, message: tPost("form.titleMaxLength") },
      },
      content: {
        required: tPost("form.contentRequired"),
        maxLength: { value: 3000, message: "3000 characters maximum" },
      },
      categoryId: { required: tPost("form.categoryRequired") },
    },
    async onSubmit(formValues) {
      // 检查是否选中了封面帧
      const selectedFrame = frames.find((f) => f.id === selectedFrameId);
      if (!selectedFrame && !isEditMode) {
        return;
      }

      let coverUrl = formValues.cover;

      // 如果选中了新的帧，上传作为封面
      if (selectedFrame && !coverUrl) {
        try {
          coverUrl = await uploadFrame(selectedFrame.dataUrl);
        } catch (error) {
          console.error("Failed to upload cover frame:", error);
          return;
        }
      }

      const body = {
        ...formValues,
        cover: coverUrl,
        categoryId: Number(formValues.categoryId),
        sort: 0,
        type: "video" as const,
        tagIds: toNumericTagIds(formValues.tagIds),
        tagNames: formValues.tagNames,
      } as unknown as Parameters<typeof articleControllerCreate>[0]["body"];

      let response;
      let newArticleId: string | undefined;

      try {
        if (isEditMode && articleId) {
          response = await articleControllerUpdate({
            path: { id: articleId },
            body: body as Parameters<typeof articleControllerUpdate>[0]["body"],
          });
          newArticleId = String(response?.data?.data?.data?.id ?? articleId);
        } else {
          response = await articleControllerCreate({ body });
          newArticleId = (response as any)?.data?.data?.id;
        }
      } catch (error) {
        console.error("Failed to submit article:", error);
        throw error;
      }

      // 跳转到详情页或首页
      try {
        if (newArticleId) {
          await router.push(`/article/${newArticleId}`);
        } else {
          await router.push("/");
        }
      } catch {
        // 跳转失败时尝试返回上一页或首页
        try {
          router.back();
        } catch {
          window.location.href = "/";
        }
      }
    },
  });

  // Fetch article data in edit mode
  useEffect(() => {
    if (!isEditMode || !articleId || hasFetchedArticleRef.current) return;

    hasFetchedArticleRef.current = true;

    const fetchArticle = async () => {
      try {
        const response = await articleControllerFindOne({
          path: { id: articleId },
        });
        const article = response.data?.data;
        if (article) {
          const videoUrl = (article as { videoUrl?: string }).videoUrl || "";
          setFieldValues({
            title: article.title || "",
            content: article.content || "",
            categoryId: String(article.category.id || ""),
            tagIds: article.tags?.map((tag) => String(tag.id)) || [],
            tagNames: [],
            cover: article.cover || "",
            videoUrl,
            requireLogin: article.requireLogin || false,
            requireFollow: article.requireFollow || false,
            requirePayment: article.requirePayment || false,
            requireMembership: article.requireMembership || false,
            listRequireLogin: article.listRequireLogin || false,
            viewPrice: Number(article.viewPrice) || 0,
            sort: article.sort || 0,
            type: "video",
          });

          // Set video item if videoUrl exists
          if (videoUrl) {
            setVideoItem({
              id: `video-${Date.now()}`,
              fileName: tVideo("form.existingVideo"),
              remoteUrl: videoUrl,
              status: "ready",
            });
          }

          setInitialTagOptions(
            article.tags?.map((tag) => ({
              value: String(tag.id),
              label: tag.name,
            })) || [],
          );

          // Handle article category
          const category = article.category;
          const parentIdNum = category.parentId;
          const categoryIdStr = String(category.id);

          if (parentIdNum && parentIdNum !== 0) {
            const parentOption: CategoryOption = {
              value: String(parentIdNum),
              label: category.parent?.name || "",
              ...(category.parent?.avatar
                ? { avatar: category.parent.avatar }
                : {}),
            };

            setParentCategories((prev) => {
              if (prev.some((p) => p.value === String(parentIdNum))) {
                return prev;
              }
              const updated = [...prev, parentOption];
              initialParentCategoriesRef.current = updated;
              return updated;
            });

            const childOption: CategoryOption = {
              value: categoryIdStr,
              label: category.name,
              ...(category.avatar ? { avatar: category.avatar } : {}),
            };

            const existingChildren =
              childrenMapRef.current.get(parentIdNum) || [];
            if (!existingChildren.some((c) => c.value === categoryIdStr)) {
              childrenMapRef.current.set(parentIdNum, [
                ...existingChildren,
                childOption,
              ]);
            }

            setSelectedParentId(String(parentIdNum));
            setChildCategories(childrenMapRef.current.get(parentIdNum) || []);
            setShowChildSelect(true);
          } else {
            const parentOption: CategoryOption = {
              value: categoryIdStr,
              label: category.name,
              ...(category.avatar ? { avatar: category.avatar } : {}),
            };

            setParentCategories((prev) => {
              if (prev.some((p) => p.value === categoryIdStr)) return prev;
              const updated = [...prev, parentOption];
              initialParentCategoriesRef.current = updated;
              return updated;
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setArticleLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, isEditMode, setFieldValues]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryControllerFindAll();
        if (response.data?.data?.data) {
          const parents = response.data.data.data
            .filter((cat) => !cat.parentId || cat.parentId === 0)
            .map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              ...(cat.avatar ? { avatar: cat.avatar } : {}),
            }));
          setParentCategories(parents);
          initialParentCategoriesRef.current = parents;

          response.data.data.data.forEach((cat) => {
            if (cat.children && cat.children.length > 0) {
              childrenMapRef.current.set(
                cat.id,
                cat.children.map((child) => ({
                  value: String(child.id),
                  label: child.name,
                  ...(child.avatar ? { avatar: child.avatar } : {}),
                })),
              );
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch upload config on mount
  useEffect(() => {
    const fetchUploadConfig = async () => {
      try {
        const response = await uploadControllerGetUploadConfig({});
        if (response.data?.data) {
          uploadConfigRef.current = {
            maxFileSize: response.data.data.limits.maxFileSize,
          };
        }
      } catch (error) {
        console.error("Failed to fetch upload config:", error);
        // 使用默认值 10MB
        uploadConfigRef.current = { maxFileSize: 10 * 1024 * 1024 };
      }
    };

    void fetchUploadConfig();
  }, []);

  useEffect(() => {
    return () => {
      parentSearchAbortControllerRef.current?.abort();
      childSearchAbortControllerRef.current?.abort();
      if (parentSearchTimerRef.current) {
        clearTimeout(parentSearchTimerRef.current);
      }
      if (childSearchTimerRef.current) {
        clearTimeout(childSearchTimerRef.current);
      }
    };
  }, []);

  // Handle video upload and frame extraction
  const handleVideoUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        return;
      }

      setVideoUploading(true);
      setVideoProcessing(true);
      setProcessingStep("extracting");
      setProcessingProgress(0);

      const newItem: UploadVideoItem = {
        id: `video-${Date.now()}`,
        fileName: file.name,
        status: "uploading",
      };
      setVideoItem(newItem);

      try {
        // 1. 提取帧
        const extractedFrames = await extractVideoFrames(file, 7);
        setFrames(extractedFrames);

        if (extractedFrames.length > 0) {
          setSelectedFrameId(extractedFrames[0].id);
        }

        // 2. 压缩视频
        setProcessingStep("compressing");
        setProcessingProgress(0);

        const maxFileSize =
          uploadConfigRef.current?.maxFileSize || 10 * 1024 * 1024;
        const {
          blob: compressedBlob,
          duration,
          wasTrimmed,
        } = await compressVideoWithFfmpeg(file, maxFileSize, (progress, step) => {
          setProcessingStep(step === "trimming" ? "compressing" : step);
          setProcessingProgress(Math.round(progress));
        });

        // 如果视频被截断了，记录日志（后续可以添加UI提示）
        if (wasTrimmed) {
          console.warn(
            `视频被截断: 原始时长未知 -> ${duration.toFixed(1)}秒 (文件大小限制)`,
          );
        }

        // 3. 上传压缩后的视频
        setProcessingStep("uploading");
        setProcessingProgress(0);

        // 强制使用正确的 MIME 类型
        const finalMimeType = compressedBlob.type?.startsWith("video/")
          ? compressedBlob.type
          : "video/webm";

        // 根据 MIME 类型确定文件扩展名
        const isMP4 = finalMimeType.includes("mp4");
        const fileExt = isMP4 ? ".mp4" : ".webm";
        const baseFileName = file.name.replace(/\.[^/.]+$/, ""); // 移除原扩展名

        // 确保 Blob 有正确的类型
        const typedBlob = compressedBlob.type?.startsWith("video/")
          ? compressedBlob
          : new Blob([compressedBlob], { type: "video/webm" });

        const compressedFile = new File([typedBlob], `${baseFileName}${fileExt}`, {
          type: finalMimeType,
        });

        console.log("[Video Upload] File type:", compressedFile.type, "size:", compressedFile.size);

        const baseMetadata = await buildUploadMetadata([compressedFile]);

        const { data } = await uploadControllerUploadFile({
          body: { file: compressedFile, metadata: baseMetadata },
        });

        const videoUrl = data?.data?.[0]?.url || "";
        setVideoItem((prev) =>
          prev
            ? {
                ...prev,
                remoteUrl: videoUrl,
                status: "ready",
              }
            : null,
        );
        setFieldValues({ videoUrl });
      } catch (error) {
        console.error("Failed to process video:", error);
        setVideoItem(null);
      } finally {
        setVideoUploading(false);
        setVideoProcessing(false);
        setProcessingStep("");
        setProcessingProgress(0);
      }
    },
    [setFieldValues],
  );

  const handleVideoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleVideoUpload(file);
      }
      e.target.value = "";
    },
    [handleVideoUpload],
  );

  // 切换选中的封面帧 - 只更新本地状态，提交时再上传
  const handleFrameSelect = useCallback(
    (frameId: string) => {
      if (frameId === selectedFrameId) return;
      setSelectedFrameId(frameId);
      // 清空已上传的 cover，标记需要重新上传
      setFieldValues({ cover: "" });
    },
    [selectedFrameId, setFieldValues],
  );

  const handleParentCategoryChange = (value: string) => {
    setSelectedParentId(value);
    const parentId = parseInt(value, 10);
    const children = childrenMapRef.current.get(parentId) || [];
    setChildCategories(children);
    setFieldValues({ categoryId: "" });
    setShowChildSelect(children.length > 0);
    lastChildQueryRef.current = null;
  };

  const handleChildCategoryChange = (value: string) => {
    setFieldValues({ categoryId: value });
  };

  const handleTagChange = (value: string[]) => {
    setFieldValues({ tagIds: value });
  };

  const handleTagNameChange = (value: string[]) => {
    setFieldValues({ tagNames: value });
  };

  const removeVideo = () => {
    setVideoItem(null);
    setFrames([]);
    setSelectedFrameId("");
    setFieldValues({ cover: "", videoUrl: "" });
  };

  const contentCharacterCount = values.content.replace(
    /[\s\u3000]+/g,
    "",
  ).length;

  return (
    <div className="page-container">
      <div className="flex-1 max-w-4xl mx-auto bg-card rounded-xl flex flex-col">
        <div className="px-6 h-14 flex items-center border-b border-border">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">
              {isEditMode ? tVideo("editTitle") : tVideo("title")}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="px-4 md:px-6 pb-6">
            {articleLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="ml-2 text-primary">{tPost("loading")}</span>
              </div>
            ) : (
              <Form errors={errors} onSubmit={handleSubmit} touched={touched}>
                {/* Video Upload Section */}
                <FormField
                  name="videoUrl"
                  label={tVideo("form.video")}
                  className="pt-4"
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />

                  {!videoItem ? (
                    <div
                      className={cn(
                        "rounded-xl border-2 border-dashed p-8 transition-colors",
                        "border-border bg-card/40 hover:border-primary hover:bg-primary/5",
                        "flex flex-col items-center justify-center gap-4",
                      )}
                    >
                      <Upload className="size-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {tVideo("form.videoHint")}
                        </p>
                      </div>
                      <label
                        htmlFor="video-upload"
                        className={cn(
                          "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full",
                          "border border-primary px-6 text-sm font-medium text-primary",
                          "transition-colors hover:bg-primary hover:text-white",
                        )}
                      >
                        {tVideo("form.selectVideo")}
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                            {values.cover ? (
                              <Image
                                src={values.cover}
                                alt={videoItem.fileName}
                                fill
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {videoItem.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {videoItem.status === "uploading"
                                ? tVideo("form.uploading")
                                : tVideo("form.ready")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Processing Progress */}
                      {videoProcessing ? (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {processingStep === "extracting" &&
                                tVideo("form.stepExtracting")}
                              {processingStep === "compressing" &&
                                tVideo("form.stepCompressing")}
                              {processingStep === "uploading" &&
                                tVideo("form.stepUploading")}
                            </span>
                            <span className="font-medium text-primary">
                              {processingProgress}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : frames.length > 0 ? (
                        <div className="mt-4">
                          <p className="mb-2 text-sm font-medium">
                            {tVideo("form.selectCover")}
                          </p>
                          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                            {frames.map((frame) => (
                              <button
                                key={frame.id}
                                type="button"
                                onClick={() => handleFrameSelect(frame.id)}
                                className={cn(
                                  "relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
                                  selectedFrameId === frame.id
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border hover:border-primary/50",
                                )}
                              >
                                <Image
                                  src={frame.dataUrl}
                                  alt={`Frame at ${frame.time.toFixed(1)}s`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                                  {frame.time.toFixed(1)}s
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </FormField>

                <FormField
                  name="title"
                  label={tPost("form.title")}
                  className="pt-4"
                >
                  <Input
                    name="title"
                    maxLength={200}
                    onChange={handleChange("title")}
                    onBlur={handleBlur("title")}
                    value={values.title}
                    placeholder={tPost("form.titlePlaceholder")}
                    fullWidth
                    showMaxLength
                    className="block h-14"
                  />
                </FormField>

                <FormField name="content" label={tPost("form.content")}>
                  <div className="relative">
                    <textarea
                      value={values.content}
                      onChange={handleChange("content")}
                      onBlur={handleBlur("content")}
                      placeholder={tPost("form.contentPlaceholder")}
                      maxLength={3000}
                      className={cn(
                        "textarea-resizer min-h-40 w-full rounded-lg border border-border bg-card px-3 py-2 pb-8 text-sm",
                        "placeholder:text-gray-400",
                        "focus:ring-offset-0 outline-none focus:outline-none",
                        "transition-colors duration-200",
                        "focus:ring-primary focus:border-primary hover:border-primary",
                      )}
                    />
                    <div className="pointer-events-none absolute right-3 bottom-3 text-xs text-muted-foreground">
                      {contentCharacterCount}/3000
                    </div>
                  </div>
                </FormField>

                <FormField
                  name="categoryId"
                  label={tPost("form.publishTo")}
                  className="pt-4"
                >
                  <div className="flex items-stretch gap-2">
                    <CategorySelect
                      value={selectedParentId}
                      onChange={handleParentCategoryChange}
                      options={parentCategories}
                      placeholder={tPost("form.selectCategory")}
                      disabled={categoriesLoading}
                      className="flex-1"
                      inputClassName="min-h-12"
                    />
                    {selectedParentId && showChildSelect && (
                      <>
                        <span className="relative w-3 h-full shrink-0 before:absolute mx-1 before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-[#b2bdce]" />
                        <CategorySelect
                          value={values.categoryId}
                          onChange={handleChildCategoryChange}
                          options={childCategories}
                          parentId={selectedParentId}
                          placeholder={tPost("form.selectSubCategory")}
                          className="flex-1"
                          inputClassName="min-h-12"
                        />
                      </>
                    )}
                  </div>
                </FormField>

                <FormField name="tagIds" label={tTag("label")} className="pt-4">
                  <TagSelect
                    value={values.tagIds}
                    onChange={handleTagChange}
                    customValue={values.tagNames}
                    onCustomChange={handleTagNameChange}
                    initialSelectedOptions={initialTagOptions}
                    placeholder={tTag("placeholder")}
                    disabled={false}
                    className="w-full"
                    inputClassName="min-h-12"
                  />
                </FormField>

                <div className="mv-3">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPost("settings.title")}
                  </label>

                  <div className="border border-border p-3 rounded-lg inline-block max-w-100 w-full space-y-2">
                    <FormField name="requireLogin">
                      <div className="flex items-center justify-between">
                        <label className="text-black/65 dark:text-white text-sm">
                          {tPost("settings.requireLogin")}
                        </label>
                        <Switch
                          checked={values.requireLogin}
                          onCheckedChange={(checked) =>
                            setFieldValues({ requireLogin: checked })
                          }
                        />
                      </div>
                    </FormField>

                    <FormField name="requireFollow">
                      <div className="flex items-center justify-between">
                        <label className="text-black/65 dark:text-white text-sm">
                          {tPost("settings.requireFollow")}
                        </label>
                        <Switch
                          checked={values.requireFollow}
                          onCheckedChange={(checked) =>
                            setFieldValues({ requireFollow: checked })
                          }
                        />
                      </div>
                    </FormField>

                    <FormField name="requirePayment">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between w-full">
                          <label className="text-black/65 dark:text-white text-sm">
                            {tPost("settings.requirePayment")}
                          </label>
                          <Switch
                            checked={values.requirePayment}
                            onCheckedChange={(checked) =>
                              setFieldValues({ requirePayment: checked })
                            }
                          />
                        </div>

                        {values.requirePayment && (
                          <div className="mt-2 flex justify-end">
                            <Input
                              className="h-9 w-full max-w-36 text-right tabular-nums"
                              type="number"
                              min={1}
                              step={1}
                              max={999}
                              placeholder={tPost("settings.pricePlaceholder")}
                              value={values.viewPrice}
                              onChange={(value) =>
                                setFieldValues({
                                  viewPrice: Number(value.target.value),
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </FormField>

                    <FormField name="requireMembership">
                      <div className="flex items-center justify-between">
                        <label className="text-black/65 dark:text-white text-sm">
                          {tPost("settings.requireMembership")}
                        </label>
                        <Switch
                          checked={values.requireMembership}
                          onCheckedChange={(checked) =>
                            setFieldValues({ requireMembership: checked })
                          }
                        />
                      </div>
                    </FormField>
                  </div>
                </div>

                <div className="mt-12 max-w-xl mx-auto">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    variant="default"
                    className="h-11 w-full rounded-full"
                    disabled={
                      !videoItem ||
                      videoItem.status === "uploading" ||
                      !selectedFrameId
                    }
                  >
                    {isEditMode
                      ? tPost("actions.update")
                      : tPost("actions.publish")}
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
