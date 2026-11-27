import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type { PricingCountry } from "@/types/product";
import type {
  ShippingSetting,
  ShippingSettingItemData,
  ShippingSettingListData,
  UpdateShippingSettingInput,
} from "@/types/shipping";

export async function listShippingSettings(): Promise<ShippingSettingListData> {
  const response = await apiClient.get<
    ApiSuccessResponse<ShippingSettingListData>
  >("/shipping-settings");
  return response.data.data;
}

export async function getShippingSetting(
  country: PricingCountry
): Promise<ShippingSetting> {
  const response = await apiClient.get<
    ApiSuccessResponse<ShippingSettingItemData>
  >(`/shipping-settings/${country}`);
  return response.data.data.shippingSetting;
}

export async function updateShippingSetting(
  country: PricingCountry,
  input: UpdateShippingSettingInput
): Promise<ShippingSetting> {
  const response = await apiClient.patch<
    ApiSuccessResponse<ShippingSettingItemData>
  >(`/shipping-settings/${country}`, input);
  return response.data.data.shippingSetting;
}

export async function updateShippingSettingStatus(
  country: PricingCountry,
  isActive: boolean
): Promise<ShippingSetting> {
  const response = await apiClient.patch<
    ApiSuccessResponse<ShippingSettingItemData>
  >(`/shipping-settings/${country}/status`, { isActive });
  return response.data.data.shippingSetting;
}
