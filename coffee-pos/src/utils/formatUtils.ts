export function formatCurrency(amount: number, currency: string = 'د.ك'): string {
  return `${amount.toFixed(3)} ${currency}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ar-KW');
}
