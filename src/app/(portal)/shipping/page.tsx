import type { Metadata } from "next";
import { ShippingSettingsManager } from "@/components/shipping/shipping-settings-manager";

export const metadata: Metadata = {
  title: "Shipping Settings",
  description:
    "Configure India (INR) and USA (USD) flat shipping rates, free-shipping thresholds, and delivery windows.",
};

export default function ShippingSettingsPage() {
  return <ShippingSettingsManager />;
}
