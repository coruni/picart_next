"use client";

import {
  articleControllerCreate,
  articleControllerFindOne,
  articleControllerUpdate,
  categoryControllerFindAll,
  uploadControllerUploadFile,
} from "@/api";
import { Button } from "@/components/ui/Button";
import { CategoryOption, CategorySelect } from "@/components/ui/CategorySelect";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { TagSelect } from "@/components/ui/TagSelect";
import { useForm } from "@/hooks/useForm";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { getImageUrls, type ImageInfo } from "@/types/image";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type CreateImageFormData = {
  title: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  tagNames: string[];
  images: string[];
  requireFollow: boolean;
  requirePayment: boolean;
  requireMembership: boolean;
  listRequireLogin: boolean;
  requireLogin: boolean;
  viewPrice: number;
  sort: number;
  type: "image";
};

type UploadImageItem = {
  id: string;
  fileName: string;
  previewUrl?: string;
  remoteUrl?: string;
  status: "uploading" | "ready";
  remoteLoaded: boolean;
};

const normalizeImageList = (value: unknown): string[] => {
  if (Array.isArray(value) && value.length > 0) {
    const isImageInfoArray = value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        ("url" in item || "original" in item || "thumbnails" in item),
    );
    if (isImageInfoArray) {
      return getImageUrls(value as ImageInfo[], "original");
    }

    return value
      .filter((item): item is string => typeof item === "string" && !!item)
      .map((item) => item.trim().replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, ""));
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const isImageInfoArray = parsed.every(
        (item) =>
          item &&
          typeof item === "object" &&
          ("url" in item || "original" in item || "thumbnails" in item),
      );
      if (isImageInfoArray) {
        return getImageUrls(parsed as ImageInfo[], "original");
      }

      return parsed
        .filter((item): item is string => typeof item === "string" && !!item)
        .map((item) => item.trim().replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, ""));
    }
  } catch {
    // fallback to comma-separated strings
  }

  return value
    .split(",")
    .map((item) => item.trim().replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, ""))
    .filter(Boolean);
};

const sanitizeImageUrl = (value: string) =>
  value.trim().replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, "");

const toNumericTagIds = (value: string[]) =>
  value.map((item) => Number(item)).filter((item) => Number.isFinite(item));

async function uploadImagesBatch(
  files: File[],
  compressImages: (files: File[]) => Promise<{ file: File }[]>,
): Promise<string[]> {
  if (files.length === 0) return [];

  const metadata = await buildUploadMetadata(files);
  const compressionResults = await compressImages(files);
  const compressedFiles = compressionResults.map((r) => r.file);

  const { data } = await uploadControllerUploadFile({
    body: { file: compressedFiles as any, metadata },
  });

  return (data?.data || [])
    .map((item) => sanitizeImageUrl(item.url || ""))
    .filter(Boolean);
}

function createImageItemId(index: number) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${index}-${Math.random()}`;
}

export default function CreateImagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");
  const isEditMode = !!articleId;

  const tPost = useTranslations("createPost");
  const tImage = useTranslations("createImage");
  const tTag = useTranslations("tagSelect");
  const { compressImages } = useImageCompression();

  const [articleLoading, setArticleLoading] = useState(isEditMode);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [imageItems, setImageItems] = useState<UploadImageItem[]>([]);
  const [isImageDropping, setIsImageDropping] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(
    null,
  );

  const [parentCategories, setParentCategories] = useState<CategoryOption[]>([]);
  const [childCategories, setChildCategories] = useState<CategoryOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [initialTagOptions, setInitialTagOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [showChildSelect, setShowChildSelect] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [_parentSearching, setParentSearching] = useState(false);
  const [_childSearching, setChildSearching] = useState(false);

  const initialParentCategoriesRef = useRef<CategoryOption[]>([]);
  const childrenMapRef = useRef<Map<number, CategoryOption[]>>(new Map());
  const parentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const childSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const childSearchSeqRef = useRef(0);
  const parentSearchSeqRef = useRef(0);
  const lastParentQueryRef = useRef<string | null>(null);
  const lastChildQueryRef = useRef<string | null>(null);
  const parentSearchAbortControllerRef = useRef<AbortController | null>(null);
  const childSearchAbortControllerRef = useRef<AbortController | null>(null);
  const imageItemsRef = useRef<UploadImageItem[]>([]);
  const articleFetchedRef = useRef(false);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isSubmitting,
    handleSubmit,
    setFieldValues,
  } = useForm<CreateImageFormData>({
    initialValues: {
      title: "",
      content: "",
      categoryId: "",
      tagIds: [],
      tagNames: [],
      images: [],
      requireLogin: false,
      requireFollow: false,
      requirePayment: false,
      requireMembership: false,
      listRequireLogin: false,
      viewPrice: 0,
      sort: 0,
      type: "image",
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
      images: {
        validate: (value) =>
          Array.isArray(value) && value.length > 0
            ? true
            : tImage("form.imagesRequired"),
      },
    },
    async onSubmit(formValues) {
      const body = {
        ...formValues,
        categoryId: Number(formValues.categoryId),
        sort: 0,
        type: "image" as const,
        tagIds: toNumericTagIds(formValues.tagIds),
        tagNames: formValues.tagNames,
        images: formValues.images.map(sanitizeImageUrl),
        content: formValues.content,
      } as unknown as Parameters<typeof articleControllerCreate>[0]["body"];

      let response;
      let newArticleId: string | undefined;

      try {
        if (isEditMode && articleId) {
          response = await articleControllerUpdate({
            path: { id: articleId },
            body: body as Parameters<typeof articleControllerUpdate>[0]["body"],
          });
          newArticleId = String(response.data?.data?.data?.id ?? articleId);
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

  const syncFormImagesFromItems = useCallback(
    (items: UploadImageItem[]) => {
      const readyImages = items
        .filter((item) => item.status === "ready" && item.remoteUrl)
        .map((item) => item.remoteUrl as string);

      setFieldValues({
        images: readyImages,
      });
    },
    [setFieldValues],
  );

  useEffect(() => {
    if (!isEditMode || !articleId || articleFetchedRef.current) return;

    const fetchArticle = async () => {
      try {
        articleFetchedRef.current = true;
        const response = await articleControllerFindOne({
          path: { id: articleId },
        });
        const article = response.data?.data;
        if (article) {
          const imageList = normalizeImageList(article.images);

          setFieldValues({
            title: article.title || "",
            content: article.content || "",
            categoryId: String(article.category.id || ""),
            tagIds: article.tags?.map((tag) => String(tag.id)) || [],
            tagNames: [],
            images: imageList,
            requireLogin: article.requireLogin || false,
            requireFollow: article.requireFollow || false,
            requirePayment: article.requirePayment || false,
            requireMembership: article.requireMembership || false,
            listRequireLogin: article.listRequireLogin || false,
            viewPrice: Number(article.viewPrice) || 0,
            sort: article.sort || 0,
            type: "image",
          });

          setImageItems(
            imageList.map((url, index) => ({
              id: `server-${index}-${url}`,
              fileName: `image-${index + 1}`,
              remoteUrl: url,
              status: "ready" as const,
              remoteLoaded: true,
            })),
          );

          setInitialTagOptions(
            article.tags?.map((tag) => ({
              value: String(tag.id),
              label: tag.name,
            })) || [],
          );

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

  useEffect(() => {
    imageItemsRef.current = imageItems;
  }, [imageItems]);

  useEffect(() => {
    return () => {
      parentSearchAbortControllerRef.current?.abort();
      childSearchAbortControllerRef.current?.abort();

      imageItemsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      if (parentSearchTimerRef.current) {
        clearTimeout(parentSearchTimerRef.current);
      }
      if (childSearchTimerRef.current) {
        clearTimeout(childSearchTimerRef.current);
      }
    };
  }, []);

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

  const _handleSearchParentCategories = (query: string) => {
    if (query === lastParentQueryRef.current) return;
    lastParentQueryRef.current = query;

    if (parentSearchTimerRef.current) {
      clearTimeout(parentSearchTimerRef.current);
    }

    if (!query.trim()) {
      setParentCategories(initialParentCategoriesRef.current);
      return;
    }

    parentSearchTimerRef.current = setTimeout(async () => {
      const seq = ++parentSearchSeqRef.current;
      parentSearchAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      parentSearchAbortControllerRef.current = abortController;
      setParentSearching(true);

      try {
        const response = await categoryControllerFindAll({
          query: { name: query },
          signal: abortController.signal,
        });

        if (
          seq !== parentSearchSeqRef.current ||
          parentSearchAbortControllerRef.current !== abortController
        ) {
          return;
        }

        if (response.data?.data?.data) {
          const parents = response.data.data.data
            .filter((cat) => !cat.parentId || cat.parentId === 0)
            .map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              ...(cat.avatar ? { avatar: cat.avatar } : {}),
            }));
          setParentCategories(parents);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error("Failed to search categories:", error);
      } finally {
        if (
          seq === parentSearchSeqRef.current &&
          parentSearchAbortControllerRef.current === abortController
        ) {
          parentSearchAbortControllerRef.current = null;
          setParentSearching(false);
        }
      }
    }, 300);
  };

  const _handleSearchChildCategories = (query: string) => {
    if (!selectedParentId) return;

    if (query === lastChildQueryRef.current) return;
    lastChildQueryRef.current = query;

    if (childSearchTimerRef.current) {
      clearTimeout(childSearchTimerRef.current);
    }

    if (!query.trim()) {
      const parentId = parseInt(selectedParentId, 10);
      const cached = childrenMapRef.current.get(parentId) || [];
      const currentSelectedId = values.categoryId;

      if (
        currentSelectedId &&
        !cached.find((c) => c.value === currentSelectedId)
      ) {
        const selectedChild = childCategories.find(
          (c) => c.value === currentSelectedId,
        );
        if (selectedChild) {
          setChildCategories([...cached, selectedChild]);
          return;
        }
      }

      setChildCategories(cached);
      return;
    }

    childSearchTimerRef.current = setTimeout(async () => {
      const seq = ++childSearchSeqRef.current;
      childSearchAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      childSearchAbortControllerRef.current = abortController;
      setChildSearching(true);

      try {
        const parentId = parseInt(selectedParentId, 10);
        const currentSelectedId = values.categoryId;

        const response = await categoryControllerFindAll({
          query: { name: query, parentId },
          signal: abortController.signal,
        });

        if (
          seq !== childSearchSeqRef.current ||
          childSearchAbortControllerRef.current !== abortController
        ) {
          return;
        }

        if (response.data?.data?.data) {
          const results = response.data.data.data
            .filter((cat) => cat.parentId === parentId)
            .map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              ...(cat.avatar ? { avatar: cat.avatar } : {}),
            }));

          if (
            currentSelectedId &&
            !results.find((c) => c.value === currentSelectedId)
          ) {
            const selectedChild = childCategories.find(
              (c) => c.value === currentSelectedId,
            );
            if (selectedChild) {
              results.push(selectedChild);
            }
          }

          setChildCategories(results);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error("Failed to search child categories:", error);
      } finally {
        if (
          seq === childSearchSeqRef.current &&
          childSearchAbortControllerRef.current === abortController
        ) {
          childSearchAbortControllerRef.current = null;
          setChildSearching(false);
        }
      }
    }, 300);
  };

  const _handleRemoteImageReady = useCallback((itemId: string) => {
    setImageItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;

        if (item.previewUrl) {
          window.setTimeout(() => {
            URL.revokeObjectURL(item.previewUrl as string);
          }, 180);
        }

        return {
          ...item,
          remoteLoaded: true,
          previewUrl: undefined,
          status: "ready",
        };
      }),
    );
  }, []);

  const handleImagesUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || imagesUploading) return;

      const newItems: UploadImageItem[] = files.map((file, index) => ({
        id: createImageItemId(index),
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        remoteLoaded: false,
      }));

      setImageItems((current) => [...current, ...newItems]);
      setImagesUploading(true);

      try {
        const uploadedUrls = await uploadImagesBatch(files, compressImages);

        setImageItems((current) => {
          const next = [...current];

          newItems.forEach((newItem, index) => {
            const targetIndex = next.findIndex((item) => item.id === newItem.id);
            if (targetIndex === -1) return;

            const remoteUrl = uploadedUrls[index];
            if (!remoteUrl) {
              if (next[targetIndex].previewUrl) {
                URL.revokeObjectURL(next[targetIndex].previewUrl as string);
              }
              next.splice(targetIndex, 1);
              return;
            }

            next[targetIndex] = {
              ...next[targetIndex],
              remoteUrl,
              status: "ready",
              remoteLoaded: true,
            };
          });

          syncFormImagesFromItems(next);
          return next;
        });
      } catch (error) {
        console.error("Failed to upload images:", error);

        setImageItems((current) => {
          const next = current.filter((item) => {
            const shouldRemove = newItems.some((newItem) => newItem.id === item.id);
            if (shouldRemove && item.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
            return !shouldRemove;
          });

          syncFormImagesFromItems(next);
          return next;
        });
      } finally {
        setImagesUploading(false);
      }
    },
    [compressImages, imagesUploading, syncFormImagesFromItems],
  );

  const handleImagesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await handleImagesUpload(files);
      e.target.value = "";
    },
    [handleImagesUpload],
  );

  const handleImageDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsImageDropping(false);

      // 如果是内部拖拽排序（dataTransfer 包含 text/plain 类型的索引），不处理上传
      const dragData = e.dataTransfer.getData("text/plain");
      if (dragData && !Number.isNaN(Number(dragData))) {
        return;
      }

      const files = Array.from(e.dataTransfer.files || []).filter((file) =>
        file.type.startsWith("image/"),
      );
      await handleImagesUpload(files);
    },
    [handleImagesUpload],
  );

  const removeImage = (index: number) => {
    setImageItems((current) => {
      const target = current[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const next = current.filter((_, currentIndex) => currentIndex !== index);
      syncFormImagesFromItems(next);
      return next;
    });

    setDraggingImageIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImageItems((current) => {
      const next = [...current];
      const [movedImage] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedImage);
      syncFormImagesFromItems(next);
      return next;
    });
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
              {isEditMode ? tImage("editTitle") : tImage("title")}
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
                  name="images"
                  label={tImage("form.images")}
                  className="pt-2"
                >
                  <p className="mb-2 text-xs text-secondary">
                    {tImage("form.imagesHint")}
                  </p>

                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                      id="image-upload"
                    />

                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsImageDropping(true);
                      }}
                      onDragLeave={() => setIsImageDropping(false)}
                      onDrop={handleImageDrop}
                      className={cn(
                        "rounded-xl border-2 border-dashed p-4 transition-colors",
                        isImageDropping
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card/40",
                      )}
                    >
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {imageItems.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData(
                                "text/plain",
                                String(index),
                              );
                              setDraggingImageIndex(index);
                            }}
                            onDragEnd={() => setDraggingImageIndex(null)}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              const fromIndex = Number(
                                event.dataTransfer.getData("text/plain"),
                              );
                              if (Number.isNaN(fromIndex)) return;
                              moveImage(fromIndex, index);
                              setDraggingImageIndex(null);
                            }}
                            className={cn(
                              "relative aspect-square overflow-hidden rounded-xl border border-border transition-transform",
                              draggingImageIndex === index &&
                                "scale-[0.98] opacity-70",
                            )}
                          >
                            {item.previewUrl ? (
                              <Image
                                src={item.previewUrl}
                                alt={`${item.fileName} ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover"
                                unoptimized
                              />
                            ) : item.remoteUrl ? (
                              <Image
                                src={item.remoteUrl}
                                alt={`${item.fileName} ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover"
                              />
                            ) : null}

                            <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                              #{index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white hover:bg-primary"
                            >
                              <Trash2 size={14} />
                            </button>

                            {item.status === "uploading" && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 backdrop-blur-[2px]">
                                <Loader2 className="size-5 animate-spin text-primary" />
                                <span className="max-w-[80%] truncate text-xs text-secondary">
                                  {item.fileName}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        <label
                          htmlFor="image-upload"
                          className={cn(
                            "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border text-xs",
                            "border-border bg-muted-foreground text-white",
                            "transition-colors",
                            imagesUploading &&
                              "pointer-events-none opacity-70 cursor-not-allowed",
                          )}
                        >
                          <Plus className="size-6" />
                          {imagesUploading
                            ? tPost("loading")
                            : tImage("form.imagesPlaceholder")}
                        </label>
                      </div>
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