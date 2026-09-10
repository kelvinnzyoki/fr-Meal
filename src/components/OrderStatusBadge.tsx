import type { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", className: "bg-stone/20 text-ink" },
  PLACED: { label: "Order placed", className: "bg-marigold/20 text-marigoldDark" },
  ACCEPTED: { label: "Accepted", className: "bg-marigold/20 text-marigoldDark" },
  PREPARING: { label: "Preparing", className: "bg-marigold/20 text-marigoldDark" },
  READY_FOR_PICKUP: { label: "Ready for pickup", className: "bg-marigold/30 text-marigoldDark" },
  ASSIGNED: { label: "Rider assigned", className: "bg-sukuma/15 text-sukuma" },
  PICKED_UP: { label: "On the way", className: "bg-sukuma/15 text-sukuma" },
  DELIVERED: { label: "Delivered", className: "bg-sukuma/20 text-sukuma" },
  CANCELLED: { label: "Cancelled", className: "bg-chili/15 text-chili" },
  REJECTED: { label: "Rejected", className: "bg-chili/15 text-chili" },
  EXPIRED: { label: "Expired", className: "bg-chili/10 text-chili" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = STYLES[status] ?? { label: status, className: "bg-stone/20 text-ink" };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}
