"use client";

import { collectionControllerUpdate } from "@/api";
import { useRouter } from "@/i18n/routing";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CollectionEditDialog } from "./CollectionEditDialog";

type CollectionDetailEditButtonProps = {
  collection: {
    id: number;
    name: string;
    description?: string;
    isPublic?: boolean;
    avatar?: string;
    cover?: string;
  };
};

export function CollectionDetailEditButton({
  collection,
}: CollectionDetailEditButtonProps) {
  const t = useTranslations("accountCollectionList");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: {
    name: string;
    description: string;
    isPublic: boolean;
    avatar: string;
    cover: string;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      await collectionControllerUpdate({
        path: { id: collection.id },
        body: {
          name: values.name,
          description: values.description || undefined,
          isPublic: values.isPublic,
          avatar: values.avatar || undefined,
          cover: values.cover || undefined,
        },
      });

      setOpen(false);
      router.refresh();
    } catch (updateCollectionError) {
      console.error("Failed to update collection:", updateCollectionError);
      setError(t("dialog.edit.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full p-2"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={t("editButton")}
      >
        <Pencil className="size-4" />
      </Button>

      <CollectionEditDialog
        open={open}
        mode="edit"
        loading={submitting}
        error={error}
        initialValues={{
          name: collection.name,
          description: collection.description || "",
          isPublic: Boolean(collection.isPublic),
          avatar: collection.avatar || "",
          cover: collection.cover || "",
        }}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setError(null);
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
