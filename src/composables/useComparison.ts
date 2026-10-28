import { computed, ref } from 'vue'
import { getPrices } from '@/api/client'
import { hasFresh } from '@/api/cache'
import type { PriceItem } from '@/api/types'

// Harga spot satu material dari satu sumber, dinormalisasi per gram
export interface SpotPrice {
  source: string
  displayName: string
  material: string
  materialType: string
  pricePerGram: number
  buybackPerGram: number | null
  recordedDate: string
  urlHomepage?: string
}

export interface ComparisonEntry {
  source: string
  status: 'ok' | 'error'
  spots?: SpotPrice[]
  error?: string
}

// Urutan preferensi untuk hero: sumber resmi/lengkap dulu
const FEATURED_SOURCES = [
  'pegadaian',
  'anekalogam',
  'galeri24',
  'hartadinataabadi',
  'sampoernagold',
  'cermati',
  'bankbsi',
  'hargaemas-com',
  'hargaemas-net',
  'hargaemas-org',
  'sakumas',
  'kursdolar',
] as const

export const GRAM_OPTIONS = [0.5, 1, 2, 5, 10, 25, 50, 100]

// Satuan berat di API tidak seragam: "gram" (Pegadaian) dan "gr" (lainnya)
export const GRAM_UNITS = new Set(['gram', 'gr', 'g'])

function pickSpot(items: PriceItem[], source: string, material: string): SpotPrice | null {
  const candidates = items.filter(
    (item) =>
      item.material === material &&
      GRAM_UNITS.has(item.weightUnit.toLowerCase()) &&
      item.weight > 0 &&
      item.sellPrice > 0 &&
      // Tolak quote tidak konsisten: buyback di atas harga jual adalah
      // hasil scraping yang rusak, bukan harga yang bisa dipercaya.
      !(item.buybackPrice !== null && item.buybackPrice > item.sellPrice),
  )
  if (candidates.length === 0) return null

  // Pilih item dengan berat terdekat ke 1 gram
  const best = candidates.reduce((a, b) =>
    Math.abs(b.weight - 1) < Math.abs(a.weight - 1) ? b : a,
  )

  return {
    source,
    displayName: best.displayName ?? source,
    material,
    materialType: best.materialType,
    pricePerGram: Math.round(best.sellPrice / best.weight),
    buybackPerGram:
      best.buybackPrice && best.buybackPrice > 0
        ? Math.round(best.buybackPrice / best.weight)
        : null,
    recordedDate: best.recordedDate,
    urlHomepage: best.urlHomepage,
  }
}

// State modul: satu fetch dipakai bersama oleh ticker, hero, tabel, kalkulator
const entries = ref<ComparisonEntry[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null

async function fetchComparison() {
  if (inflight) return inflight
  isLoading.value = true
  error.value = null
  inflight = (async () => {
    try {
      // Jeda antar request yang benar-benar ke jaringan: upstream membatasi
      // burst paralel serentak. Cache fresh tidak perlu jeda.
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
      const tasks = FEATURED_SOURCES.map((source, index) => async () => {
        if (!hasFresh(`prices:${source}`)) {
          await delay(index * 250)
        }
        const res = await getPrices(source)
        const spots = [
          pickSpot(res.data, source, 'gold'),
          pickSpot(res.data, source, 'silver'),
        ].filter((spot): spot is SpotPrice => spot !== null)
        if (spots.length === 0) throw new Error('Tidak ada data emas/perak per gram')
        return spots
      })

      const results = await Promise.allSettled(tasks.map((task) => task()))

      entries.value = results.map((result, index) => {
        const source = FEATURED_SOURCES[index] ?? 'unknown'
        if (result.status === 'fulfilled') {
          return { source, status: 'ok' as const, spots: result.value }
        }
        const message =
          result.reason instanceof Error ? result.reason.message : 'Gagal memuat harga'
        return { source, status: 'error' as const, error: message }
      })

      if (!entries.value.some((entry) => entry.status === 'ok')) {
        error.value = 'Semua sumber harga sedang tidak tersedia'
      }
    } finally {
      isLoading.value = false
      inflight = null
    }
  })()
  return inflight
}

function spotsFor(material: string): SpotPrice[] {
  return entries.value
    .filter((entry) => entry.status === 'ok' && entry.spots)
    .flatMap((entry) => entry.spots as SpotPrice[])
    .filter((spot) => spot.material === material)
    .sort((a, b) => a.pricePerGram - b.pricePerGram)
}

export function useComparison() {
  const goldSpots = computed(() => spotsFor('gold'))
  const silverSpots = computed(() => spotsFor('silver'))

  // Sumber pertama yang berhasil sesuai urutan preferensi, untuk hero
  const hero = computed(() => {
    for (const source of FEATURED_SOURCES) {
      const entry = entries.value.find((e) => e.source === source && e.status === 'ok' && e.spots)
      const spot = entry?.spots?.find((s) => s.material === 'gold')
      if (spot) return spot
    }
    return null
  })

  const failedCount = computed(
    () => entries.value.filter((entry) => entry.status === 'error').length,
  )

  return {
    goldSpots,
    silverSpots,
    hero,
    failedCount,
    isLoading,
    error,
    fetchComparison,
  }
}
