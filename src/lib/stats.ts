/*
 * Statistik dasar untuk angka harga. Dipakai bersama oleh estimasi,
 * radar selisih, dan efisiensi pecahan.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const lower = sorted[mid - 1]
  const upper = sorted[mid]
  if (lower === undefined || upper === undefined) return null
  return sorted.length % 2 === 1 ? upper : Math.round((lower + upper) / 2)
}
