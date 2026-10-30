import { computed, ref } from 'vue'
import { getPrices } from '@/api/emas/client'
import { hasFresh } from '@/api/cache'
import { median } from '@/lib/stats'
import type { PriceItem } from '@/api/emas/types'

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

// Satu baris harga mentah tanpa seleksi gramasi: untuk analisis pecahan
export interface WeightQuote {
  source: string
  displayName: string
  material: string
  weight: number
  pricePerGram: number
}

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
const quotes = ref<WeightQuote[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null

// Kriteria kesehatan kutipan yang sama dengan pickSpot, tapi tanpa seleksi
// gramasi: satu kutipan rusak jangan meracuni seluruh analisis pecahan.
function healthy(item: PriceItem): boolean {
  return (
    GRAM_UNITS.has(item.weightUnit.toLowerCase()) &&
    item.weight > 0 &&
    item.sellPrice > 0 &&
    !(item.buybackPrice !== null && item.buybackPrice > item.sellPrice)
  )
}

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
        quotes.value = quotes.value.filter((quote) => quote.source !== source)
        for (const item of res.data.filter(healthy)) {
          quotes.value.push({
            source,
            displayName: item.displayName ?? source,
            material: item.material,
            weight: item.weight,
            pricePerGram: Math.round(item.sellPrice / item.weight),
          })
        }
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
  const spots = entries.value
    .filter((entry) => entry.status === 'ok' && entry.spots)
    .flatMap((entry) => entry.spots as SpotPrice[])
    .filter((spot) => spot.material === material)
    .sort((a, b) => a.pricePerGram - b.pricePerGram)

  // Harga yang jauh dari median lintas sumber adalah kutipan basi/rusak
  // (mis. Sakumas Rp 979.278 saat sumber lain Rp 2,4 juta). Jangan biarkan
  // satu angka seperti itu menentukan "termurah" di hero, ticker, atau tabel.
  const mid = median(spots.map((spot) => spot.pricePerGram))
  if (mid === null) return spots
  const plausible = spots.filter(
    (spot) => spot.pricePerGram >= mid * 0.5 && spot.pricePerGram <= mid * 1.5,
  )
  return plausible.length >= 2 ? plausible : spots
}

export function useComparison() {
  const goldSpots = computed(() => spotsFor('gold'))
  const silverSpots = computed(() => spotsFor('silver'))
  const goldQuotes = computed(() =>
    [...quotes.value]
      .filter((quote) => quote.material === 'gold')
      .sort((a, b) => a.weight - b.weight || a.pricePerGram - b.pricePerGram),
  )

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
    goldQuotes,
    hero,
    failedCount,
    isLoading,
    error,
    fetchComparison,
  }
}
