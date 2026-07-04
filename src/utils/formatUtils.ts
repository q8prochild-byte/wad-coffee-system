export function formatCurrency(amount: number, currency: string = 'د.ك'): string {
  return `${amount.toFixed(3)} ${currency}`;
}

export function formatQuantity(num: number): string {
  // يعرض الأرقام الصحيحة بدون فواصل عشرية، ويحذف الأصفار الزائدة من الكسور
  const rounded = Math.round(num * 1000) / 1000;
  return rounded % 1 === 0 ? String(rounded) : String(parseFloat(rounded.toFixed(3)));
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ar-KW');
}
