<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStocks } from '@/composables/useStocks'
import { getCompanies } from '@/api/saham/client'
import type { Company } from '@/api/saham/types'
import { formatRupiah, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, X } from '@lucide/vue'
import HistoryChart, { type ChartPoint } from '@/components/HistoryChart.vue'

/*
 * Pantauan saham Bursa Indonesia. Satu kode tiketan, satu kartu: harga
 * terkini, perubahan harian, dan grafik gunung yang dibentangkan saat
 * dibuka.
 */

const { tickers, entries, add, remove, retry } = useStocks()

const draft = ref('')
const draftError = ref<string | null>(null)

function submitTicker(): void {
  const value = draft.value.trim()
  if (value === '') return
  const known = companies.value.find((company) => company.code === value.toUpperCase())
  if (companies.value.length > 0 && !known) {
    draftError.value = `Kode ${value.toUpperCase()} tidak ada dalam daftar emiten.`
    return
  }
  draftError.value = null
  add(value)
  draft.value = ''
}

// Daftar emiten dimuat sekali: dipakai untuk validasi dan autocomplete
const companies = ref<Company[]>([])
const companiesLoading = ref(false)
const companiesError = ref<string | null>(null)

async function fetchCompanies(): Promise<void> {
  companiesLoading.value = true
  companiesError.value = null
  try {
    companies.value = await getCompanies()
  } catch (err) {
    companiesError.value = err instanceof Error ? err.message : 'Daftar emiten gagal dimuat'
  } finally {
    companiesLoading.value = false
  }
}

onMounted(fetchCompanies)

// Perubahan harian = close terakhir vs close sebelumnya dari riwayat
function dailyChange(records: { close: number }[]): number | null {
  const last = records.at(-1)
  const previous = records.at(-2)
  if (!last || !previous || previous.close === 0) return null
  return ((last.close - previous.close) / previous.close) * 100
}

function chartPoints(records: { Date: string; close: number }[]): ChartPoint[] {
  return records.map((record) => ({ date: record.Date, price: record.close }))
}

function stats(records: { close: number }[]): { min: number; max: number; change: number } | null {
  if (records.length < 2) return null
  const closes = records.map((record) => record.close)
  const first = closes[0]
  const last = closes.at(-1)
  if (first === undefined || last === undefined || first === 0) return null
  return {
    min: Math.min(...closes),
    max: Math.max(...closes),
    change: ((last - first) / first) * 100,
  }
}

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
})

const expanded = ref<string | null>(null)

function toggleChart(ticker: string): void {
  expanded.value = expanded.value === ticker ? null : ticker
}

const emptyWatchlist = computed(() => tickers.value.length === 0)
</script>

<template>
  <div class="flex flex-col gap-10">
    <section class="border-b pb-8">
      <h1 class="text-lg font-semibold tracking-tight">Pantauan saham</h1>
      <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Pantau kode tiketan Bursa Indonesia memakai data OHLCV harian dari
        ihsg.midoriresearch.com. Ticker dan harga
        berasal dari data riil, bukan perkiraan.
      </p>

      <form class="mt-6 flex max-w-md flex-wrap items-start gap-2" @submit.prevent="submitTicker">
        <div class="min-w-0 flex-1 basis-56">
          <label for="saham-ticker" class="mb-2 block text-xs font-medium text-muted-foreground">
            Kode tiketan
          </label>
          <Input
            id="saham-ticker"
            v-model="draft"
            type="text"
            class="h-11 uppercase"
            placeholder="contoh: BBRI"
            autocapitalize="characters"
            list="saham-companies"
            aria-describedby="saham-ticker-help"
          />
          <datalist id="saham-companies">
            <option
              v-for="company in companies.slice(0, 500)"
              :key="company.code"
              :value="company.code"
            >
              {{ company.name }}
            </option>
          </datalist>
          <p id="saham-ticker-help" class="mt-2 text-xs text-muted-foreground">
            <template v-if="draftError">{{ draftError }}</template>
            <template v-else-if="companiesLoading">Memuat daftar emiten...</template>
            <template v-else-if="companiesError"
              >{{ companiesError }}. Tiketan tetap bisa ditambah manual.</template
            >
            <template v-else>{{ companies.length }} emiten terbaca.</template>
          </p>
        </div>
        <div class="flex flex-col justify-end">
          <span class="mb-2 hidden text-xs sm:block sm:invisible" aria-hidden="true">&nbsp;</span>
          <Button type="submit" class="h-11">Tambah pantauan</Button>
        </div>
      </form>
    </section>

    <section aria-label="Daftar pantauan saham">
      <p v-if="emptyWatchlist" class="text-sm text-muted-foreground">
        Belum ada saham yang dipantau. Tambahkan kode tiketan di atas, misalnya BBRI, untuk mulai
        melihat harga riilnya.
      </p>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="ticker in tickers"
          :key="ticker"
          class="rounded-lg border p-5"
          :aria-busy="entries[ticker]?.status === 'loading'"
        >
          <div v-if="entries[ticker]?.status === 'loading'" class="flex flex-col gap-3">
            <span class="sr-only">Memuat data {{ ticker }}...</span>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">{{ ticker }}</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                :aria-label="`Hapus ${ticker} dari pantauan`"
                @click="remove(ticker)"
              >
                <X class="size-4" />
              </Button>
            </div>
            <Skeleton class="h-7 w-32" />
            <Skeleton class="h-4 w-24" />
          </div>

          <div v-else-if="entries[ticker]?.status === 'error'" class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold">{{ ticker }}</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                :aria-label="`Hapus ${ticker} dari pantauan`"
                @click="remove(ticker)"
              >
                <X class="size-4" />
              </Button>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground">
              {{ entries[ticker]?.error }}.
            </p>
            <div>
              <Button size="sm" variant="outline" @click="retry(ticker)">
                <RefreshCw class="size-4" />
                Coba lagi
              </Button>
            </div>
          </div>

          <template v-else-if="entries[ticker]?.latest">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate text-sm font-semibold">{{ ticker }}</h2>
                <p class="truncate text-xs text-muted-foreground">
                  {{ entries[ticker]?.latest?.StockName }}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 shrink-0"
                :aria-label="`Hapus ${ticker} dari pantauan`"
                @click="remove(ticker)"
              >
                <X class="size-4" />
              </Button>
            </div>

            <div class="mt-4 flex items-baseline justify-between gap-3">
              <p class="text-2xl font-bold tabular-nums tracking-tight">
                {{ formatRupiah(entries[ticker]?.latest?.close) }}
              </p>
              <p
                v-if="dailyChange(entries[ticker]?.records ?? []) !== null"
                class="text-sm font-semibold tabular-nums"
                :class="
                  (dailyChange(entries[ticker]?.records ?? []) ?? 0) >= 0
                    ? 'text-positive'
                    : 'text-negative'
                "
              >
                {{ (dailyChange(entries[ticker]?.records ?? []) ?? 0) >= 0 ? '+' : '-'
                }}{{
                  Math.abs(dailyChange(entries[ticker]?.records ?? []) ?? 0).toLocaleString(
                    'id-ID',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )
                }}%
              </p>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              penutupan {{ formatDate(entries[ticker]?.latest?.Date) }} · volume
              {{ compactFormatter.format(entries[ticker]?.latest?.volume ?? 0) }}
            </p>

            <Button
              variant="outline"
              size="sm"
              class="mt-4"
              :aria-expanded="expanded === ticker"
              @click="toggleChart(ticker)"
            >
              {{ expanded === ticker ? 'Tutup grafik' : 'Lihat grafik' }}
            </Button>

            <div v-if="expanded === ticker" class="mt-4">
              <HistoryChart
                :data="chartPoints(entries[ticker]?.records ?? [])"
                :grad-id="`saham-${ticker}`"
              />
              <dl
                v-if="stats(entries[ticker]?.records ?? [])"
                class="mt-4 flex flex-wrap gap-x-8 gap-y-3"
              >
                <div>
                  <dt class="text-xs text-muted-foreground">terendah</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {{ formatRupiah(stats(entries[ticker]?.records ?? [])?.min) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">tertinggi</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {{ formatRupiah(stats(entries[ticker]?.records ?? [])?.max) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">perubahan periode</dt>
                  <dd
                    class="text-sm font-semibold tabular-nums"
                    :class="
                      (stats(entries[ticker]?.records ?? [])?.change ?? 0) >= 0
                        ? 'text-positive'
                        : 'text-negative'
                    "
                  >
                    {{ (stats(entries[ticker]?.records ?? [])?.change ?? 0) >= 0 ? '+' : ''
                    }}{{
                      (stats(entries[ticker]?.records ?? [])?.change ?? 0).toLocaleString('id-ID', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })
                    }}%
                  </dd>
                </div>
              </dl>
            </div>
          </template>
        </article>
      </div>
    </section>
  </div>
</template>
