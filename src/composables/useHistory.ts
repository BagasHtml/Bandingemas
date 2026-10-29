import { ref } from 'vue'
import { getPriceHistory, type HistoryParams } from '@/api/emas/client'
import type { HistoryItem, HistoryPagination } from '@/api/emas/types'

export function useHistory(source: string) {
  const items = ref<HistoryItem[]>([])
  const pagination = ref<HistoryPagination | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchHistory(params: HistoryParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const res = await getPriceHistory(source, params)
      items.value = res.data
      pagination.value = res.pagination ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan'
    } finally {
      isLoading.value = false
    }
  }

  return { items, pagination, isLoading, error, fetchHistory }
}
