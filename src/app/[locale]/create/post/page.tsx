"use client";

import { useState, useRef } from "react";
import { useForm } from "@/hooks/useForm";
import AvatarEditor from "react-avatar-editor";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { uploadControllerUploadFile } from "@/api";
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
          <div className="px-6">
            <Form errors={errors} onSubmit={handleSubmit} touched={touched}>
              <FormField name="cover" label={values.cover ? "" : "上传封面"}>
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
                <div></div>
              </FormField>

              {/* <div className="pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "发布帖子"}
                </Button>
              </div> */}
            </Form>
          </div>
        </div>
      </div>

      {/* Cover Editor Modal */}
      <Dialog open={showCoverEditor} onOpenChange={setShowCoverEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>裁剪封面</DialogTitle>
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
