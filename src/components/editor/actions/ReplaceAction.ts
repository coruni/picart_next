import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { uploadControllerUploadFile } from "@/api/sdk.gen";
import { showToast, getErrorMessage } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";

export class ReplaceAction extends Action {
  constructor(formatter: BlotFormatter) {
    super(formatter);
    this.toolbarButtons = [
      new ToolbarButton(
        "replace",
        this.onClickHandler,
        this.formatter.options.toolbar,
      ),
    ];
  }

  onClickHandler: EventListener = () => {
    const img =
      this.formatter.currentSpec?.getTargetElement() as HTMLImageElement;
    if (!img) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // 计算文件的 hash
        const metadata = await buildUploadMetadata([file]);

        const response = await uploadControllerUploadFile({
          body: { file, metadata },
        });

        if (response.data?.data?.[0]?.url) {
          const uploadedUrl = response.data.data[0].url;
          if (uploadedUrl.includes("/images/blocked.webp")) {
            showToast("图片上传失败");
            return;
          }
          img.src = uploadedUrl;
        }
      } catch (error) {
        console.error("Upload failed:", error);
        showToast(getErrorMessage(error, "上传失败"));
      }
    };
  };
}
