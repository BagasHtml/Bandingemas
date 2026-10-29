import { ref } from 'vue'
import { getPrices } from '@/api/emas/client'
import type { PriceItem } from '@/api/emas/types'

export function usePrices(source: string) {
  const prices = ref<PriceItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPrices() {
    isLoading.value = true
    error.value = null
    try {
      const res = await getPrices(source)
      prices.value = res.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan'
    } finally {
      isLoading.value = false
    }
  }

  return { prices, isLoading, error, fetchPrices }
}
