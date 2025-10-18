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

// Format date in Albanian format (e.g., "1 Tetor 2025")
export function formatAlbanianDate(date: string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    const day = d.getDate(); // No padding, just 1, 2, 3... 31
    const monthNames = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}
