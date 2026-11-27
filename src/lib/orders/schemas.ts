import { z } from "zod";
import type {
  OrderDetail,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

export const ORDER_STATUS_OPTIONS: readonly OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_NEXT_ACTION_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirm Order",
  processing: "Mark Processing",
  packed: "Mark Packed",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
  cancelled: "Cancel Order",
};

export const PAYMENT_STATUS_OPTIONS: readonly PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refund_pending",
  "refunded",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refund_pending: "Refund Pending",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethod[] = [
  "razorpay",
  "cod",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  razorpay: "Razorpay",
  cod: "Cash on Delivery",
};

export const RAZORPAY_PAYMENT_ID_REGEX = /^pay_[A-Za-z0-9]+$/;
export const RAZORPAY_REFUND_ID_REGEX = /^rfnd_[A-Za-z0-9]+$/;
const DECIMAL_TWO_PLACES_REGEX = /^\d+(\.\d{1,2})?$/;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface AdvanceStatusFormValues {
  courierName: string;
  awbNumber: string;
  trackingUrl: string;
  markCodPaid: boolean;
}

export function createAdvanceStatusSchema(targetStatus: OrderStatus) {
  return z
    .object({
      courierName: z
        .string()
        .max(100, "Courier name cannot exceed 100 characters."),
      awbNumber: z
        .string()
        .max(100, "AWB tracking number cannot exceed 100 characters."),
      trackingUrl: z
        .string()
        .max(500, "Tracking URL cannot exceed 500 characters."),
      markCodPaid: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (targetStatus === "shipped") {
        if (!data.courierName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["courierName"],
            message: "Courier name is required to mark an order as shipped.",
          });
        }
        if (!data.awbNumber.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awbNumber"],
            message:
              "AWB tracking number is required to mark an order as shipped.",
          });
        }
      }

      const urlTrimmed = data.trackingUrl.trim();
      if (urlTrimmed !== "" && !isValidHttpUrl(urlTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trackingUrl"],
          message: "Enter a valid http:// or https:// URL.",
        });
      }
    });
}

export interface EditTrackingFormValues {
  courierName: string;
  awbNumber: string;
  trackingUrl: string;
}

export function createEditTrackingSchema(isShipped: boolean) {
  return z
    .object({
      courierName: z
        .string()
        .max(100, "Courier name cannot exceed 100 characters."),
      awbNumber: z
        .string()
        .max(100, "AWB tracking number cannot exceed 100 characters."),
      trackingUrl: z
        .string()
        .max(500, "Tracking URL cannot exceed 500 characters."),
    })
    .superRefine((data, ctx) => {
      if (isShipped) {
        if (!data.courierName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["courierName"],
            message: "Courier name cannot be cleared on a shipped order.",
          });
        }
        if (!data.awbNumber.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awbNumber"],
            message: "AWB number cannot be cleared on a shipped order.",
          });
        }
      }

      const urlTrimmed = data.trackingUrl.trim();
      if (urlTrimmed !== "" && !isValidHttpUrl(urlTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trackingUrl"],
          message: "Enter a valid http:// or https:// URL.",
        });
      }
    });
}

export function getAllowedPaymentTransitions(
  order: Pick<OrderDetail, "status" | "paymentStatus">
): Exclude<PaymentStatus, "refunded">[] {
  const { status, paymentStatus } = order;
  if (paymentStatus === "refunded") {
    return [];
  }

  const next: Exclude<PaymentStatus, "refunded">[] = [];

  if (
    (paymentStatus === "pending" || paymentStatus === "failed") &&
    status !== "cancelled"
  ) {
    next.push("paid");
  }

  if (
    paymentStatus === "pending" &&
    (status === "pending_payment" || status === "cancelled")
  ) {
    next.push("failed");
  }

  if (paymentStatus === "failed" && status === "pending_payment") {
    next.push("pending");
  }

  if (
    paymentStatus === "paid" ||
    ((paymentStatus === "pending" || paymentStatus === "failed") &&
      status === "cancelled")
  ) {
    next.push("refund_pending");
  }

  return next;
}

export interface UpdatePaymentFormValues {
  paymentStatus: Exclude<PaymentStatus, "refunded">;
  razorpayPaymentId: string;
  refundAmount: string;
}

export function createUpdatePaymentSchema(order: OrderDetail) {
  const maxAmount = Number(order.pricing.grandTotalAmount);

  return z
    .object({
      paymentStatus: z.enum(["pending", "paid", "failed", "refund_pending"]),
      razorpayPaymentId: z
        .string()
        .max(64, "Razorpay payment ID cannot exceed 64 characters."),
      refundAmount: z.string(),
    })
    .superRefine((data, ctx) => {
      const paymentId = data.razorpayPaymentId.trim();

      const needsRazorpayId =
        order.paymentMethod === "razorpay" &&
        (data.paymentStatus === "paid" ||
          (data.paymentStatus === "refund_pending" &&
            order.status === "cancelled" &&
            order.paymentStatus !== "paid"));

      if (needsRazorpayId) {
        if (!paymentId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["razorpayPaymentId"],
            message: "A Razorpay payment ID (pay_...) is required.",
          });
        } else if (!RAZORPAY_PAYMENT_ID_REGEX.test(paymentId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["razorpayPaymentId"],
            message: "Must match Razorpay payment ID format (pay_...).",
          });
        }
      } else if (
        paymentId !== "" &&
        !RAZORPAY_PAYMENT_ID_REGEX.test(paymentId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["razorpayPaymentId"],
          message: "Must match Razorpay payment ID format (pay_...).",
        });
      }

      if (data.paymentStatus === "refund_pending") {
        const amtTrimmed = data.refundAmount.trim();
        if (amtTrimmed !== "") {
          if (!DECIMAL_TWO_PLACES_REGEX.test(amtTrimmed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["refundAmount"],
              message: "Enter a valid amount (up to 2 decimal places).",
            });
          } else {
            const num = Number(amtTrimmed);
            if (num < 0.01 || num > maxAmount) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["refundAmount"],
                message: `Amount must be between 0.01 and ${order.pricing.grandTotalAmount}.`,
              });
            }
          }
        }
      }
    });
}

export interface CancelOrderFormValues {
  reason: string;
  restoreStock: boolean;
}

export const cancelOrderFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters.")
    .max(255, "Cancellation reason cannot exceed 255 characters."),
  restoreStock: z.boolean(),
});

export interface RefundOrderFormValues {
  mode: "razorpay" | "manual";
  amount: string;
  speed: "normal" | "optimum";
  razorpayRefundId: string;
  notes: string;
  restoreStock: boolean;
}

export function createRefundOrderSchema(order: OrderDetail) {
  const maxAmount = Number(order.pricing.grandTotalAmount);

  return z
    .object({
      mode: z.enum(["razorpay", "manual"]),
      amount: z.string(),
      speed: z.enum(["normal", "optimum"]),
      razorpayRefundId: z
        .string()
        .max(64, "Razorpay refund ID cannot exceed 64 characters."),
      notes: z.string().max(255, "Notes cannot exceed 255 characters."),
      restoreStock: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const amtTrimmed = data.amount.trim();
      if (amtTrimmed !== "") {
        if (!DECIMAL_TWO_PLACES_REGEX.test(amtTrimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["amount"],
            message: "Enter a valid amount (up to 2 decimal places).",
          });
        } else {
          const num = Number(amtTrimmed);
          if (num < 0.01 || num > maxAmount) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["amount"],
              message: `Refund amount must be between 0.01 and ${order.pricing.grandTotalAmount}.`,
            });
          }
        }
      }

      if (data.mode === "manual") {
        const refId = data.razorpayRefundId.trim();
        if (refId !== "" && !RAZORPAY_REFUND_ID_REGEX.test(refId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["razorpayRefundId"],
            message: "Must match Razorpay refund ID format (rfnd_...).",
          });
        }
      }
    });
}
