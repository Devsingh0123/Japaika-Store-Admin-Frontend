import type { PricingCurrency } from "@/types/product";

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(
  isoString: string | null | undefined,
  fallback = "First session"
): string {
  if (!isoString) {
    return fallback;
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const CURRENCY_LOCALES: Record<PricingCurrency, string> = {
  INR: "en-IN",
  USD: "en-US",
};

export function formatCurrency(
  value: string | number | null | undefined,
  currency: PricingCurrency = "INR"
): string {
  const numeric =
    value === null || value === undefined || value === "" ? 0 : Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;

  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatPriceRange(
  minPrice: string | number,
  maxPrice: string | number,
  currency: PricingCurrency
): string {
  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (!Number.isFinite(min) && !Number.isFinite(max)) {
    return formatCurrency(0, currency);
  }

  if (min === max) {
    return formatCurrency(min, currency);
  }

  return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toDateTimeLocalValue(
  isoString: string | null | undefined
): string {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(localValue: string): string | null {
  const trimmed = localValue.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
