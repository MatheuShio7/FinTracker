import i18n, { normalizeLanguage } from '../i18n'

function getLocale() {
  return normalizeLanguage(i18n.language)
}

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }

  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export function formatNumber(value, options) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }

  return new Intl.NumberFormat(getLocale(), options).format(Number(value))
}

export function formatQuantity(value) {
  return formatNumber(value)
}

export function formatDate(value, options = { dateStyle: 'short' }) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(getLocale(), options).format(date)
}
