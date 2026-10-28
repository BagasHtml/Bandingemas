/*
 * Cache in-memory sederhana untuk meredam beban ke API:
 * - TTL per jenis endpoint (harga berubah intraday, riwayat nyaris statis)
 * - Dedup in-flight: beberapa pemanggil untuk kunci sama = satu request
 * - Stale-on-error: kalau upstream gagal, sajikan data kadaluarsa daripada
 *   kosong (upstream API terbukti fluktuatif)
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

// TTL endpoint, dalam milidetik
export const TTL = {
  sources: 10 * 60 * 1000,
  prices: 60 * 1000,
  history: 5 * 60 * 1000,
  news: 5 * 60 * 1000,
} as const

export function hasFresh(key: string): boolean {
  const hit = cache.get(key)
  return hit !== undefined && hit.expiresAt > Date.now()
}

// Kosongkan seluruh cache; dipakai test dan bisa dipakai fitur muat ulang paksa
export function clearCache(): void {
  cache.clear()
  inflight.clear()
}

export function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.data as T)
  }

  const pending = inflight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = loader()
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttlMs })
      inflight.delete(key)
      return data
    })
    .catch((err) => {
      inflight.delete(key)
      // Data kadaluarsa lebih bermanfaat daripada error, mengingat upstream
      // sering gagal sesaat; UI tetap menampilkan sesuatu yang nyata.
      if (hit) {
        return hit.data as T
      }
      throw err
    })

  inflight.set(key, promise)
  return promise
}
