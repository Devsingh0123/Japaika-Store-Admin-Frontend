"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import {
  listShippingSettings,
  updateShippingSetting,
  updateShippingSettingStatus,
} from "@/lib/api/shipping";
import { SHIPPING_COUNTRY_META } from "@/lib/shipping/schemas";
import type { PricingCountry } from "@/types/product";
import type { UpdateShippingSettingInput } from "@/types/shipping";

export const SHIPPING_SETTINGS_QUERY_KEY = ["shipping-settings"] as const;

export function useShippingSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: [...SHIPPING_SETTINGS_QUERY_KEY, "list"],
    queryFn: listShippingSettings,
    enabled,
  });
}

export function useUpdateShippingSettingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      country,
      input,
    }: {
      country: PricingCountry;
      input: UpdateShippingSettingInput;
    }) => updateShippingSetting(country, input),
    onSuccess: (setting) => {
      queryClient.invalidateQueries({ queryKey: SHIPPING_SETTINGS_QUERY_KEY });
      toast.success(
        `Saved ${SHIPPING_COUNTRY_META[setting.country].name} shipping settings`
      );
    },
  });
}

export function useUpdateShippingSettingStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      country,
      isActive,
    }: {
      country: PricingCountry;
      isActive: boolean;
    }) => updateShippingSettingStatus(country, isActive),
    onSuccess: (setting) => {
      queryClient.invalidateQueries({ queryKey: SHIPPING_SETTINGS_QUERY_KEY });
      const label = SHIPPING_COUNTRY_META[setting.country].name;
      toast.success(
        setting.isActive
          ? `Enabled shipping for ${label}`
          : `Disabled shipping for ${label}`
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update shipping status.";
      toast.error(message);
    },
  });
}
