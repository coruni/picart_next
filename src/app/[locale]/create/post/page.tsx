"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "@/hooks/useForm";
import AvatarEditor from "react-avatar-editor";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Editor } from "@/components/ui/Editor";
import { Button } from "@/components/ui/Button";
import { CategorySelect, CategoryOption } from "@/components/ui/CategorySelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { uploadControllerUploadFile, categoryControllerFindAll } from "@/api";
import Image from "next/image";
import { cn } from "@/lib";
import { Edit, Trash2 } from "lucide-react";

type CreatePostFormData = {
  cover: string;
  title: string;
  content: string;
  categoryId: string;
};

type CreatePostPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

// 生成metadata

export default function CreatePostPage(props: CreatePostPageProps) {
  const coverEditorRef = useRef<AvatarEditor>(null);

  // Cover editor states
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null,
  );
  const [coverScale, setCoverScale] = useState(1);
  const [coverUploading, setCoverUploading] = useState(false);

  // Category states
  const [parentCategories, setParentCategories] = useState<CategoryOption[]>([]);
  const [childCategories, setChildCategories] = useState<CategoryOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [parentSearching, setParentSearching] = useState(false);
  const [childSearching, setChildSearching] = useState(false);

  // Store initial categories and children map in ref to avoid re-fetching
  const initialParentCategoriesRef = useRef<CategoryOption[]>([]);
  const childrenMapRef = useRef<Map<number, CategoryOption[]>>(new Map());

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
    },
    validationRules: {
      title: {
        required: "请输入帖子标题",
        minLength: { value: 4, message: "标题至少4个字符" },
        maxLength: { value: 200, message: "标题最长200个字符" },
      },
      content: { required: "请输入帖子内容" },
      categoryId: { required: "请选择帖子分类" },
    },
    async onSubmit(values) {
      console.log("提交表单:", values);
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryControllerFindAll();
        if (response.data?.data?.data) {
          // 只获取父分类（parentId 为 0 或 null）
          const parents = response.data.data.data
            .filter((cat) => !cat.parentId || cat.parentId === 0)
            .map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              avatar: cat.avatar || undefined,
            }));
          setParentCategories(parents);
          // 缓存初始父分类
          initialParentCategoriesRef.current = parents;

          // 存储所有分类的 children 映射
          response.data.data.data.forEach((cat) => {
            if (cat.children && cat.children.length > 0) {
              childrenMapRef.current.set(
                cat.id,
                cat.children.map((child) => ({
                  value: String(child.id),
                  label: child.name,
                  avatar: child.avatar || undefined,
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
    // 获取子分类
    const parentId = parseInt(value, 10);
    const children = childrenMapRef.current.get(parentId) || [];
    setChildCategories(children);
    // 重置子分类选择
    setFieldValues({ categoryId: "" });
  };

  // Handle child category change
  const handleChildCategoryChange = (value: string) => {
    setFieldValues({ categoryId: value });
  };

  // Search parent categories
  const handleSearchParentCategories = async (query: string) => {
    if (!query.trim()) {
      // 如果搜索词为空，使用缓存的初始父分类
      setParentCategories(initialParentCategoriesRef.current);
      return;
    }

    setParentSearching(true);
    try {
      const response = await categoryControllerFindAll({
        query: { name: query },
      });
      if (response.data?.data?.data) {
        const parents = response.data.data.data
          .filter((cat) => !cat.parentId || cat.parentId === 0)
          .map((cat) => ({
            value: String(cat.id),
            label: cat.name,
            avatar: cat.avatar || undefined,
          }));
        setParentCategories(parents);
      }
    } catch (error) {
      console.error("Failed to search categories:", error);
    } finally {
      setParentSearching(false);
    }
  };

  // Search child categories
  const handleSearchChildCategories = async (query: string) => {
    if (!selectedParentId) return;

    if (!query.trim()) {
      // 如果搜索词为空，恢复缓存的子分类
      const parentId = parseInt(selectedParentId, 10);
      const children = childrenMapRef.current.get(parentId) || [];
      setChildCategories(children);
      return;
    }

    setChildSearching(true);
    try {
      const parentId = parseInt(selectedParentId, 10);
      const response = await categoryControllerFindAll({
        query: { name: query, parentId },
      });
      if (response.data?.data?.data) {
        // 搜索结果是父分类，需要从 children 中过滤
        const parent = response.data.data.data.find(
          (cat) => cat.id === parentId,
        );
        if (parent?.children) {
          const filteredChildren = parent.children
            .filter((child) =>
              child.name.toLowerCase().includes(query.toLowerCase()),
            )
            .map((child) => ({
              value: String(child.id),
              label: child.name,
              avatar: child.avatar || undefined,
            }));
          setChildCategories(filteredChildren);
        } else {
          setChildCategories([]);
        }
      }
    } catch (error) {
      console.error("Failed to search child categories:", error);
    } finally {
      setChildSearching(false);
    }
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
        body: {
          file: croppedFile,
        },
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
            <span className="font-bold text-base pr-6">发布帖子</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="px-6 pb-6">
            <Form errors={errors} onSubmit={handleSubmit} touched={touched}>
              <FormField
                name="cover"
                label={values.cover ? "" : "上传封面"}
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
                    <div className="relative w-full aspect-21/9 ">
                      <Image
                        fill
                        src={values.cover}
                        alt="封面预览"
                        className="w-full h-full object-cover"
                      />
                      <div className=" absolute right-6 bottom-4 flex items-center space-x-6">
                        <div
                          className={cn(
                            "bg-black/65 text-white font-semibold group hover:bg-primary rounded-full",
                            "flex items-center justify-center p-2 cursor-pointer",
                          )}
                        >
                          <Edit size={16} />
                        </div>
                        <div
                          className={cn(
                            "bg-black/65 text-white font-semibold group hover:bg-primary rounded-full",
                            "flex items-center justify-center p-2 cursor-pointer",
                          )}
                        >
                          <Trash2 size={16} />
                        </div>
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
                        封面上传
                      </label>
                    </div>
                  )}
                </div>
              </FormField>
              <FormField name="title" label="标题">
                <Input
                  name="title"
                  maxLength={200}
                  onChange={handleChange("title")}
                  onBlur={handleBlur("title")}
                  value={values.title}
                  placeholder="请输入标题"
                  fullWidth
                  showMaxLength
                  className="block h-14"
                />
              </FormField>
              <FormField name="content" label="内容">
                <Editor
                  value={values.content}
                  onChange={(value: string) => {
                    setFieldValues({ content: value });
                  }}
                  placeholder="请输入帖子内容"
                  className="min-h-75"
                />
              </FormField>
              <FormField
                name="categoryId"
                label="发布至"
                className="pt-4">
                <div className="flex items-center gap-2">
                  <CategorySelect
                    value={selectedParentId}
                    onChange={handleParentCategoryChange}
                    options={parentCategories}
                    placeholder="选择分类"
                    disabled={categoriesLoading}
                    loading={parentSearching}
                    onSearch={handleSearchParentCategories}
                    className="flex-1"
                  />
                  {selectedParentId && childCategories.length > 0 && (
                    <>
                      <span className="relative w-3 h-3 shrink-0 before:absolute mx-1 before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-[#b2bdce]" />
                      <CategorySelect
                        value={values.categoryId}
                        onChange={handleChildCategoryChange}
                        options={childCategories}
                        placeholder="选择子分类"
                        loading={childSearching}
                        onSearch={handleSearchChildCategories}
                        className="flex-1"
                      />
                    </>
                  )}
                </div>
              </FormField>
            </Form>
          </div>
        </div>
      </div>

      {/* Cover Editor Modal */}
      <Dialog open={showCoverEditor} onOpenChange={setShowCoverEditor}>
        <DialogContent className="max-w-2xl pt-4!">
          <DialogHeader>
            <DialogTitle className="text-sm">裁剪封面</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {selectedCoverImage && (
              <>
                {/* Crop area */}
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
                  滚轮缩放 · 拖动调整位置
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
                    取消
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    onClick={handleSaveCover}
                    loading={coverUploading}
                    className="flex-1 rounded-lg h-9"
                  >
                    确定
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
