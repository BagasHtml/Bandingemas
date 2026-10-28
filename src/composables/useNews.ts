import { ref } from 'vue'
import { getNews } from '@/api/client'
import type { NewsItem } from '@/api/types'

export function useNews(source = 'investor-id') {
  const news = ref<NewsItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNews() {
    isLoading.value = true
    error.value = null
    try {
      const res = await getNews(source)
      news.value = res.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan'
    } finally {
      isLoading.value = false
    }
  }

  return { news, isLoading, error, fetchNews }
}
