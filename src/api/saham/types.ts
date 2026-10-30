// Tipe respons API saham. Proxy /api/companies dan /api/stock (functions/api)
// memetakan data ihsg ke bentuk ini; hanya subhimpunan yang dipakai UI yang
// dideklarasikan.

// Profil perusahaan dari daftar emiten
export interface Company {
  code: string
  name: string
  sector: string
  sub_sector?: string
  per?: number
  roe?: number
}

// Satu hari perdagangan OHLCV
export interface StockRecord {
  Date: string
  time?: string
  StockCode: string
  StockName?: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  NetForeignFlow?: number
}

export interface StockResponse {
  ticker: string
  records: StockRecord[]
  latest: StockRecord | null
}
