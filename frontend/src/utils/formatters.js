export const numberFormatter = new Intl.NumberFormat('en-US');

export const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'Price unavailable';
  }

  return priceFormatter.format(Number(value));
}

export function formatNumber(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return numberFormatter.format(Number(value));
}
