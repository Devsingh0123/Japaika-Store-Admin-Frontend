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

export function formatINR(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return "₹0";
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatPriceRange(
  minPrice: string | number,
  maxPrice: string | number
): string {
  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (!Number.isFinite(min) && !Number.isFinite(max)) {
    return "₹0";
  }

  if (min === max) {
    return formatINR(min);
  }

  return `${formatINR(min)} – ${formatINR(max)}`;
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
