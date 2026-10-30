import { ref, watch } from 'vue'
import { getStock } from '@/api/saham/client'
import type { StockRecord } from '@/api/saham/types'

/*
 * Pantauan saham daftar kode tiketan milik pengguna + data OHLCV lewat
 * API saham (proxy /api/stock). Disimpan di localStorage, tanpa akun, pola
 * sama dengan pantauan harga emas.
 */

export interface StockEntry {
  status: 'loading' | 'ok' | 'error'
  error?: string
  records: StockRecord[]
  latest: StockRecord | null
}

const STORAGE_KEY = 'logam-mulia-saham'

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is string => typeof item === 'string' && /^[A-Z0-9.-]{1,10}$/.test(item),
    )
  } catch {
    return []
  }
}

const tickers = ref<string[]>(load())
const entries = ref<Record<string, StockEntry>>({})

watch(tickers, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

const inflight = new Set<string>()

async function fetchTicker(ticker: string): Promise<void> {
  const upper = ticker.toUpperCase()
  if (inflight.has(upper)) return
  inflight.add(upper)
  entries.value[upper] = { status: 'loading', records: [], latest: null }
  try {
    const res = await getStock(upper)
    const records = [...(res.records ?? [])].sort((a, b) => a.Date.localeCompare(b.Date))
    entries.value[upper] = {
      status: 'ok',
      records,
      latest: res.latest ?? records.at(-1) ?? null,
    }
  } catch (err) {
    entries.value[upper] = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Gagal memuat data saham',
      records: [],
      latest: null,
    }
  } finally {
    inflight.delete(upper)
  }
}

function add(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase()
  if (!/^[A-Z0-9.-]{1,10}$/.test(upper)) return false
  if (tickers.value.includes(upper)) return true
  tickers.value = [...tickers.value, upper]
  // retrieve asli dijalankan oleh watcher di bawah; pengembalian boolean
  // hanya untuk validasi input
  return true
}

function remove(ticker: string): void {
  tickers.value = tickers.value.filter((item) => item !== ticker)
}

function retry(ticker: string): void {
  void fetchTicker(ticker)
}

// Fetch mengikuti isi pantauan; yang sudah punya entri tidak diulang,
// entri error hanya pasar ulang lewat tombol coba lagi (explicit retry).
watch(
  tickers,
  (list) => {
    for (const ticker of list) {
      if (entries.value[ticker]) continue
      void fetchTicker(ticker)
    }
  },
  { immediate: true },
)

export function useStocks() {
  return { tickers, entries, add, remove, retry }
}
