import { computed, ref, watch } from 'vue'
import { getPriceHistory } from '@/api/emas/client'
import { useComparison } from '@/composables/useComparison'

/*
 * Riwayat harga 1 gram dari sumber termurah. Satu fetch dipakai bersama
 * sparkline 7 hari (hero) dan grafik tren 30 hari; sumber termurah yang
 * tercatat dipakai agar fetch ulang hanya terjadi saat sumbernya berubah.
 */
export interface TrendPoint {
  date: string
  price: number
}

const chartPoints = ref<TrendPoint[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let activeSource: string | null = null
let inflight: Promise<void> | null = null

// useComparison dibangun dari state modul, jadi aman dipanggil di level modul
const { goldSpots } = useComparison()

export const lowest = computed(() => goldSpots.value[0] ?? null)

async function load(source: string): Promise<void> {
  if (inflight || activeSource === source) return
  activeSource = source
  isLoading.value = true
  error.value = null
  inflight = (async () => {
    try {
      const res = await getPriceHistory(source, {
        material: 'gold',
        weight: 1,
        length: 30,
      })
      // Satu tanggal boleh punya beberapa catatan; yang terakhir menang.
      const byDate = new Map<string, number>()
      if (res.success) {
        for (const item of res.data) byDate.set(item.recordedDate, item.sellPrice)
      }
      chartPoints.value = [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, price]) => ({ date, price }))
      if (chartPoints.value.length < 2) {
        error.value = 'Riwayat harga belum cukup untuk digambarkan'
      }
    } catch (err) {
      activeSource = null
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
      if (spot) void load(spot.source)
    },
    { immediate: true },
  )

  function reload(): void {
    const spot = lowest.value
    if (!spot) return
    if (inflight) return
    activeSource = null
    void load(spot.source)
  }

  return { chartPoints, isLoading, error, lowest, reload }
}
