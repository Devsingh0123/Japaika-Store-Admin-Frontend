import type { PricingCountry, PricingCurrency } from "@/types/product";

export interface ShippingSetting {
  id: string;
  country: PricingCountry;
  currency: PricingCurrency;
  flatCharge: string;
  freeShippingThreshold: string | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
  isAlwaysFree: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ShippingSettingListData {
  items: ShippingSetting[];
}

export interface ShippingSettingItemData {
  shippingSetting: ShippingSetting;
}

export interface UpdateShippingSettingInput {
  flatCharge?: number | string;
  freeShippingThreshold?: number | string | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive?: boolean;
}
