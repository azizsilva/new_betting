import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a decimal-string amount as currency (matches backend Decimal strings).
export function formatMoney(value: string | number, currency = "₹") {
  const n = typeof value === "string" ? Number(value) : value;
  return `${currency}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatOdds(odds: number) {
  return odds.toFixed(2);
}
