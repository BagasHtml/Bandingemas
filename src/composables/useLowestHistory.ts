import { computed, ref, watch } from 'vue'
import { getPriceHistory } from '@/api/emas/client'
import { useComparison, type SpotPrice } from '@/composables/useComparison'

/*
 * Riwayat harga dari sumber termurah. Satu fetch dipakai bersama sparkline
 * 7 hari (hero) dan grafik tren 30 hari. Gramasi dan jenis produk mengikuti
 * baris yang dipilih sebagai termurah: sumber seperti Pegadaian hanya
 * mencatat 0,01 gram, jadi permintaan weight=1 akan selalu kosong.
 */
export interface TrendPoint {
  date: string
  price: number
}

const chartPoints = ref<TrendPoint[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let activeKey: string | null = null
let inflight: Promise<void> | null = null

// useComparison dibangun dari state modul, jadi aman dipanggil di level modul
const { goldSpots } = useComparison()

export const lowest = computed(() => goldSpots.value[0] ?? null)

async function load(spot: SpotPrice): Promise<void> {
  const key = `${spot.source}:${spot.weight}:${spot.materialType}`
  if (inflight || activeKey === key) return
  activeKey = key
  isLoading.value = true
  error.value = null
  inflight = (async () => {
    try {
      const res = await getPriceHistory(spot.source, {
        material: 'gold',
        weight: spot.weight,
        materialType: spot.materialType,
        length: 30,
      })
      // Harga riwayat mengikuti gramasi baris termurah, jadi disamakan ke
      // per gram agar sebanding dengan angka hero. Satu tanggal boleh punya
      // beberapa catatan; yang terakhir menang.
      const byDate = new Map<string, number>()
      if (res.success) {
        for (const item of res.data) {
          const perGram = item.weight > 0 ? item.sellPrice / item.weight : item.sellPrice
          byDate.set(item.recordedDate, Math.round(perGram))
        }
      }
      chartPoints.value = [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, price]) => ({ date, price }))
      if (chartPoints.value.length < 2) {
        error.value = 'Riwayat harga belum cukup untuk digambarkan'
      }
    } catch (err) {
      activeKey = null
      chartPoints.value = []
      error.value = err instanceof Error ? err.message : 'Riwayat harga gagal dimuat'
    } finally {
      isLoading.value = false
      inflight = null
    }
  })()
}

export function useLowestHistory() {
  watch(
    lowest,
    (spot) => {
      if (spot) void load(spot)
    },
    { immediate: true },
  )

  function reload(): void {
    const spot = lowest.value
    if (!spot) return
    if (inflight) return
    activeKey = null
    void load(spot)
  }

  return { chartPoints, isLoading, error, lowest, reload }
}
