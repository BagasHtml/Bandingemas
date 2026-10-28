import { ref, watch } from 'vue'

/*
 * Pantauan harga: daftar produk + harga target milik pengguna,
 * disimpan di localStorage. Tanpa backend, tanpa akun.
 */

export type WatchMaterial = 'gold' | 'silver'

// "below": pengguna menunggu harga beli turun ke target (untuk beli)
// "above": pengguna menunggu harga buyback naik ke target (untuk jual)
export type WatchDirection = 'below' | 'above'

export interface WatchItem {
  id: string
  source: string
  sourceName: string
  material: WatchMaterial
  weight: number
  target: number
  direction: WatchDirection
  createdAt: number
}

const STORAGE_KEY = 'logam-mulia-watchlist'

function load(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is WatchItem => {
      const candidate = item as Partial<WatchItem>
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.source === 'string' &&
        typeof candidate.target === 'number' &&
        typeof candidate.weight === 'number' &&
        (candidate.material === 'gold' || candidate.material === 'silver') &&
        (candidate.direction === 'below' || candidate.direction === 'above')
      )
    })
  } catch {
    return []
  }
}

const items = ref<WatchItem[]>(load())

// Simpan setiap perubahan; ref dipakai bersama antar halaman
watch(items, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

export function useWatchlist() {
  function add(item: Omit<WatchItem, 'id' | 'createdAt'>): void {
    items.value = [
      ...items.value,
      { ...item, id: crypto.randomUUID(), createdAt: Date.now() },
    ]
  }

  function remove(id: string): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, add, remove }
}
