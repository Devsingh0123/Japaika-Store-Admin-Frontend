import type { Metadata } from "next";
import { CouponsManager } from "@/components/coupons/coupons-manager";

export const metadata: Metadata = {
  title: "Coupons",
  description:
    "Manage percentage coupons, regional INR/USD cart thresholds, caps, visibility, and usage limits.",
};

export default function CouponsPage() {
  return <CouponsManager />;
}
