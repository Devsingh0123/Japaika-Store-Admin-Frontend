import type { PaginationMeta } from "@/types/api";
import type { PricingCountry, PricingCurrency } from "@/types/product";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "razorpay" | "cod";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refunded";

export type CancelledByActor = "customer" | "admin";

export type OrderSortBy =
  | "createdAt"
  | "updatedAt"
  | "grandTotalAmount"
  | "paidAt"
  | "shippedAt"
  | "status";

export type OrderSortOrder = "asc" | "desc";

export interface OrderCustomerSummary {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  status: string;
}

export interface OrderTrackingInfo {
  courierName: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  country: PricingCountry;
  currency: PricingCurrency;
  grandTotalAmount: string;
  itemCount: number;
  customer: OrderCustomerSummary | null;
  couponCode: string | null;
  tracking: OrderTrackingInfo;
  paidAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderPricingBreakdown {
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  grandTotalAmount: string;
}

export interface OrderPaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  refundAmount: string | null;
  razorpayRefundId: string | null;
  refundedAt: string | null;
}

export interface OrderCancellationDetails {
  cancelledAt: string | null;
  cancelledBy: CancelledByActor | null;
  reason: string | null;
}

export interface OrderShippingAddress {
  fullName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  line1?: string | null;
  line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface OrderCouponSnapshot {
  code?: string | null;
  discountPercentage?: string | number | null;
  discountAmount?: string | number | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string;
  variantTitle: string | null;
  sku: string;
  optionValues: Record<string, string> | null;
  imageUrl: string | null;
  hsnCode: string | null;
  gstRate: string;
  quantity: number;
  unitPrice: string;
  unitSalePrice: string | null;
  unitEffectivePrice: string;
  lineTotal: string;
  taxAmount: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  country: PricingCountry;
  currency: PricingCurrency;
  customer: OrderCustomerSummary | null;
  pricing: OrderPricingBreakdown;
  couponId: string | null;
  couponCode: string | null;
  couponSnapshot: OrderCouponSnapshot | null;
  shippingAddress: OrderShippingAddress | null;
  customerNotes: string | null;
  payment: OrderPaymentDetails;
  tracking: OrderTrackingInfo;
  cancellation: OrderCancellationDetails | null;
  stockRestored: boolean;
  items: OrderItem[];
  allowedNextStatuses: OrderStatus[];
  canCancel: boolean;
  canRefund: boolean;
  canEditTracking: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderSummaryStats {
  totalOrders: number;
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
  actionRequired: {
    awaitingFulfillment: number;
    pendingRefunds: number;
    pendingPayments: number;
  };
  paidRevenue: {
    INR: string;
    USD: string;
  };
}

export interface OrderSummaryQuery {
  country?: PricingCountry;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  country?: PricingCountry;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: OrderSortBy;
  sortOrder?: OrderSortOrder;
}

export interface OrderSummaryData {
  summary: OrderSummaryStats;
}

export interface OrderListData {
  items: OrderListItem[];
  pagination: PaginationMeta;
}

export interface OrderItemData {
  order: OrderDetail;
}

export interface SyncOrderPaymentData {
  order: OrderDetail;
  synced: boolean;
  gatewayPaymentsCount: number;
}

export interface RefundOrderResultData {
  order: OrderDetail;
  refund: {
    mode: "razorpay" | "manual";
    amount: string;
    currency: PricingCurrency;
    razorpayRefundId: string | null;
    gatewayStatus: string | null;
  };
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  courierName?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  markCodPaid?: boolean;
}

export interface UpdateOrderTrackingInput {
  courierName?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
}

export interface UpdateOrderPaymentStatusInput {
  paymentStatus: Exclude<PaymentStatus, "refunded">;
  razorpayPaymentId?: string | null;
  refundAmount?: number | string | null;
}

export interface CancelOrderInput {
  reason: string;
  restoreStock?: boolean;
}

export interface RefundOrderInput {
  mode?: "razorpay" | "manual";
  amount?: number | string | null;
  speed?: "normal" | "optimum";
  razorpayRefundId?: string | null;
  notes?: string | null;
  restoreStock?: boolean;
}
