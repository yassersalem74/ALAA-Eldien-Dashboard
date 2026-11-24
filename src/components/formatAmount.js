export default function formatAmount(value, currency) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—'
  if (/^[A-Z]{3}$/i.test(currency ?? '')) {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value)
  }
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)
}
