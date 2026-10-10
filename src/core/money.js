// All money is stored as integer cents. Rounding is always Math.round on cents.
export const toCents = (dollars) => Math.round(Number(dollars) * 100);
export const pctOf = (cents, rate) => Math.round(cents * rate);
export function fmt(cents, symbol = '$') {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const body = (abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${neg ? '-' : ''}${symbol}${body}`;
}
