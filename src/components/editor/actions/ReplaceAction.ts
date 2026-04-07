import { Action, ToolbarButton } from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { uploadControllerUploadFile } from "@/api/sdk.gen";

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
        const response = await uploadControllerUploadFile({
          body: { file },
        });

        if (response.data?.data?.[0]?.url) {
          img.src = response.data.data[0].url;
        }
      } catch (error) {
      console.error("Upload failed:", error);
      }
    };
  };
}
