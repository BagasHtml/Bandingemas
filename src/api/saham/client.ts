// Produksi memakai proxy same-origin /api/companies dan /api/stock (Cloudflare
// Pages Function di functions/api); dev memakai docker lokal idx-bei (port 8000).
// VITE_SAHAM_API_URL menimpa keduanya.
import axios from 'axios'
import { cached, TTL } from '../cache'
import type { Company, StockResponse } from './types'

const baseURL =
  import.meta.env.VITE_SAHAM_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')

export const sahamClient = axios.create({
  baseURL,
  timeout: 15_000,
})

// Daftar seluruh emiten: untuk pencarian kode ticker saat menambah pantauan
export async function getCompanies(): Promise<Company[]> {
  return cached('saham:companies', TTL.sources, async () => {
    const { data } = await sahamClient.get<Company[]>('/api/companies')
    return Array.isArray(data) ? data : []
  })
}

// Riwayat OHLCV satu ticker, terbaru terakhir
export async function getStock(ticker: string, limit = 120): Promise<StockResponse> {
  return cached(`saham:stock:${ticker.toUpperCase()}:${limit}`, TTL.prices, async () => {
    try {
      const { data } = await sahamClient.get<StockResponse>(`/api/stock/${ticker.toUpperCase()}`, {
        params: { limit },
      })
      return data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new Error(`Saham ${ticker.toUpperCase()} tidak menemukan riwayat perdagangan`)
      }
      throw err
    }
  })
}
