import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { BANNER_PLACEMENT_LABELS } from "@/lib/banners/schemas";
import { cn } from "@/lib/utils";
import type { Banner, BannerPlacement } from "@/types/banner";

export function getBannerLiveState(
  banner: Pick<Banner, "isActive" | "isCurrentlyLive" | "startsAt" | "endsAt">
): { label: string; tone: StatusTone } {
  if (!banner.isActive) {
    return { label: "Inactive", tone: "muted" };
  }

  if (banner.isCurrentlyLive) {
    return { label: "Live", tone: "success" };
  }

  const now = Date.now();
  if (banner.startsAt && Date.parse(banner.startsAt) > now) {
    return { label: "Scheduled", tone: "info" };
  }

  if (banner.endsAt && Date.parse(banner.endsAt) < now) {
    return { label: "Expired", tone: "warning" };
  }

  return { label: "Inactive", tone: "muted" };
}

export function BannerLiveBadge({
  banner,
  className,
}: {
  banner: Pick<Banner, "isActive" | "isCurrentlyLive" | "startsAt" | "endsAt">;
  className?: string;
}) {
  const { label, tone } = getBannerLiveState(banner);
  return <StatusBadge label={label} tone={tone} className={className} />;
}

export function BannerPlacementBadge({
  placement,
  className,
}: {
  placement: BannerPlacement;
  className?: string;
}) {
  return (
    <Badge
      variant={placement === "homepage_hero" ? "brand" : "secondary"}
      className={className}
    >
      {BANNER_PLACEMENT_LABELS[placement]}
    </Badge>
  );
}

interface BannerArtworkPreviewProps {
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaLabel?: string | null;
  placement: BannerPlacement;
  imageUrl: string | null;
  mobileImageUrl?: string | null;
  altText?: string | null;
  viewport?: "desktop" | "mobile";
  className?: string;
}

export function BannerArtworkPreview({
  title,
  subtitle,
  badgeText,
  ctaLabel,
  placement,
  imageUrl,
  mobileImageUrl,
  altText,
  viewport = "desktop",
  className,
}: BannerArtworkPreviewProps) {
  const isMobile = viewport === "mobile";
  const resolvedImageUrl = isMobile ? mobileImageUrl || imageUrl : imageUrl;
  const usingDesktopFallback = isMobile && !mobileImageUrl && Boolean(imageUrl);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-muted/50",
        isMobile ? "mx-auto aspect-[4/5] w-full max-w-[280px]" : "aspect-[16/7] w-full",
        className
      )}
    >
      {resolvedImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedImageUrl}
          alt={altText?.trim() || title || "Banner artwork preview"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="size-7 opacity-60" aria-hidden="true" />
          <span className="text-xs font-medium">
            Upload a desktop image to preview banner
          </span>
        </div>
      )}

      {resolvedImageUrl ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
          aria-hidden="true"
        />
      ) : null}

      <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1.5">
        <Badge
          variant={placement === "homepage_hero" ? "brand" : "secondary"}
          className="bg-card/90 backdrop-blur-xs"
        >
          {BANNER_PLACEMENT_LABELS[placement]}
        </Badge>
        {isMobile ? (
          <Badge variant="outline" className="bg-card/90 backdrop-blur-xs">
            {usingDesktopFallback ? "Desktop fallback" : "Mobile artwork"}
          </Badge>
        ) : null}
      </div>

      {resolvedImageUrl ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-4 text-white sm:p-5">
          {badgeText?.trim() ? (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-black/45 px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-amber-200 backdrop-blur-xs">
              {badgeText.trim()}
            </span>
          ) : null}

          <p
            className={cn(
              "line-clamp-2 font-semibold tracking-tight text-white drop-shadow-xs",
              isMobile ? "text-base leading-snug" : "max-w-xl text-lg leading-snug"
            )}
          >
            {title.trim() || "Banner headline preview"}
          </p>

          {subtitle?.trim() ? (
            <p className="line-clamp-2 max-w-lg text-xs leading-relaxed text-white/85">
              {subtitle.trim()}
            </p>
          ) : null}

          {ctaLabel?.trim() ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-neutral-900 shadow-xs">
              {ctaLabel.trim()}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
