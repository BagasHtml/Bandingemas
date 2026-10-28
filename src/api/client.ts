import axios from 'axios'
import { cached, TTL } from './cache'
import type {
  ErrorResponse,
  HistoryResponse,
  NewsResponse,
  PriceResponse,
  SourceInfo,
  SourcesResponse,
} from './types'

const client = axios.create({
  baseURL: 'https://logam-mulia-api.iamutaki.workers.dev',
  timeout: 15_000,
})

// Daftar sumber harga yang tersedia
export async function getSources(): Promise<SourceInfo[]> {
  return cached(`sources`, TTL.sources, async () => {
    const { data } = await client.get<SourcesResponse>('/api/prices')
    return data.data
  })
}

// Harga saat ini dari satu sumber
export async function getPrices(source: string): Promise<PriceResponse> {
  return cached(`prices:${source}`, TTL.prices, async () => {
    const { data } = await client.get<PriceResponse | ErrorResponse>(`/api/prices/${source}`)
    if (!data.success) {
      throw new Error(data.error ?? 'Gagal memuat harga')
    }
    return data
  })
}

export interface HistoryParams {
  page?: number
  length?: number
  weight?: number
  material?: string
  materialType?: string
}

// Riwayat harga satu sumber, dengan pagination + filter
export async function getPriceHistory(
  source: string,
  params: HistoryParams = {},
): Promise<HistoryResponse> {
  const key = `history:${source}:${params.page ?? 1}:${params.length ?? 20}:${params.weight ?? ''}:${params.material ?? ''}:${params.materialType ?? ''}`
  return cached(key, TTL.history, async () => {
    const { data } = await client.get<HistoryResponse>(`/api/prices/${source}/history`, { params })
    if (!data.success) {
      throw new Error(data.error ?? 'Gagal memuat riwayat harga')
    }
    return data
  })
}

// Daftar sumber berita
export async function getNewsSources(): Promise<SourceInfo[]> {
  return cached(`news-sources`, TTL.news, async () => {
    const { data } = await client.get<SourcesResponse>('/api/news')
    return data.data
  })
}

// Daftar berita dari satu sumber
export async function getNews(source = 'investor-id'): Promise<NewsResponse> {
  return cached(`news:${source}`, TTL.news, async () => {
    const { data } = await client.get<NewsResponse | ErrorResponse>(`/api/news/${source}`)
    if (!data.success) {
      throw new Error(data.error ?? 'Gagal memuat berita')
    }
    return data
  })
}
