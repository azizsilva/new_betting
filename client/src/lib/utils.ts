import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a decimal-string amount as currency (matches backend Decimal strings).
// Default currency is TND, shown as a suffix (e.g. "1,234.56 TND").
export function formatMoney(value: string | number, currency = "TND") {
  const n = typeof value === "string" ? Number(value) : value;
  const amount = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Empty currency → just the number (callers that render their own label).
  if (currency === "") return amount;
  return `${amount} ${currency}`;
}

export function formatOdds(odds: number) {
  return odds.toFixed(2);
}
