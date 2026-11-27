import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CancelOrderInput,
  OrderDetail,
  OrderItemData,
  OrderListData,
  OrderListQuery,
  OrderSummaryData,
  OrderSummaryQuery,
  OrderSummaryStats,
  RefundOrderInput,
  RefundOrderResultData,
  SyncOrderPaymentData,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStatusInput,
  UpdateOrderTrackingInput,
} from "@/types/order";

export async function getOrderSummary(
  query: OrderSummaryQuery = {}
): Promise<OrderSummaryStats> {
  const params: Record<string, string> = {};
  if (query.country) params.country = query.country;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;

  const response = await apiClient.get<ApiSuccessResponse<OrderSummaryData>>(
    "/orders/summary",
    { params }
  );
  return response.data.data.summary;
}

export async function listOrders(
  query: OrderListQuery = {}
): Promise<OrderListData> {
  const params: Record<string, string | number> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search && query.search.trim() !== "") {
    params.search = query.search.trim();
  }
  if (query.status) params.status = query.status;
  if (query.paymentStatus) params.paymentStatus = query.paymentStatus;
  if (query.paymentMethod) params.paymentMethod = query.paymentMethod;
  if (query.country) params.country = query.country;
  if (query.userId) params.userId = query.userId;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  const response = await apiClient.get<ApiSuccessResponse<OrderListData>>(
    "/orders",
    { params }
  );
  return response.data.data;
}

export async function getOrderById(idOrNumber: string): Promise<OrderDetail> {
  const response = await apiClient.get<ApiSuccessResponse<OrderItemData>>(
    `/orders/${encodeURIComponent(idOrNumber)}`
  );
  return response.data.data.order;
}

export async function updateOrderStatus(
  idOrNumber: string,
  input: UpdateOrderStatusInput
): Promise<OrderDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<OrderItemData>>(
    `/orders/${encodeURIComponent(idOrNumber)}/status`,
    input
  );
  return response.data.data.order;
}

export async function updateOrderTracking(
  idOrNumber: string,
  input: UpdateOrderTrackingInput
): Promise<OrderDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<OrderItemData>>(
    `/orders/${encodeURIComponent(idOrNumber)}/tracking`,
    input
  );
  return response.data.data.order;
}

export async function updateOrderPaymentStatus(
  idOrNumber: string,
  input: UpdateOrderPaymentStatusInput
): Promise<OrderDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<OrderItemData>>(
    `/orders/${encodeURIComponent(idOrNumber)}/payment-status`,
    input
  );
  return response.data.data.order;
}

export async function syncOrderPayment(
  idOrNumber: string
): Promise<SyncOrderPaymentData> {
  const response = await apiClient.post<
    ApiSuccessResponse<SyncOrderPaymentData>
  >(`/orders/${encodeURIComponent(idOrNumber)}/sync-payment`);
  return response.data.data;
}

export async function cancelOrder(
  idOrNumber: string,
  input: CancelOrderInput
): Promise<OrderDetail> {
  const response = await apiClient.post<ApiSuccessResponse<OrderItemData>>(
    `/orders/${encodeURIComponent(idOrNumber)}/cancel`,
    input
  );
  return response.data.data.order;
}

export async function refundOrder(
  idOrNumber: string,
  input: RefundOrderInput
): Promise<RefundOrderResultData> {
  const response = await apiClient.post<
    ApiSuccessResponse<RefundOrderResultData>
  >(`/orders/${encodeURIComponent(idOrNumber)}/refund`, input);
  return response.data.data;
}
