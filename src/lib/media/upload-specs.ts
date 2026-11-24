export interface UploadGuideline {
  recommendedDimensions: string;
  aspectRatio: string;
  formats: string;
  maxSize: string;
  note?: string;
}

export const UPLOAD_SPECS = {
  categoryImage: {
    recommendedDimensions: "1200 × 750 px",
    aspectRatio: "16:10 landscape",
    formats: "JPEG, PNG, WebP, AVIF",
    maxSize: "5 MB",
  },
  bannerHeroDesktop: {
    recommendedDimensions: "1920 × 840 px",
    aspectRatio: "16:7 wide landscape",
    formats: "JPEG, PNG, WebP, AVIF",
    maxSize: "5 MB",
  },
  bannerPromoDesktop: {
    recommendedDimensions: "1600 × 600 px",
    aspectRatio: "8:3 wide landscape",
    formats: "JPEG, PNG, WebP, AVIF",
    maxSize: "5 MB",
  },
  bannerMobile: {
    recommendedDimensions: "800 × 1000 px",
    aspectRatio: "4:5 portrait",
    formats: "JPEG, PNG, WebP, AVIF",
    maxSize: "5 MB",
    note: "Optional mobile crop; falls back to desktop image if omitted.",
  },
  productMedia: {
    recommendedDimensions: "1200 × 1200 px",
    aspectRatio: "1:1 square (images)",
    formats: "JPEG, PNG, WebP, AVIF · MP4, WebM",
    maxSize: "5 MB (images) · 20 MB (videos)",
    note: "Up to 10 items per product; at least 1 image is required to publish.",
  },
  productCertificate: {
    recommendedDimensions: "1200 × 1600 px",
    aspectRatio: "3:4 portrait or A4",
    formats: "JPEG, PNG, WebP, AVIF, PDF",
    maxSize: "5 MB",
  },
} as const satisfies Record<string, UploadGuideline>;
