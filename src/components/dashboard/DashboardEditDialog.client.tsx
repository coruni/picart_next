"use client";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";

type DashboardEditFieldType = "text" | "textarea" | "number" | "switch" | "select";

export type DashboardEditField = {
  name: string;
  label: string;
  type?: DashboardEditFieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  step?: number;
};

type DashboardEditDialogProps = {
  open: boolean;
  title: string;
  fields: DashboardEditField[];
  initialValues: Record<string, string | number | boolean | null | undefined>;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string | number | boolean | undefined>) => Promise<void> | void;
};

export function DashboardEditDialog({
  open,
  title,
  fields,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: DashboardEditDialogProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const [values, setValues] = useState<Record<
    string,
    string | number | boolean | null | undefined
  >>({});

  const normalizedInitialValues = useMemo(() => {
    return fields.reduce<Record<string, string | number | boolean | null | undefined>>(
      (result, field) => {
        result[field.name] = initialValues[field.name] ?? (field.type === "switch" ? false : "");
        return result;
      },
      {},
    );
  }, [fields, initialValues]);

  useEffect(() => {
    if (open) {
      setValues(normalizedInitialValues);
    }
  }, [normalizedInitialValues, open]);

  const normalizeSubmitValue = (field: DashboardEditField) => {
    const value = values[field.name];

    if (field.type === "switch") {
      return Boolean(value);
    }

    if (field.type === "number") {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      const nextValue = Number(value);
      return Number.isNaN(nextValue) ? undefined : nextValue;
    }

    if (value === null || value === undefined) {
      return undefined;
    }

    return String(value).trim();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <Form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(
                fields.reduce<Record<string, string | number | boolean | undefined>>(
                  (result, field) => {
                    result[field.name] = normalizeSubmitValue(field);
                    return result;
                  },
                  {},
                ),
              );
            }}
          >
            {fields.map((field) => {
              const type = field.type || "text";
              const value = values[field.name];

              return (
                <FormField key={field.name} name={field.name} label={field.label}>
                  {type === "textarea" ? (
                    <textarea
                      value={typeof value === "string" ? value : value == null ? "" : String(value)}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className={cn(
                        "flex min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors",
                        "placeholder:text-gray-400 focus:border-primary focus:ring-primary hover:border-primary",
                      )}
                    />
                  ) : null}
                  {type === "number" ? (
                    <Input
                      fullWidth
                      type="number"
                      value={
                        typeof value === "number" || typeof value === "string"
                          ? value
                          : ""
                      }
                      min={field.min}
                      step={field.step}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                    />
                  ) : null}
                  {type === "switch" ? (
                    <div className="flex h-10 items-center">
                      <Switch
                        checked={Boolean(value)}
                        onCheckedChange={(nextValue) =>
                          setValues((previous) => ({
                            ...previous,
                            [field.name]: nextValue,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                  {type === "select" ? (
                    <Select
                      value={typeof value === "string" ? value : ""}
                      onChange={(nextValue) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: nextValue,
                        }))
                      }
                      options={field.options || []}
                      placeholder={field.placeholder}
                    />
                  ) : null}
                  {type === "text" ? (
                    <Input
                      fullWidth
                      value={
                        typeof value === "string" || typeof value === "number"
                          ? value
                          : ""
                      }
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                    />
                  ) : null}
                </FormField>
              );
            })}
          </Form>
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {copy.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={() => {
              void onSubmit(
                fields.reduce<Record<string, string | number | boolean | undefined>>(
                  (result, field) => {
                    result[field.name] = normalizeSubmitValue(field);
                    return result;
                  },
                  {},
                ),
              );
            }}
          >
            {copy.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
