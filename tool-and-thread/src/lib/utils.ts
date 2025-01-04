import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  return parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) || 0;
}
