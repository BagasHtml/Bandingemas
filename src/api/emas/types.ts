// Sumber harga/berita (dipakai di /api/prices dan /api/news)
export interface SourceInfo {
  name: string
  displayName?: string
  logo?: string
  favicon?: string | null
  cover?: string | null
  url: string
  urlHomepage?: string
}

// Satu baris harga dari sebuah sumber
export interface PriceItem {
  source: string
  material: string
  materialType: string
  weight: number
  weightUnit: string
  sellPrice: number
  buybackPrice: number | null
  currency: string
  recordedDate: string
  lineKey: string
  url?: string
  displayName?: string
  logo?: string
  favicon?: string | null
  cover?: string | null
  urlHomepage?: string
}

export interface PriceResponse {
  success: true
  data: PriceItem[]
  count?: number
  timestamp: string
  cached?: boolean
  source?: string
  currency?: string
}

export interface ErrorResponse {
  success: false
  error: string
  timestamp: string
}

export interface SourcesResponse {
  data: SourceInfo[]
}

// Riwayat harga = PriceItem + createdAt
export interface HistoryItem extends PriceItem {
  createdAt: string
}

export interface HistoryPagination {
  page: number
  length: number
  total: number
  totalPages: number
}

export interface HistoryResponse {
  success: boolean
  data: HistoryItem[]
  pagination?: HistoryPagination
  error?: string
}

export interface NewsItem {
  source: string
  title: string
  url: string
  publishedAt: string
  summary?: string
  category?: string
  displayName?: string
  logo?: string
  favicon?: string | null
  cover?: string | null
  urlHomepage?: string
}

export interface NewsResponse {
  success: true
  data: NewsItem[]
  count?: number
  timestamp: string
  cached?: boolean
}
