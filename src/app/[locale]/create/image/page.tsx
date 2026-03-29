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
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

const normalizeImageList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
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

async function uploadImagesBatch(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const { data } = await uploadControllerUploadFile({
    bodySerializer: () => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("file", file);
      });
      return formData;
    },
    headers: {
      "Content-Type": null,
    },
    body: { file: files[0] },
  });

  return (data?.data || [])
    .map((item) => sanitizeImageUrl(item.url || ""))
    .filter(Boolean);
}

export default function CreateImagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");
  const isEditMode = !!articleId;

  const tPost = useTranslations("createPost");
  const tImage = useTranslations("createImage");
  const tTag = useTranslations("tagSelect");
  // Article loading state for edit mode
  const [articleLoading, setArticleLoading] = useState(isEditMode);

  const [imagesUploading, setImagesUploading] = useState(false);
  const [isImageDropping, setIsImageDropping] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(
    null,
  );

  // Category states
  const [parentCategories, setParentCategories] = useState<CategoryOption[]>(
    [],
  );
  const [childCategories, setChildCategories] = useState<CategoryOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [initialTagOptions, setInitialTagOptions] = useState<
    { value: string; label: string }[]
  >([]);
  // 独立控制子分类框的显示，不依赖 childCategories.length，避免搜索无结果时隐藏
  const [showChildSelect, setShowChildSelect] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [_parentSearching, setParentSearching] = useState(false);
  const [_childSearching, setChildSearching] = useState(false);

  // Store initial categories and children map in ref to avoid re-fetching
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

  // Debounce timers for search，用 ref 避免闭包问题

  // 用 ref 跟踪请求序号，丢弃过期响应（防止竞态）

  // 记录上一次实际发起请求的 query，相同值直接跳过

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
    async onSubmit(values) {
      const body = {
        ...values,
        categoryId: Number(values.categoryId),
        sort: 0,
        type: "image" as const,
        tagIds: toNumericTagIds(values.tagIds),
        tagNames: values.tagNames,
        images: values.images.map(sanitizeImageUrl),
        content: values.content,
      } as unknown as Parameters<typeof articleControllerCreate>[0]["body"];

      if (isEditMode && articleId) {
        await articleControllerUpdate({
          path: { id: articleId },
          body: body as Parameters<typeof articleControllerUpdate>[0]["body"],
        });
      } else {
        await articleControllerCreate({ body });
      }
      // 返回上一页
      try {
        router.back();
      } catch {
        // 无法返回时重定向首页
        router.push("/");
      }
    },
  });

  // Fetch article data in edit mode
  useEffect(() => {
    if (!isEditMode || !articleId) return;

    const fetchArticle = async () => {
      try {
        const response = await articleControllerFindOne({
          path: { id: articleId },
        });
        const article = response.data?.data;
        if (article) {
          const imageList = normalizeImageList(article.images);

          // Set form values
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
          setInitialTagOptions(
            article.tags?.map((tag) => ({
              value: String(tag.id),
              label: tag.name,
            })) || [],
          );

          // Handle article category - add to lists if not present
          const category = article.category;
          const parentIdNum = category.parentId;
          const categoryIdStr = String(category.id);

          if (parentIdNum && parentIdNum !== 0) {
            // Category is a child - ensure parent and child are in lists
            const parentOption: CategoryOption = {
              value: String(parentIdNum),
              label: category.parent?.name || "",
              ...(category.parent?.avatar
                ? { avatar: category.parent.avatar }
                : {}),
            };

            // Add parent to parentCategories if not present
            setParentCategories((prev) => {
              if (prev.some((p) => p.value === String(parentIdNum)))
                return prev;
              const updated = [...prev, parentOption];
              initialParentCategoriesRef.current = updated;
              return updated;
            });

            // Add child to childrenMap
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

            // Set selected parent and children
            setSelectedParentId(String(parentIdNum));
            setChildCategories(childrenMapRef.current.get(parentIdNum) || []);
            setShowChildSelect(true);
          } else {
            // Category is a parent - ensure it's in parent list
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

  // Handle parent category change
  const handleParentCategoryChange = (value: string) => {
    setSelectedParentId(value);
    const parentId = parseInt(value, 10);
    const children = childrenMapRef.current.get(parentId) || [];
    setChildCategories(children);
    setFieldValues({ categoryId: "" });
    // 有子分类数据时才显示子分类框
    setShowChildSelect(children.length > 0);
    // 重置子分类搜索去重记录
    lastChildQueryRef.current = null;
  };

  // Handle child category change
  const handleChildCategoryChange = (value: string) => {
    setFieldValues({ categoryId: value });
  };

  const handleTagChange = (value: string[]) => {
    setFieldValues({ tagIds: value });
  };

  const handleTagNameChange = (value: string[]) => {
    setFieldValues({ tagNames: value });
  };

  // Search parent categories — debounced 300ms，竞态安全
  const _handleSearchParentCategories = (query: string) => {
    // query 未变化时跳过，防止重渲染引起的重复调用
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
        // 丢弃过期响应
        if (
          seq !== parentSearchSeqRef.current ||
          parentSearchAbortControllerRef.current !== abortController
        )
          return;
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

  // Search child categories — debounced 300ms，竞态安全
  // 搜索无结果时保留子分类框（showChildSelect 不变），仅清空列表
  const _handleSearchChildCategories = (query: string) => {
    if (!selectedParentId) return;

    // query 未变化时跳过，防止重渲染引起的重复调用
    if (query === lastChildQueryRef.current) return;
    lastChildQueryRef.current = query;

    if (childSearchTimerRef.current) {
      clearTimeout(childSearchTimerRef.current);
    }

    if (!query.trim()) {
      // 恢复缓存的子分类列表，同时保留当前已选中项
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
        // 丢弃过期响应
        if (
          seq !== childSearchSeqRef.current ||
          childSearchAbortControllerRef.current !== abortController
        )
          return;
        if (response.data?.data?.data) {
          const results = response.data.data.data
            .filter((cat) => cat.parentId === parentId)
            .map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              ...(cat.avatar ? { avatar: cat.avatar } : {}),
            }));

          // 确保当前选中项始终在列表中，避免选中态丢失
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

          // 无论搜索结果是否为空，都更新列表；showChildSelect 不改变
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

  const handleImagesUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setImagesUploading(true);
    try {
      const uploadedUrls = await uploadImagesBatch(files);

      if (uploadedUrls.length > 0) {
        const mergedImages = Array.from(
          new Set([...values.images, ...uploadedUrls]),
        );
        setFieldValues({
          images: mergedImages,
        });
      }
    } catch (error) {
      console.error("Failed to upload images:", error);
    } finally {
      setImagesUploading(false);
    }
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleImagesUpload(files);
    e.target.value = "";
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageDropping(false);
    const files = Array.from(e.dataTransfer.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    await handleImagesUpload(files);
  };

  const removeImage = (index: number) => {
    const nextImages = values.images.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    setFieldValues({
      images: nextImages,
    });
    setDraggingImageIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextImages = [...values.images];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    setFieldValues({
      images: nextImages,
    });
  };

  const contentCharacterCount = values.content.replace(/[\s\u3000]+/g, "").length;

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
          <div className="px-6 pb-6">
            {articleLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="ml-2 text-primary">{tPost("loading")}</span>
              </div>
            ) : (
              <Form errors={errors} onSubmit={handleSubmit} touched={touched}>
                <FormField name="title" label={tPost("form.title")}>
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
                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
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
                        {values.images.length > 0 &&
                          values.images.map((image: string, index: number) => (
                            <div
                              key={`${image}-${index}`}
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
                              <Image
                                src={image}
                                alt={`${values.title || tImage("title")} ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover"
                              />
                              <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                                #{index + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white hover:bg-primary"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        {imagesUploading && (
                          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/40">
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-[1px]">
                              <Loader2 className="size-5 animate-spin text-primary" />
                              <span className="text-xs text-secondary">
                                {tPost("loading")}
                              </span>
                            </div>
                          </div>
                        )}
                        <label
                          htmlFor="image-upload"
                          className={cn(
                            "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border text-xs",
                            "border-border  bg-muted-foreground text-white",
                            "transition-colors",
                            imagesUploading &&
                              "pointer-events-none opacity-70 hover:bg-transparent",
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
                  <div className="flex items-center gap-2">
                    <CategorySelect
                      value={selectedParentId}
                      onChange={handleParentCategoryChange}
                      options={parentCategories}
                      placeholder={tPost("form.selectCategory")}
                      disabled={categoriesLoading}
                      className="flex-1"
                    />
                    {/* 用独立的 showChildSelect 控制显隐，与搜索结果数量解耦 */}
                    {selectedParentId && showChildSelect && (
                      <>
                        <span className="relative w-3 h-3 shrink-0 before:absolute mx-1 before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-[#b2bdce]" />
                        <CategorySelect
                          value={values.categoryId}
                          onChange={handleChildCategoryChange}
                          options={childCategories}
                          parentId={selectedParentId}
                          placeholder={tPost("form.selectSubCategory")}
                          className="flex-1"
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

                <div className="mt-12 max-w-xl flex justify-center items-center mx-auto gap-8">
                  <Button
                    variant="default"
                    className="w-full h-11 rounded-full"
                  >
                    {tPost("actions.preview")}
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    variant="default"
                    className="w-full h-11 rounded-full"
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
