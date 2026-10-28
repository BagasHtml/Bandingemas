import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached, clearCache, hasFresh } from '../cache'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  // Cache tingkat modul dipakai bersama antar test, kosongkan tiap kasus
  clearCache()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cached', () => {
  it('menyajikan cache dalam TTL tanpa memanggil loader ulang', async () => {
    const loader = vi.fn<() => Promise<{ nilai: number }>>(async () => ({ nilai: 1 }))

    const pertama = await cached('kunci', 60_000, loader)
    vi.advanceTimersByTime(30_000)
    const kedua = await cached('kunci', 60_000, loader)

    expect(pertama).toEqual({ nilai: 1 })
    expect(kedua).toEqual({ nilai: 1 })
    expect(loader).toHaveBeenCalledTimes(1)
    expect(hasFresh('kunci')).toBe(true)
  })

  it('memanggil ulang loader setelah TTL kadaluarsa', async () => {
    const loader = vi.fn<() => Promise<{ nilai: number }>>(async () => ({ nilai: 1 }))

    await cached('kunci', 60_000, loader)
    vi.advanceTimersByTime(61_000)
    expect(hasFresh('kunci')).toBe(false)
    await cached('kunci', 60_000, loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('menggabungkan pemanggilan bersamaan untuk kunci sama menjadi satu request', async () => {
    // Loader diselesaikan segera; dedup tetap terjadi karena pemanggilan
    // kedua masuk sebelum promise pertama selesai disetel
    const loader = vi.fn<() => Promise<{ nilai: number }>>(async () => ({ nilai: 1 }))

    const [a, b] = await Promise.all([
      cached('kunci', 60_000, loader),
      cached('kunci', 60_000, loader),
    ])

    expect(a).toEqual({ nilai: 1 })
    expect(b).toEqual({ nilai: 1 })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('menyajikan data kadaluarsa saat loader gagal (stale-on-error)', async () => {
    const loaderOk = vi.fn<() => Promise<{ nilai: number }>>(async () => ({ nilai: 1 }))
    await cached('kunci', 60_000, loaderOk)

    // Kadaluarsakan cache, lalu loader baru gagal
    vi.advanceTimersByTime(61_000)
    const loaderGagal = vi.fn<() => Promise<{ nilai: number }>>(async () => {
      throw new Error('upstream down')
    })

    const hasil = await cached('kunci', 60_000, loaderGagal)
    expect(hasil).toEqual({ nilai: 1 })
  })

  it('melempar error saat tidak ada cache dan loader gagal', async () => {
    const loader = vi.fn<() => Promise<{ nilai: number }>>(async () => {
      throw new Error('upstream down')
    })

    await expect(cached('kunci', 60_000, loader)).rejects.toThrow('upstream down')
  })

  it('kunci berbeda tidak saling mempengaruhi', async () => {
    const loaderA = vi.fn<() => Promise<{ nilai: string }>>(async () => ({ nilai: 'a' }))
    const loaderB = vi.fn<() => Promise<{ nilai: string }>>(async () => ({ nilai: 'b' }))

    await cached('a', 60_000, loaderA)
    await cached('b', 60_000, loaderB)

    expect(await cached('a', 60_000, loaderA)).toEqual({ nilai: 'a' })
    expect(await cached('b', 60_000, loaderB)).toEqual({ nilai: 'b' })
    expect(loaderA).toHaveBeenCalledTimes(1)
    expect(loaderB).toHaveBeenCalledTimes(1)
  })
})
