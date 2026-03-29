"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "@/hooks/useForm";
import AvatarEditor from "react-avatar-editor";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Editor } from "@/components/ui/Editor";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { CategorySelect, CategoryOption } from "@/components/ui/CategorySelect";
import { TagSelect } from "@/components/ui/TagSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  uploadControllerUploadFile,
  categoryControllerFindAll,
  articleControllerCreate,
  articleControllerFindOne,
  articleControllerUpdate,
} from "@/api";
import { cn } from "@/lib";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { useTranslations } from "next-intl";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

type CreatePostFormData = {
  cover: string;
  title: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  tagNames: string[];
  requireFollow: boolean;
  requirePayment: boolean;
  requireMembership: boolean;
  listRequireLogin: boolean;
  requireLogin: boolean;
  viewPrice: number;
  sort: number;
  type: "mixed" | "image";
};

type CreatePostPageProps = {
  params: Promise<{
    locale: string;
    articleId: string;
  }>;
};

const toNumericTagIds = (value: string[]) =>
  value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

export default function CreatePostPage(_props: CreatePostPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");
  const isEditMode = !!articleId;

  const t = useTranslations("createPost");
  const tc = useTranslations("common");
  const tTag = useTranslations("tagSelect");
  const coverEditorRef = useRef<AvatarEditor>(null);

  // Article loading state for edit mode
  const [articleLoading, setArticleLoading] = useState(isEditMode);

  // Cover editor states
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null,
  );
  const [coverScale, setCoverScale] = useState(1);
  const [coverUploading, setCoverUploading] = useState(false);

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

  // Debounce timers for search，用 ref 避免闭包问题
  const parentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const childSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // 用 ref 跟踪请求序号，丢弃过期响应（防止竞态）
  const childSearchSeqRef = useRef(0);
  const parentSearchSeqRef = useRef(0);

  // 记录上一次实际发起请求的 query，相同值直接跳过
  const lastParentQueryRef = useRef<string | null>(null);
  const lastChildQueryRef = useRef<string | null>(null);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isSubmitting,
    handleSubmit,
    setFieldValues,
  } = useForm<CreatePostFormData>({
    initialValues: {
      cover: "",
      title: "",
      content: "",
      categoryId: "",
      tagIds: [],
      tagNames: [],
      requireLogin: false,
      requireFollow: false,
      requirePayment: false,
      requireMembership: false,
      listRequireLogin: false,
      viewPrice: 0,
      sort: 0,
      type: "mixed",
    },
    validationRules: {
      title: {
        required: t("form.titleRequired"),
        minLength: { value: 4, message: t("form.titleMinLength") },
        maxLength: { value: 200, message: t("form.titleMaxLength") },
      },
      content: { required: t("form.contentRequired") },
      categoryId: { required: t("form.categoryRequired") },
    },
    async onSubmit(values) {
      const body = {
        ...values,
        categoryId: Number(values.categoryId),
        sort: 0,
        type: "mixed" as const,
        tagIds: toNumericTagIds(values.tagIds),
        tagNames: values.tagNames,
      } as unknown as Parameters<typeof articleControllerCreate>[0]["body"];

      if (isEditMode && articleId) {
        await articleControllerUpdate({
          path: { id: articleId },
          body,
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
          // Set form values
          setFieldValues({
            cover: article.cover || "",
            title: article.title || "",
            content: article.content || "",
            categoryId: String(article.category.id || ""),
            tagIds: article.tags?.map((tag) => String(tag.id)) || [],
            tagNames: [],
            requireLogin: article.requireLogin || false,
            requireFollow: article.requireFollow || false,
            requirePayment: article.requirePayment || false,
            requireMembership: article.requireMembership || false,
            listRequireLogin: article.listRequireLogin || false,
            viewPrice: Number(article.viewPrice) || 0,
            sort: article.sort || 0,
            type: (article.type as "mixed" | "image") || "mixed",
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
  }, [isEditMode, articleId, setFieldValues]);

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
      setParentSearching(true);
      try {
        const response = await categoryControllerFindAll({
          query: { name: query },
        });
        // 丢弃过期响应
        if (seq !== parentSearchSeqRef.current) return;
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
        console.error("Failed to search categories:", error);
      } finally {
        if (seq === parentSearchSeqRef.current) {
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
      setChildSearching(true);
      try {
        const parentId = parseInt(selectedParentId, 10);
        const currentSelectedId = values.categoryId;
        const response = await categoryControllerFindAll({
          query: { name: query, parentId },
        });
        // 丢弃过期响应
        if (seq !== childSearchSeqRef.current) return;
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
        console.error("Failed to search child categories:", error);
      } finally {
        if (seq === childSearchSeqRef.current) {
          setChildSearching(false);
        }
      }
    }, 300);
  };

  // Cover handlers
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedCoverImage(file);
    setShowCoverEditor(true);
    setCoverScale(1);
    e.target.value = "";
  };

  const handleCoverWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(coverScale - e.deltaY * 0.001, 1), 3);
    setCoverScale(newScale);
  };

  const handleSaveCover = async () => {
    if (!coverEditorRef.current || !selectedCoverImage) return;
    setCoverUploading(true);
    try {
      const canvas = coverEditorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, "image/png");
      });
      const croppedFile = new File([blob], selectedCoverImage.name, {
        type: "image/png",
      });
      const { data } = await uploadControllerUploadFile({
        bodySerializer: (body) => {
          const formData = new FormData();
          formData.append("file", body.file);
          return formData;
        },
        headers: {
          "Content-Type": null,
        },
        body: { file: croppedFile },
      });
      if (data?.data?.[0]) {
        setFieldValues({ cover: data.data[0].url! });
        setShowCoverEditor(false);
        setSelectedCoverImage(null);
      }
    } catch (error) {
      console.error("Failed to upload cover:", error);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCancelCoverEdit = () => {
    setShowCoverEditor(false);
    setSelectedCoverImage(null);
    setCoverScale(1);
  };

  return (
    <div className="page-container">
      <div className="flex-1 max-w-4xl mx-auto bg-card rounded-xl flex flex-col">
        <div className="px-6 h-14 flex items-center border-b border-border">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">
              {isEditMode ? t("editTitle") : t("title")}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="px-6 pb-6">
            {articleLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="ml-2 text-primary">{t("loading")}</span>
              </div>
            ) : (
              <Form errors={errors} onSubmit={handleSubmit} touched={touched}>
                <FormField
                  name="cover"
                  label={values.cover ? "" : t("cover.upload")}
                  className={cn(!values.cover && "pt-4")}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <div
                    className={cn(
                      "flex items-center gap-4",
                      values.cover && "-mx-6",
                    )}
                  >
                    {values.cover ? (
                      <div className="relative w-full aspect-21/9">
                        <ImageWithFallback
                          fill
                          src={values.cover}
                          alt={t("cover.preview")}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute right-6 bottom-4 flex items-center space-x-6">
                          <label
                            htmlFor="cover-upload"
                            className={cn(
                              "bg-black/65 text-white font-semibold group hover:bg-primary rounded-full",
                              "flex items-center justify-center p-2 cursor-pointer",
                              "outline-0 border-0 focus:outline-0",
                            )}
                          >
                            <Edit size={16} />
                          </label>
                          <button
                            className={cn(
                              "bg-black/65 text-white font-semibold group hover:bg-primary rounded-full",
                              "flex items-center justify-center p-2 cursor-pointer",
                              "outline-0 border-0 focus:outline-0",
                            )}
                            onClick={() => setFieldValues({ cover: "" })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="cover-upload"
                          className={cn(
                            "text-sm cursor-pointer px-4 py-2 text-primary border-primary border rounded-md",
                            "hover:bg-primary hover:text-white",
                          )}
                        >
                          {t("cover.uploadButton")}
                        </label>
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField name="title" label={t("form.title")}>
                  <Input
                    name="title"
                    maxLength={200}
                    onChange={handleChange("title")}
                    onBlur={handleBlur("title")}
                    value={values.title}
                    placeholder={t("form.titlePlaceholder")}
                    fullWidth
                    showMaxLength
                    className="block h-14"
                  />
                </FormField>
                <FormField name="content" label={t("form.content")}>
                  <Editor
                    value={values.content}
                    onChange={(value: string) => {
                      setFieldValues({ content: value });
                    }}
                    placeholder={t("form.contentPlaceholder")}
                    className="min-h-75"
                  />
                </FormField>
                <FormField
                  name="categoryId"
                  label={t("form.publishTo")}
                  className="pt-4"
                >
                  <div className="flex items-center gap-2">
                    <CategorySelect
                      value={selectedParentId}
                      onChange={handleParentCategoryChange}
                      options={parentCategories}
                      placeholder={t("form.selectCategory")}
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
                          placeholder={t("form.selectSubCategory")}
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
                    {t("settings.title")}
                  </label>
                  <div className="border border-border p-3 rounded-lg inline-block max-w-100 w-full space-y-2">
                    <FormField name="requireLogin">
                      <div className="flex items-center justify-between">
                        <label className="text-black/65 dark:text-white text-sm">
                          {t("settings.requireLogin")}
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
                          {t("settings.requireFollow")}
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
                            {t("settings.requirePayment")}
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
                              placeholder={t("settings.pricePlaceholder")}
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
                          {t("settings.requireMembership")}
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
                    {t("actions.preview")}
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    variant="default"
                    className="w-full h-11 rounded-full"
                  >
                    {isEditMode ? t("actions.update") : t("actions.publish")}
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>

      {/* Cover Editor Modal */}
      <Dialog open={showCoverEditor} onOpenChange={setShowCoverEditor}>
        <DialogContent className="max-w-2xl pt-4!">
          <DialogHeader>
            <DialogTitle className="text-sm">{t("cover.crop")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {selectedCoverImage && (
              <>
                <div
                  className="w-full aspect-21/9 overflow-hidden cursor-move touch-none"
                  onWheel={handleCoverWheel}
                >
                  <AvatarEditor
                    ref={coverEditorRef}
                    image={selectedCoverImage}
                    width={840}
                    height={360}
                    border={20}
                    borderRadius={0}
                    color={[0, 0, 0, 0.6]}
                    scale={coverScale}
                    rotate={0}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {t("cover.cropHint")}
                </p>
                <div className="flex gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleCancelCoverEdit}
                    disabled={coverUploading}
                    className="flex-1 rounded-lg h-9"
                  >
                    {tc("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    onClick={handleSaveCover}
                    loading={coverUploading}
                    className="flex-1 rounded-lg h-9"
                  >
                    {tc("confirm")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
