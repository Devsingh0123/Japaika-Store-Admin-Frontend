"use client";

import { useState } from "react";
import { Boxes, Check, Layers, Package, Plus, Trash2, X } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { StatusBadge } from "@/components/common/status-badge";
import { createEmptyVariantRow } from "@/components/products/editor/product-form-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_MARKETS,
  type ProductFormValues,
} from "@/lib/products/schemas";
import { cn } from "@/lib/utils";
import type {
  ProductType,
  ProductVariant,
  VariantMarketPrice,
} from "@/types/product";

interface ProductVariantsSectionProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  canEdit: boolean;
  canUpdateStock: boolean;
  savedVariants?: ProductVariant[];
  onOpenQuickStock?: () => void;
}

function MarketPriceCell({ entry }: { entry?: VariantMarketPrice }) {
  if (!entry) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5 text-right tabular-nums">
      <p className="font-medium text-foreground">
        {formatCurrency(entry.effectivePrice, entry.currency)}
      </p>
      {entry.salePrice !== null ? (
        <p className="text-[0.7rem] text-muted-foreground line-through">
          {formatCurrency(entry.price, entry.currency)}
        </p>
      ) : null}
    </div>
  );
}

interface VariantRegionalPricesFieldsProps {
  variantIndex: number;
  idPrefix: string;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

function VariantRegionalPricesFields({
  variantIndex,
  idPrefix,
  register,
  errors,
}: VariantRegionalPricesFieldsProps) {
  const priceErrors = errors.variants?.[variantIndex]?.prices;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <p className="text-xs font-medium text-foreground">
          Regional pricing
        </p>
        <p className="text-[0.7rem] text-muted-foreground">
          Leave a market blank if not sold there; at least one market is
          required to publish.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SUPPORTED_COUNTRIES.map((country) => {
          const market = SUPPORTED_MARKETS[country];
          const marketErrors = priceErrors?.[country];
          const priceId = `${idPrefix}-${country.toLowerCase()}-price`;
          const salePriceId = `${idPrefix}-${country.toLowerCase()}-sale-price`;

          return (
            <div
              key={country}
              className="space-y-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 font-mono text-[0.65rem]"
                  >
                    {country}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    {market.label} ({market.currency})
                  </span>
                </div>
                {market.taxNote ? (
                  <span className="text-[0.68rem] text-muted-foreground">
                    {market.taxNote}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label={`Regular price (${market.symbol})`}
                  htmlFor={priceId}
                  error={marketErrors?.price?.message}
                >
                  <Input
                    id={priceId}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={market.placeholder}
                    aria-invalid={Boolean(marketErrors?.price)}
                    {...register(
                      `variants.${variantIndex}.prices.${country}.price`
                    )}
                  />
                </FormField>

                <FormField
                  label={`Sale price (${market.symbol})`}
                  htmlFor={salePriceId}
                  error={marketErrors?.salePrice?.message}
                >
                  <Input
                    id={salePriceId}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Optional"
                    aria-invalid={Boolean(marketErrors?.salePrice)}
                    {...register(
                      `variants.${variantIndex}.prices.${country}.salePrice`
                    )}
                  />
                </FormField>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface OptionValueInputProps {
  optionIndex: number;
  values: string[];
  onAddValues: (newValues: string[]) => void;
  onRemoveValue: (valueIndex: number) => void;
}

function OptionValuesEditor({
  optionIndex,
  values,
  onAddValues,
  onRemoveValue,
}: OptionValueInputProps) {
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const parsed = draft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;

    const existingLower = new Set(values.map((v) => v.toLowerCase()));
    const fresh = parsed.filter((v) => !existingLower.has(v.toLowerCase()));
    if (fresh.length > 0) {
      onAddValues(fresh);
    }
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((val, valIdx) => (
          <span
            key={`${val}-${valIdx}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {val}
            <button
              type="button"
              onClick={() => onRemoveValue(valIdx)}
              aria-label={`Remove option value ${val}`}
              className="cursor-pointer rounded-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          placeholder="Add value and press Enter (e.g. 5.25 Ratti, 6.00 Ratti)"
          aria-label={`Add value for option ${optionIndex + 1}`}
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={draft.trim() === "" || values.length >= 30}
          onClick={commitDraft}
          className="h-8 shrink-0 cursor-pointer"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export function ProductVariantsSection({
  control,
  register,
  setValue,
  getValues,
  errors,
  canEdit,
  canUpdateStock,
  savedVariants = [],
  onOpenQuickStock,
}: ProductVariantsSectionProps) {
  const productType = useWatch({ control, name: "productType" });
  const variantOptions = useWatch({ control, name: "variantOptions" }) ?? [];
  const watchedVariants = useWatch({ control, name: "variants" }) ?? [];

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: "variantOptions",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const handleProductTypeChange = (nextType: ProductType) => {
    if (!canEdit || nextType === productType) return;

    setValue("productType", nextType, { shouldDirty: true });

    if (nextType === "simple") {
      const currentVariants = getValues("variants");
      const chosen =
        currentVariants.find((v) => v.isDefault) ??
        currentVariants[0] ??
        createEmptyVariantRow({}, true);

      setValue("variantOptions", [], { shouldDirty: true });
      setValue(
        "variants",
        [
          {
            ...chosen,
            title: chosen.title || "Default",
            optionValues: {},
            isDefault: true,
          },
        ],
        { shouldDirty: true }
      );
    } else {
      const currentOptions = getValues("variantOptions");
      if (currentOptions.length === 0) {
        setValue("variantOptions", [{ name: "", values: [] }], {
          shouldDirty: true,
        });
      }
    }
  };

  const handleRenameOption = (optionIndex: number, nextName: string) => {
    const prevName = getValues(`variantOptions.${optionIndex}.name`) ?? "";
    setValue(`variantOptions.${optionIndex}.name`, nextName, {
      shouldDirty: true,
    });

    if (prevName && prevName !== nextName) {
      const currentVariants = getValues("variants");
      currentVariants.forEach((variant, vIdx) => {
        if (variant.optionValues && prevName in variant.optionValues) {
          const updated = { ...variant.optionValues };
          const val = updated[prevName];
          delete updated[prevName];
          if (nextName.trim()) {
            updated[nextName] = val;
          }
          setValue(`variants.${vIdx}.optionValues`, updated, {
            shouldDirty: true,
          });
        }
      });
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    const removedName = getValues(`variantOptions.${optionIndex}.name`);
    removeOption(optionIndex);
    if (removedName) {
      const currentVariants = getValues("variants");
      currentVariants.forEach((variant, vIdx) => {
        if (variant.optionValues && removedName in variant.optionValues) {
          const updated = { ...variant.optionValues };
          delete updated[removedName];
          setValue(`variants.${vIdx}.optionValues`, updated, {
            shouldDirty: true,
          });
        }
      });
    }
  };

  const handleSetDefaultVariant = (targetIndex: number) => {
    const currentVariants = getValues("variants");
    currentVariants.forEach((_, idx) => {
      setValue(`variants.${idx}.isDefault`, idx === targetIndex, {
        shouldDirty: true,
      });
    });
  };

  const handleAddManualVariant = () => {
    if (variantFields.length >= 100) return;

    const initialOptionValues: Record<string, string> = {};
    for (const opt of variantOptions) {
      const cleanName = opt.name.trim();
      if (cleanName && opt.values.length > 0) {
        initialOptionValues[cleanName] = opt.values[0];
      }
    }

    appendVariant(
      createEmptyVariantRow(initialOptionValues, variantFields.length === 0)
    );
  };

  // Read-only view for operations_manager and support_moderator
  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pricing &amp; variants</CardTitle>
            <CardDescription>
              Regional pricing for India (INR, incl. GST) and USA (USD).{" "}
              {productType === "variant"
                ? `${savedVariants.length} variants configured.`
                : "Simple single-variant product."}
            </CardDescription>
          </div>
          {canUpdateStock && onOpenQuickStock ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenQuickStock}
              className="cursor-pointer shrink-0"
            >
              <Boxes className="size-3.5" aria-hidden="true" />
              Update stock
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/45 font-medium text-muted-foreground">
                  <th className="px-5 py-2.5">Variant / SKU</th>
                  <th className="px-4 py-2.5 text-right">India (INR)</th>
                  <th className="px-4 py-2.5 text-right">USA (USD)</th>
                  <th className="px-4 py-2.5">Inventory</th>
                  <th className="px-5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {savedVariants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {variant.title || "Default"}
                        </span>
                        {variant.isDefault ? (
                          <Badge variant="brand" className="text-[0.625rem]">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <p className="font-mono text-[0.7rem] text-muted-foreground">
                        {variant.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <MarketPriceCell entry={variant.prices?.IN} />
                    </td>
                    <td className="px-4 py-3">
                      <MarketPriceCell entry={variant.prices?.US} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium tabular-nums text-foreground">
                        {variant.stockQuantity}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        (alert ≤ {variant.lowStockThreshold})
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge
                        label={variant.isActive ? "Active" : "Paused"}
                        tone={variant.isActive ? "success" : "muted"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pricing &amp; variants</CardTitle>
          <CardDescription>
            Set regional pricing for India (INR, incl. GST) and USA (USD).
            Choose between a single-SKU simple product or custom multi-option
            variants.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Type Selector */}
        <div
          role="radiogroup"
          aria-label="Product type"
          className="grid gap-3 sm:grid-cols-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={productType === "simple"}
            onClick={() => handleProductTypeChange("simple")}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
              productType === "simple"
                ? "border-brand bg-brand-muted/50"
                : "border-border bg-card hover:bg-muted/35"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                productType === "simple"
                  ? "border-brand/35 bg-brand-muted text-brand"
                  : "border-border bg-muted/50 text-muted-foreground"
              )}
            >
              <Package className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Simple product
              </p>
              <p className="text-xs text-muted-foreground">
                Single price, SKU, and inventory count (e.g. a unique gemstone).
              </p>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={productType === "variant"}
            onClick={() => handleProductTypeChange("variant")}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
              productType === "variant"
                ? "border-brand bg-brand-muted/50"
                : "border-border bg-card hover:bg-muted/35"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                productType === "variant"
                  ? "border-brand/35 bg-brand-muted text-brand"
                  : "border-border bg-muted/50 text-muted-foreground"
              )}
            >
              <Layers className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Variant product
              </p>
              <p className="text-xs text-muted-foreground">
                Multiple selectable options (e.g. Ratti weight, metal, ring
                size).
              </p>
            </div>
          </button>
        </div>

        {/* SIMPLE PRODUCT FORM */}
        {productType === "simple" ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <VariantRegionalPricesFields
              variantIndex={0}
              idPrefix="simple"
              register={register}
              errors={errors}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="SKU"
                htmlFor="simple-sku"
                hint="Auto-generated if left blank."
                error={errors.variants?.[0]?.sku?.message}
              >
                <Input
                  id="simple-sku"
                  placeholder="e.g. JPK-RUDRA-01"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(errors.variants?.[0]?.sku)}
                  {...register("variants.0.sku")}
                />
              </FormField>

              <FormField
                label="Stock quantity"
                htmlFor="simple-stock"
                required
                error={errors.variants?.[0]?.stockQuantity?.message}
              >
                <Input
                  id="simple-stock"
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={Boolean(errors.variants?.[0]?.stockQuantity)}
                  {...register("variants.0.stockQuantity")}
                />
              </FormField>

              <FormField
                label="Low-stock alert"
                htmlFor="simple-threshold"
                error={errors.variants?.[0]?.lowStockThreshold?.message}
              >
                <Input
                  id="simple-threshold"
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={Boolean(
                    errors.variants?.[0]?.lowStockThreshold
                  )}
                  {...register("variants.0.lowStockThreshold")}
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Available for sale
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  Keep enabled so shoppers can purchase this item when
                  published.
                </p>
              </div>
              <Controller
                control={control}
                name="variants.0.isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Variant active for sale"
                  />
                )}
              />
            </div>
          </div>
        ) : (
          /* VARIANT PRODUCT BUILDER */
          <div className="space-y-6">
            {/* 1. Variant Options */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    1. Variant options
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define up to 5 option dimensions (e.g., Weight, Metal, Size)
                    and their selectable values.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={optionFields.length >= 5}
                  onClick={() => appendOption({ name: "", values: [] })}
                  className="cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add option
                </Button>
              </div>

              {optionFields.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card px-4 py-4 text-center text-xs text-muted-foreground">
                  Add at least one option (such as Size, Weight, or Metal) to
                  configure variants.
                </p>
              ) : (
                <div className="space-y-3">
                  {optionFields.map((optField, optIdx) => {
                    const currentOpt = variantOptions[optIdx] ?? {
                      name: "",
                      values: [],
                    };
                    const optError = errors.variantOptions?.[optIdx];

                    return (
                      <div
                        key={optField.id}
                        className="space-y-3 rounded-lg border border-border bg-card p-3.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`opt-name-${optIdx}`}
                              className="text-xs"
                            >
                              Option name
                            </Label>
                            <Input
                              id={`opt-name-${optIdx}`}
                              value={currentOpt.name}
                              onChange={(e) =>
                                handleRenameOption(optIdx, e.target.value)
                              }
                              placeholder="e.g. Ratti Weight, Metal, Size"
                              aria-invalid={Boolean(optError?.name)}
                              className="h-8 text-sm"
                            />
                            {optError?.name?.message ? (
                              <p className="text-xs text-destructive">
                                {optError.name.message}
                              </p>
                            ) : null}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove option ${optIdx + 1}`}
                            onClick={() => handleRemoveOption(optIdx)}
                            className="mt-5 cursor-pointer text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Option values</Label>
                          <OptionValuesEditor
                            optionIndex={optIdx}
                            values={currentOpt.values}
                            onAddValues={(fresh) =>
                              setValue(
                                `variantOptions.${optIdx}.values`,
                                [...currentOpt.values, ...fresh],
                                { shouldDirty: true }
                              )
                            }
                            onRemoveValue={(valIdx) =>
                              setValue(
                                `variantOptions.${optIdx}.values`,
                                currentOpt.values.filter(
                                  (_, idx) => idx !== valIdx
                                ),
                                { shouldDirty: true }
                              )
                            }
                          />
                          {optError?.values?.message ? (
                            <p className="text-xs text-destructive">
                              {optError.values.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Manual Variants */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    2. Variants ({variantFields.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manually add only the combinations you actually sell, with
                    individual pricing and inventory.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={variantFields.length >= 100}
                  onClick={handleAddManualVariant}
                  className="cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add variant
                </Button>
              </div>

              <div className="space-y-3">
                {variantFields.map((variantField, vIdx) => {
                  const row = watchedVariants[vIdx];
                  const rowErrors = errors.variants?.[vIdx];
                  const optionValuesError =
                    typeof rowErrors?.optionValues?.message === "string"
                      ? rowErrors.optionValues.message
                      : undefined;

                  return (
                    <div
                      key={variantField.id}
                      className="space-y-4 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            Variant #{vIdx + 1}
                          </span>
                          {row?.isDefault ? (
                            <Badge variant="brand" className="text-[0.65rem]">
                              <Check className="size-3" aria-hidden="true" />
                              Default
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => handleSetDefaultVariant(vIdx)}
                              className="cursor-pointer text-xs text-muted-foreground"
                            >
                              Set as default
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Controller
                              control={control}
                              name={`variants.${vIdx}.isActive`}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  aria-label={`Variant ${vIdx + 1} active`}
                                />
                              )}
                            />
                            <span className="text-xs text-muted-foreground">
                              {row?.isActive ? "Active" : "Paused"}
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={variantFields.length <= 1}
                            aria-label={`Remove variant ${vIdx + 1}`}
                            onClick={() => {
                              const wasDefault = row?.isDefault;
                              removeVariant(vIdx);
                              if (wasDefault) {
                                setValue("variants.0.isDefault", true, {
                                  shouldDirty: true,
                                });
                              }
                            }}
                            className="cursor-pointer text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      {/* Option Value Selectors */}
                      {variantOptions.some(
                        (opt) => opt.name.trim().length > 0
                      ) ? (
                        <div className="space-y-1.5">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {variantOptions.map((opt, oIdx) => {
                              const optName = opt.name.trim();
                              if (!optName) return null;
                              const selectedVal =
                                row?.optionValues?.[optName] ?? "";

                              return (
                                <div key={`${optName}-${oIdx}`} className="space-y-1">
                                  <Label
                                    htmlFor={`v-${vIdx}-opt-${oIdx}`}
                                    className="text-xs"
                                  >
                                    {optName}
                                    <span className="ml-0.5 text-destructive">
                                      *
                                    </span>
                                  </Label>
                                  {opt.values.length > 0 ? (
                                    <Select
                                      id={`v-${vIdx}-opt-${oIdx}`}
                                      value={selectedVal}
                                      onChange={(e) => {
                                        const nextMap = {
                                          ...(getValues(
                                            `variants.${vIdx}.optionValues`
                                          ) ?? {}),
                                          [optName]: e.target.value,
                                        };
                                        setValue(
                                          `variants.${vIdx}.optionValues`,
                                          nextMap,
                                          { shouldDirty: true }
                                        );
                                      }}
                                    >
                                      <option value="">
                                        Select {optName}...
                                      </option>
                                      {opt.values.map((val) => (
                                        <option key={val} value={val}>
                                          {val}
                                        </option>
                                      ))}
                                    </Select>
                                  ) : (
                                    <Input
                                      id={`v-${vIdx}-opt-${oIdx}`}
                                      disabled
                                      placeholder={`Add values to "${optName}" above`}
                                      className="h-9 text-xs"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {optionValuesError ? (
                            <p className="text-xs text-destructive">
                              {optionValuesError}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-warning">
                          Add option names and values in Step 1 above to assign
                          combinations to this variant.
                        </p>
                      )}

                      {/* Regional Pricing */}
                      <VariantRegionalPricesFields
                        variantIndex={vIdx}
                        idPrefix={`v-${vIdx}`}
                        register={register}
                        errors={errors}
                      />

                      {/* Variant Details */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <FormField
                          label="SKU"
                          htmlFor={`v-${vIdx}-sku`}
                          error={rowErrors?.sku?.message}
                        >
                          <Input
                            id={`v-${vIdx}-sku`}
                            placeholder="Auto-generated if blank"
                            className="font-mono uppercase"
                            aria-invalid={Boolean(rowErrors?.sku)}
                            {...register(`variants.${vIdx}.sku`)}
                          />
                        </FormField>

                        <FormField
                          label="Variant title"
                          htmlFor={`v-${vIdx}-title`}
                          error={rowErrors?.title?.message}
                        >
                          <Input
                            id={`v-${vIdx}-title`}
                            placeholder="Auto from options if blank"
                            aria-invalid={Boolean(rowErrors?.title)}
                            {...register(`variants.${vIdx}.title`)}
                          />
                        </FormField>

                        <FormField
                          label="Stock quantity"
                          htmlFor={`v-${vIdx}-stock`}
                          required
                          error={rowErrors?.stockQuantity?.message}
                        >
                          <Input
                            id={`v-${vIdx}-stock`}
                            type="number"
                            min={0}
                            step={1}
                            aria-invalid={Boolean(rowErrors?.stockQuantity)}
                            {...register(`variants.${vIdx}.stockQuantity`)}
                          />
                        </FormField>

                        <FormField
                          label="Low-stock alert"
                          htmlFor={`v-${vIdx}-threshold`}
                          error={rowErrors?.lowStockThreshold?.message}
                        >
                          <Input
                            id={`v-${vIdx}-threshold`}
                            type="number"
                            min={0}
                            step={1}
                            aria-invalid={Boolean(
                              rowErrors?.lowStockThreshold
                            )}
                            {...register(`variants.${vIdx}.lowStockThreshold`)}
                          />
                        </FormField>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
