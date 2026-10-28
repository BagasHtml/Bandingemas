<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSources } from '@/composables/useSources'
import {
  useWatchlist,
  type WatchDirection,
  type WatchItem,
  type WatchMaterial,
} from '@/composables/useWatchlist'
import { GRAM_UNITS } from '@/composables/useComparison'
import { getPrices } from '@/api/client'
import { hasFresh } from '@/api/cache'
import type { PriceResponse } from '@/api/types'
import { formatRupiah, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, RefreshCw, Trash2 } from '@lucide/vue'

const { sources, isLoading: sourcesLoading, fetchSources } = useSources()
const { items, add, remove } = useWatchlist()

// Bentuk item harga saat ini dari API, untuk cek status tiap pantauan
interface WatchStatus {
  state: 'ok' | 'missing' | 'nobuyback' | 'nodata'
  price: number | null
  met: boolean
  recorded: string | null
}

const priceMap = ref<Record<string, PriceResponse>>({})
const pricesLoading = ref(false)
const pricesError = ref<string | null>(null)

async function loadPrices(): Promise<void> {
  const uniqueSources = [...new Set(items.value.map((item) => item.source))]
  if (uniqueSources.length === 0) return
  pricesLoading.value = true
  pricesError.value = null

  // Sama seperti useComparison: jeda antar request yang benar-benar ke jaringan
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const results = await Promise.allSettled(
    uniqueSources.map((source, index) =>
      (async () => {
        if (!hasFresh(`prices:${source}`)) {
          await delay(index * 250)
        }
        return await getPrices(source)
      })(),
    ),
  )

  const map: Record<string, PriceResponse> = { ...priceMap.value }
  let failures = 0
  results.forEach((result, index) => {
    const source = uniqueSources[index]
    if (!source) return
    if (result.status === 'fulfilled') {
      map[source] = result.value
    } else {
      failures++
    }
  })
  priceMap.value = map
  if (failures === uniqueSources.length) {
    pricesError.value = 'Semua harga pantauan gagal dimuat. Coba lagi.'
  }
  pricesLoading.value = false
}

function statusFor(item: WatchItem): WatchStatus {
  const res = priceMap.value[item.source]
  if (!res) return { state: 'nodata', price: null, met: false, recorded: null }

  // Quote yang buybacknya di atas harga jual dianggap rusak, sama seperti
  // aturan di useComparison
  const match = res.data.find(
    (x) =>
      x.material === item.material &&
      GRAM_UNITS.has(x.weightUnit.toLowerCase()) &&
      Math.abs(x.weight - item.weight) < 0.001 &&
      x.sellPrice > 0 &&
      !(x.buybackPrice !== null && x.buybackPrice > x.sellPrice),
  )
  if (!match) return { state: 'missing', price: null, met: false, recorded: null }

  if (item.direction === 'below') {
    return {
      state: 'ok',
      price: match.sellPrice,
      met: match.sellPrice <= item.target,
      recorded: match.recordedDate,
    }
  }
  if (match.buybackPrice === null || match.buybackPrice <= 0) {
    return { state: 'nobuyback', price: null, met: false, recorded: null }
  }
  return {
    state: 'ok',
    price: match.buybackPrice,
    met: match.buybackPrice >= item.target,
    recorded: match.recordedDate,
  }
}

// Form tambah pantauan
const formSource = ref('')
const formMaterial = ref<WatchMaterial>('gold')
const formWeight = ref('1')
const formTarget = ref('')
const formDirection = ref<WatchDirection>('below')
const formError = ref<string | null>(null)

function submit(): void {
  formError.value = null
  const weight = Number.parseFloat(formWeight.value.replace(',', '.'))
  const target = Number.parseFloat(formTarget.value.replace(',', '.'))
  if (!formSource.value) {
    formError.value = 'Pilih perantara dulu.'
    return
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    formError.value = 'Berat harus angka lebih dari nol.'
    return
  }
  if (!Number.isFinite(target) || target <= 0) {
    formError.value = 'Harga target harus angka lebih dari nol.'
    return
  }

  const sourceInfo = sources.value.find((source) => source.name === formSource.value)
  add({
    source: formSource.value,
    sourceName: sourceInfo?.displayName ?? formSource.value,
    material: formMaterial.value,
    weight,
    target: Math.round(target),
    direction: formDirection.value,
  })
  formTarget.value = ''
}

onMounted(() => {
  fetchSources()
  loadPrices()
})

// Pantauan baru perlu harga terbaru untuk dinilai
watch(
  () => items.value.length,
  () => loadPrices(),
)

function weightLabel(weight: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(weight)
}

function productLabel(item: WatchItem): string {
  return `${item.material === 'gold' ? 'Emas' : 'Perak'} ${weightLabel(item.weight)} gram`
}

function directionLabel(direction: WatchDirection): string {
  return direction === 'below' ? 'beli saat turun ke target' : 'jual saat naik ke target'
}

const hasItems = computed(() => items.value.length > 0)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <header>
      <h1 class="text-2xl font-extrabold tracking-[-0.03em]">Pantauan Harga</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Simpan produk yang kamu incar beserta harga targetnya. Status dicek
        otomatis dari harga terbaru tiap kali halaman dibuka. Daftar disimpan di
        perangkatmu, tanpa akun.
      </p>
    </header>

    <!-- Form tambah pantauan -->
    <section class="rounded-2xl border bg-card p-6">
      <h2 class="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Tambah pantauan
      </h2>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-xs font-semibold text-muted-foreground" for="watch-source">
            Perantara
          </label>
          <Select v-model="formSource">
            <SelectTrigger id="watch-source" class="mt-1.5 h-11 w-full sm:h-9">
              <SelectValue :placeholder="sourcesLoading ? 'Memuat...' : 'Pilih perantara'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="source in sources" :key="source.name" :value="source.name">
                {{ source.displayName ?? source.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="text-xs font-semibold text-muted-foreground" for="watch-material">
            Material
          </label>
          <Select v-model="formMaterial">
            <SelectTrigger id="watch-material" class="mt-1.5 h-11 w-full sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">Emas</SelectItem>
              <SelectItem value="silver">Perak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="text-xs font-semibold text-muted-foreground" for="watch-weight">
            Berat (gram)
          </label>
          <Input
            id="watch-weight"
            v-model="formWeight"
            type="number"
            min="0.01"
            step="0.01"
            class="mt-1.5 h-11 sm:h-9"
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-muted-foreground" for="watch-target">
            Harga target (Rp)
          </label>
          <Input
            id="watch-target"
            v-model="formTarget"
            type="number"
            min="1"
            step="1000"
            placeholder="mis. 2400000"
            class="mt-1.5 h-11 sm:h-9"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-muted-foreground" for="watch-direction">
            Rencana
          </label>
          <Select v-model="formDirection">
            <SelectTrigger id="watch-direction" class="mt-1.5 h-11 w-full sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Beli saat harga turun ke target</SelectItem>
              <SelectItem value="above">Jual saat buyback naik ke target</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p v-if="formError" class="mt-3 text-sm font-medium text-destructive">{{ formError }}</p>

      <Button class="mt-4 h-11 rounded-xl px-5 sm:h-10" :disabled="sourcesLoading" @click="submit">
        <Plus class="size-4" />
        Tambah pantauan
      </Button>
    </section>

    <!-- Daftar pantauan -->
    <section>
      <div class="mb-4 flex items-center justify-between gap-2">
        <h2 class="text-lg font-bold tracking-[-0.02em]">
          Daftar pantauan
          <span v-if="hasItems" class="ml-1 text-sm font-medium text-muted-foreground">
            ({{ items.length }})
          </span>
        </h2>
        <Button
          v-if="hasItems"
          variant="outline"
          size="sm"
          :disabled="pricesLoading"
          @click="loadPrices"
        >
          <RefreshCw class="size-4" :class="{ 'animate-spin': pricesLoading }" />
          Segarkan
        </Button>
      </div>

      <Alert v-if="pricesError && !pricesLoading" variant="destructive" class="mb-4">
        <AlertTitle>Gagal memuat harga</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center gap-3">
          <span>{{ pricesError }}</span>
          <Button size="sm" variant="outline" @click="loadPrices">
            <RefreshCw class="size-4" />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>

      <!-- Loading: kerangka daftar -->
      <div v-if="pricesLoading && hasItems" aria-busy="true" class="space-y-3">
        <span class="sr-only">Memuat harga pantauan...</span>
        <Skeleton v-for="i in Math.min(items.length, 4)" :key="i" class="h-20 w-full rounded-2xl" />
      </div>

      <div v-else-if="hasItems" class="space-y-3">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-5"
        >
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ productLabel(item) }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ item.sourceName }} · {{ directionLabel(item.direction) }} ·
              target {{ formatRupiah(item.target) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3">
            <div class="text-right">
              <p v-if="statusFor(item).state === 'ok'" class="font-bold tabular-nums">
                {{ formatRupiah(statusFor(item).price) }}
              </p>
              <p v-else-if="statusFor(item).state === 'nobuyback'" class="text-xs text-muted-foreground">
                Buyback tidak tersedia
              </p>
              <p v-else-if="statusFor(item).state === 'missing'" class="text-xs text-muted-foreground">
                Produk tidak ditemukan
              </p>
              <p v-else class="text-xs text-muted-foreground">Harga belum tersedia</p>

              <p
                v-if="statusFor(item).state === 'ok' && statusFor(item).recorded"
                class="text-[10px] text-muted-foreground"
              >
                tercatat {{ formatDate(statusFor(item).recorded) }}
              </p>
            </div>

            <Badge
              v-if="statusFor(item).state === 'ok'"
              :class="
                statusFor(item).met
                  ? 'border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : ''
              "
              :variant="statusFor(item).met ? 'outline' : 'secondary'"
            >
              {{ statusFor(item).met ? 'Tercapai' : 'Menunggu' }}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              class="size-11 text-muted-foreground hover:text-destructive"
              :title="`Hapus pantauan ${productLabel(item)}`"
              @click="remove(item.id)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-dashed p-8 text-center">
        <p class="text-sm text-muted-foreground">
          Belum ada pantauan. Tambahkan produk incaranmu di formulir atas, misalnya
          emas 10 gram di Pegadaian dengan target harga tertentu.
        </p>
      </div>
    </section>
  </div>
</template>
