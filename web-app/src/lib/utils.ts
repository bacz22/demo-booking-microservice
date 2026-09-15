import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Định dạng số tiền sang định dạng tiền tệ VND (ví dụ: 120.000 đ)
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`
}

