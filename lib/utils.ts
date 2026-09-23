import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "IDR"): string {
  if (currency === "IDR") {
    return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a numeric input with Indonesian thousand dots: e.g. 5000 -> "5.000"
 */
export function formatNumberInput(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const numeric = typeof value === "number" ? Math.round(value) : parseInt(String(value).replace(/\D/g, ""), 10);
  if (isNaN(numeric)) return "";
  return numeric.toLocaleString("id-ID");
}

/**
 * Parses a string with thousand separators into clean integer: e.g. "5.000" -> 5000
 */
export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/\D/g, "");
  return parseInt(cleaned, 10) || 0;
}
