export type CurrencyCode = 'USD' | 'GBP' | 'NGN';

export const currencySymbols: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  NGN: '₦'
};

export const formatCurrency = (amount: number, currency: CurrencyCode = 'USD'): string => {
  try {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
};
