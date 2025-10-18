import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with symbol
export function formatCurrency(amount: number | null | undefined, currency: string = 'EUR'): string {
  if (amount === null || amount === undefined) return '-';
  
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    ALL: 'L',
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

// Format date in Albanian format (DD.MM.YYYY)
export function formatAlbanianDate(date: string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '-';
  }
}
