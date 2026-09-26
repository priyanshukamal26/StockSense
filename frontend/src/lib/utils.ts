import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "dd MMM yyyy") {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isLate(scheduledDate: string | Date, status: string) {
  if (status === "DONE" || status === "CANCELLED") return false;
  return !isAfter(new Date(scheduledDate), startOfDay(new Date()));
}

export function formatCurrency(amount: number | string, currency = "₹") {
  return `${currency}${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQty(qty: number | string, unit: string) {
  return `${Number(qty).toLocaleString()} ${unit}`;
}

export function getOperationTypeLabel(type: string) {
  const map: Record<string, string> = {
    RECEIPT: "Receipt",
    DELIVERY: "Delivery",
    INTERNAL_TRANSFER: "Internal Transfer",
    ADJUSTMENT: "Adjustment",
  };
  return map[type] ?? type;
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    WAITING: "Waiting",
    READY: "Ready",
    DONE: "Done",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}
