import { ref } from 'vue'
import { getSources } from '@/api/emas/client'
import type { SourceInfo } from '@/api/emas/types'

export function useSources() {
  const sources = ref<SourceInfo[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSources() {
    isLoading.value = true
    error.value = null
    try {
      sources.value = await getSources()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan'
    } finally {
      isLoading.value = false
    }
  }

  return { sources, isLoading, error, fetchSources }
}
