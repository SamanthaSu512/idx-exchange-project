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

export function formatListedDate(value) {
  if (!value) {
    return 'Listed date unavailable';
  }

  const dateText = String(value);
  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!dateMatch) {
    return 'Listed date unavailable';
  }

  const [, year, month, day] = dateMatch;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (Number.isNaN(date.getTime())) {
    return 'Listed date unavailable';
  }

  return `Listed ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date)}`;
}
