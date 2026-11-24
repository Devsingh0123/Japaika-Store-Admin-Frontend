"use client";

import { useState } from "react";
import { CalendarClock, ExternalLink, Monitor, Smartphone, X } from "lucide-react";
import {
  BannerArtworkPreview,
  BannerLiveBadge,
  BannerPlacementBadge,
} from "@/components/banners/banner-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import type { Banner } from "@/types/banner";

interface BannerPreviewModalProps {
  banner: Banner | null;
  canWrite: boolean;
  onClose: () => void;
  onEdit: (banner: Banner) => void;
}

export function BannerPreviewModal({
  banner,
  canWrite,
  onClose,
  onEdit,
}: BannerPreviewModalProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  return (
    <Dialog
      open={banner !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent variant="modal" className="max-w-3xl">
        <DialogHeader>
          <div className="min-w-0 space-y-1 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="truncate">
                {banner?.title ?? "Banner preview"}
              </DialogTitle>
              {banner ? <BannerLiveBadge banner={banner} /> : null}
            </div>
            <DialogDescription>
              Inspect desktop and mobile banner framing, CTA link target, and
              active schedule window.
            </DialogDescription>
          </div>

          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close preview"
                className="cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            }
          />
        </DialogHeader>

        {banner ? (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs
                value={viewport}
                onValueChange={(value) =>
                  setViewport(value as "desktop" | "mobile")
                }
              >
                <TabsList aria-label="Banner preview viewport">
                  <TabsTrigger value="desktop">
                    <Monitor className="size-3.5" aria-hidden="true" />
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="mobile">
                    <Smartphone className="size-3.5" aria-hidden="true" />
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <BannerPlacementBadge placement={banner.placement} />
            </div>

            <BannerArtworkPreview
              title={banner.title}
              subtitle={banner.subtitle}
              badgeText={banner.badgeText}
              ctaLabel={banner.ctaLabel}
              placement={banner.placement}
              imageUrl={banner.imageUrl}
              mobileImageUrl={banner.mobileImageUrl}
              altText={banner.altText}
              viewport={viewport}
            />

            <dl className="grid gap-3 rounded-xl border border-border bg-muted/25 p-4 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground">CTA target URL</dt>
                <dd className="truncate font-mono text-foreground">
                  {banner.ctaUrl ? (
                    <span className="inline-flex items-center gap-1">
                      {banner.ctaUrl}
                      <ExternalLink
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    "None (non-clickable)"
                  )}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-muted-foreground">Display sort order</dt>
                <dd className="font-mono font-medium tabular-nums text-foreground">
                  {banner.sortOrder}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  Starts at
                </dt>
                <dd className="tabular-nums text-foreground">
                  {formatDateTime(banner.startsAt, "Immediately")}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  Ends at
                </dt>
                <dd className="tabular-nums text-foreground">
                  {formatDateTime(banner.endsAt, "No end date")}
                </dd>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <dt className="text-muted-foreground">Image alt text</dt>
                <dd className="text-foreground">
                  {banner.altText || "Not set"}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
          {canWrite && banner ? (
            <Button
              type="button"
              onClick={() => {
                const target = banner;
                onClose();
                onEdit(target);
              }}
              className="cursor-pointer"
            >
              Edit banner
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
