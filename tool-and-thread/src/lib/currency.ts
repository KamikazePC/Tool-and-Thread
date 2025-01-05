export type CurrencyCode = 'USD' | 'GBP' | 'NGN';

export const currencySymbols: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  NGN: '₦'
};

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currencySymbols[currency]}${amount.toFixed(2)}`;
  }
};
