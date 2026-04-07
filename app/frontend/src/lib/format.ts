export function formatCurrency(amount: number, currency: string = 'ILS'): string {
  const symbols: Record<string, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  const symbol = symbols[currency] || currency;
  
  return `${symbol}${amount.toFixed(2)}`;
}
