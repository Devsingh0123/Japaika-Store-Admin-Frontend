"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "@/lib/products/schemas";

const QUICK_SPEC_KEYS = [
  "Origin",
  "Ratti / Carat",
  "Mukhi",
  "Metal / Material",
  "Treatment",
  "Lab Certification",
] as const;

interface ProductSpecificationsSectionProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  canEdit: boolean;
}

export function ProductSpecificationsSection({
  control,
  register,
  errors,
  canEdit,
}: ProductSpecificationsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  const existingKeys = new Set(
    fields.map((field) => field.key.trim().toLowerCase())
  );

  const handleQuickAdd = (key: string) => {
    if (fields.length >= 50) return;
    append({ key, value: "" });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Specifications &amp; attributes</CardTitle>
          <CardDescription>
            Flexible key-value attributes for gemstone, Rudraksha, ritual, or
            general product details (up to 50).
          </CardDescription>
        </div>

        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= 50}
            onClick={() => append({ key: "", value: "" })}
            className="cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add attribute
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">
              Quick add:
            </span>
            {QUICK_SPEC_KEYS.map((preset) => {
              const alreadyAdded = existingKeys.has(preset.toLowerCase());
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={alreadyAdded || fields.length >= 50}
                  onClick={() => handleQuickAdd(preset)}
                  className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/50 px-2 text-xs font-medium text-foreground transition-colors hover:border-brand/50 hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="size-3 text-muted-foreground" aria-hidden="true" />
                  {preset}
                </button>
              );
            })}
          </div>
        ) : null}

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/25 px-4 py-6 text-center text-xs text-muted-foreground">
            {canEdit
              ? "No specifications added yet. Use quick add chips or Add attribute for details like Origin, Carat, Mukhi, or Material."
              : "No specifications recorded for this product."}
          </p>
        ) : !canEdit ? (
          <dl className="divide-y divide-border rounded-lg border border-border">
            {fields.map((field) => (
              <div
                key={field.id}
                className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[180px_1fr]"
              >
                <dt className="font-medium text-muted-foreground">
                  {field.key}
                </dt>
                <dd className="text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="space-y-2.5">
            {fields.map((field, index) => {
              const rowError = errors.specifications?.[index];
              return (
                <div
                  key={field.id}
                  className="grid gap-2.5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start"
                >
                  <div className="space-y-1">
                    <Input
                      placeholder="Attribute (e.g. Origin)"
                      aria-label={`Specification ${index + 1} name`}
                      aria-invalid={Boolean(rowError?.key)}
                      {...register(`specifications.${index}.key`)}
                    />
                    {rowError?.key?.message ? (
                      <p className="text-xs text-destructive">
                        {rowError.key.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <Input
                      placeholder="Value (e.g. Sri Lanka / Natural)"
                      aria-label={`Specification ${index + 1} value`}
                      aria-invalid={Boolean(rowError?.value)}
                      {...register(`specifications.${index}.value`)}
                    />
                    {rowError?.value?.message ? (
                      <p className="text-xs text-destructive">
                        {rowError.value.message}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove specification ${index + 1}`}
                    onClick={() => remove(index)}
                    className="mt-0.5 cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
