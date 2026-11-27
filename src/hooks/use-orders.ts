"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import {
  cancelOrder,
  getOrderById,
  getOrderSummary,
  listOrders,
  refundOrder,
  syncOrderPayment,
  updateOrderPaymentStatus,
  updateOrderStatus,
  updateOrderTracking,
} from "@/lib/api/orders";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/schemas";
import type {
  CancelOrderInput,
  OrderListQuery,
  OrderSummaryQuery,
  RefundOrderInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStatusInput,
  UpdateOrderTrackingInput,
} from "@/types/order";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export function useOrderSummaryQuery(
  query: OrderSummaryQuery = {},
  enabled = true
) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, "summary", query],
    queryFn: () => getOrderSummary(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrdersQuery(query: OrderListQuery, enabled = true) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, "list", query],
    queryFn: () => listOrders(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrderDetailQuery(idOrNumber: string, enabled = true) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, "detail", idOrNumber],
    queryFn: () => getOrderById(idOrNumber),
    enabled: Boolean(idOrNumber) && enabled,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateOrderStatusInput;
    }) => updateOrderStatus(id, input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success(
        `Order ${order.orderNumber} marked as ${ORDER_STATUS_LABELS[order.status]}`
      );
    },
  });
}

export function useUpdateOrderTrackingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateOrderTrackingInput;
    }) => updateOrderTracking(id, input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success(`Updated tracking for ${order.orderNumber}`);
    },
  });
}

export function useUpdateOrderPaymentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateOrderPaymentStatusInput;
    }) => updateOrderPaymentStatus(id, input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success(
        `Payment marked as ${PAYMENT_STATUS_LABELS[order.paymentStatus]}`
      );
    },
  });
}

export function useSyncOrderPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => syncOrderPayment(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      if (result.synced) {
        toast.success(
          `Synced ${result.order.orderNumber} with Razorpay (${PAYMENT_STATUS_LABELS[result.order.paymentStatus]})`
        );
      } else {
        toast.info(
          `Checked Razorpay (${result.gatewayPaymentsCount} payment record${result.gatewayPaymentsCount === 1 ? "" : "s"}) — no changes required`
        );
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sync payment with Razorpay right now.";
      toast.error(message);
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelOrderInput }) =>
      cancelOrder(id, input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success(`Cancelled order ${order.orderNumber}`);
    },
  });
}

export function useRefundOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RefundOrderInput }) =>
      refundOrder(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success(
        `Refund processed for ${result.order.orderNumber} (${result.refund.mode})`
      );
    },
  });
}
