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
import { cn, showToast, getErrorMessage } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

// Extract preview frames from the uploaded video.
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
    let isSeeking = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 设置超时处理
    const setLoadingTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("视频预览提取超时"));
      }, 30000); // 30秒超时
    };

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      video.src = "";
      video.load();
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    // 视频可以播放时触发
    video.oncanplay = () => {
      if (isSeeking) return;
      isSeeking = true;

      // 计算提取时间点：跳过前10%防止首帧黑屏内容，均匀分布
      const duration = video.duration;
      if (!duration || duration === Infinity) {
        cleanup();
        reject(new Error("无法获取视频时长"));
        return;
      }

      const skipStart = duration * 0.1;
      const usableDuration = duration - skipStart;
      const interval = usableDuration / frameCount;

      // 限制预览帧最大分辨率，提高性能
      const maxPreviewWidth = 480;
      const scale = Math.min(1, maxPreviewWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const captureFrame = (index: number) => {
        if (index >= frameCount) {
          cleanup();
          resolve(frames);
          return;
        }

        const time = skipStart + index * interval;
        video.currentTime = time;
      };

      video.onseeked = () => {
        setLoadingTimeout();
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

          frames.push({
            id: `frame-${frameIndex}-${Date.now()}`,
            dataUrl,
            time: video.currentTime,
          });

          frameIndex++;
          captureFrame(frameIndex);
        } catch {
          cleanup();
          reject(new Error("绘制视频帧失败"));
        }
      };

      // 开始捕获第一帧
      captureFrame(0);
    };

    video.onloadedmetadata = () => {
      setLoadingTimeout();
      // 某些浏览器需要显式调用 play/pause 来确保 canplay 触发
      video
        .play()
        .then(() => {
          video.pause();
        })
        .catch(() => {
          // play 失败也没关系，继续等待 canplay
        });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("视频加载失败"));
    };

    // 设置视频源
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    video.load();
  });
}

// 灏?dataURL 杞崲涓?File
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

// Upload cover image selected from extracted frames.
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
  const uploadConfigRef = useRef<{
    maxFileSize: number;
    maxVideoFileSize: number;
  } | null>(null);
  const [maxVideoSize, setMaxVideoSize] = useState<string>("100MB");
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
      // 妫€鏌ユ槸鍚﹂€変腑浜嗗皝闈㈠抚
      const selectedFrame = frames.find((f) => f.id === selectedFrameId);
      if (!selectedFrame && !isEditMode) {
        return;
      }

      let coverUrl = formValues.cover;

      // Upload the selected frame as cover when needed.
      if (selectedFrame && !coverUrl) {
        try {
          coverUrl = await uploadFrame(selectedFrame.dataUrl);
        } catch (error) {
          console.error("Failed to upload cover frame:", error);
          showToast(getErrorMessage(error, "封面上传失败"));
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
        showToast(getErrorMessage(error, "提交失败"));
        throw error;
      }

      // Navigate to the article or fallback route after submit.
      try {
        if (newArticleId) {
          await router.push(`/article/${newArticleId}`);
        } else {
          await router.push("/");
        }
      } catch {
        // 璺宠浆澶辫触鏃跺皾璇曡繑鍥炰笂涓€椤垫垨棣栭〉
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
          const limits = response.data.data.limits;
          const videoSizeBytes = limits.maxSize.video.bytes;
          uploadConfigRef.current = {
            maxFileSize: limits.maxSize.image.bytes,
            maxVideoFileSize: videoSizeBytes,
          };
          // 转换为 MB 显示
          const sizeInMB = Math.round(videoSizeBytes / (1024 * 1024));
          setMaxVideoSize(`${sizeInMB}MB`);
        }
      } catch (error) {
        console.error("Failed to fetch upload config:", error);
        // 使用默认值
        uploadConfigRef.current = {
          maxFileSize: 10 * 1024 * 1024,
          maxVideoFileSize: 100 * 1024 * 1024,
        };
        setMaxVideoSize("100MB");
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
        const extractedFrames = await extractVideoFrames(file, 7);
        setFrames(extractedFrames);

        if (extractedFrames.length > 0) {
          setSelectedFrameId(extractedFrames[0].id);
        }

        setProcessingStep("uploading");
        setProcessingProgress(0);

        const metadata = await buildUploadMetadata([file]);
        const { data } = await uploadControllerUploadFile({
          body: { file, metadata },
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
        showToast(getErrorMessage(error, "视频处理失败"));
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

  // 鍒囨崲閫変腑鐨勫皝闈㈠抚 - 鍙洿鏂版湰鍦扮姸鎬侊紝鎻愪氦鏃跺啀涓婁紶
  const handleFrameSelect = useCallback(
    (frameId: string) => {
      if (frameId === selectedFrameId) return;
      setSelectedFrameId(frameId);
      // 娓呯┖宸蹭笂浼犵殑 cover锛屾爣璁伴渶瑕侀噸鏂颁笂浼?      setFieldValues({ cover: "" });
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
                        <p className="text-xs text-muted-foreground/60">
                          {tVideo("form.maxVideoSize", { size: maxVideoSize })}
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
                            {values.cover && (
                              <Image
                                src={values.cover}
                                alt={videoItem.fileName}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm line-clamp-1 text-ellipsis">
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
