// Format angka ke Rupiah, mis. 1.234.500
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

// Format tanggal ISO ke bentuk Indonesia, mis. 16 Mei 2026
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Format tanggal + jam, untuk timestamp berita
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Format persen dengan tanda, mis. +2,4% atau -1,2%
export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return `${value >= 0 ? '+' : '-'}${formatted}%`
}
