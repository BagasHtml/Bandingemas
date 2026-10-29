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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, RefreshCw, Trash2 } from '@lucide/vue'

const { sources, isLoading: sourcesLoading, fetchSources } = useSources()
const { items, add, remove } = useWatchlist()

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

  // Quote dengan buyback di atas harga jual dianggap rusak, sama seperti useComparison
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

const formSource = ref('')
const formMaterial = ref<WatchMaterial>('gold')
const formWeight = ref<number | string>('1')
const formTarget = ref<number | string>('')
const formDirection = ref<WatchDirection>('below')
const formError = ref<string | null>(null)

// Input number mengembalikan angka; ketikan manual bisa berupa teks berkoma
function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseFloat(value.replace(',', '.'))
}

function submit(): void {
  formError.value = null
  const weight = toNumber(formWeight.value)
  const target = toNumber(formTarget.value)
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

const rows = computed(() => items.value.map((item) => ({ item, status: statusFor(item) })))

function focusForm(): void {
  const el = document.getElementById('watch-source')
  el?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'center',
  })
  el?.focus({ preventScroll: true })
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <header class="border-b pb-6">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Pantauan harga</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Simpan produk incaran beserta harga targetnya. Status dicek dari harga terbaru tiap kali
        halaman dibuka. Daftar tersimpan di perangkatmu, tanpa akun.
      </p>
    </header>

    <div class="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-16">
      <section aria-labelledby="tambah-title" class="lg:sticky lg:top-6">
        <h2 id="tambah-title" class="border-b pb-3 text-sm font-semibold">Tambah pantauan</h2>

        <form class="mt-5 flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <label for="watch-source" class="text-xs font-medium text-muted-foreground">
              Perantara
            </label>
            <Select v-model="formSource">
              <SelectTrigger id="watch-source" class="w-full data-[size=default]:h-11">
                <SelectValue :placeholder="sourcesLoading ? 'Memuat...' : 'Pilih perantara'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="source in sources" :key="source.name" :value="source.name">
                    {{ source.displayName ?? source.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="watch-material" class="text-xs font-medium text-muted-foreground">
              Material
            </label>
            <Select v-model="formMaterial">
              <SelectTrigger id="watch-material" class="w-full data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="gold">Emas</SelectItem>
                  <SelectItem value="silver">Perak</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="watch-weight" class="text-xs font-medium text-muted-foreground">
                Berat (gram)
              </label>
              <Input
                id="watch-weight"
                v-model="formWeight"
                type="number"
                min="0.01"
                step="0.01"
                class="h-11 tabular-nums"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="watch-target" class="text-xs font-medium text-muted-foreground">
                Target (Rp)
              </label>
              <Input
                id="watch-target"
                v-model="formTarget"
                type="number"
                min="0"
                step="1000"
                placeholder="2400000"
                class="h-11 tabular-nums"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="watch-direction" class="text-xs font-medium text-muted-foreground">
              Rencana
            </label>
            <Select v-model="formDirection">
              <SelectTrigger id="watch-direction" class="w-full data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="below">Beli saat harga turun ke target</SelectItem>
                  <SelectItem value="above">Jual saat buyback naik ke target</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <p v-if="formError" role="alert" class="text-sm font-medium text-destructive">
            {{ formError }}
          </p>

          <Button type="submit" class="h-11 w-full" :disabled="sourcesLoading">
            <Plus class="size-4" />
            Tambah pantauan
          </Button>
        </form>
      </section>

      <section aria-labelledby="daftar-title">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <h2 id="daftar-title" class="text-sm font-semibold">
            Daftar pantauan
            <span v-if="hasItems" class="ml-1 font-normal tabular-nums text-muted-foreground">
              {{ items.length }}
            </span>
          </h2>
          <Button
            v-if="hasItems"
            variant="outline"
            size="sm"
            class="h-9"
            :disabled="pricesLoading"
            @click="loadPrices"
          >
            <RefreshCw class="size-4" :class="{ 'animate-spin': pricesLoading }" />
            Segarkan
          </Button>
        </div>

        <Alert v-if="pricesError && !pricesLoading" variant="destructive" class="mt-4">
          <AlertTitle>Gagal memuat harga</AlertTitle>
          <AlertDescription class="flex flex-wrap items-center gap-3">
            <span>{{ pricesError }}</span>
            <Button size="sm" variant="outline" @click="loadPrices">
              <RefreshCw class="size-4" />
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>

        <div v-if="pricesLoading && hasItems" aria-busy="true" class="mt-2">
          <span class="sr-only">Memuat harga pantauan...</span>
          <Skeleton
            v-for="i in Math.min(items.length, 4)"
            :key="i"
            class="mt-2 h-16 w-full rounded-none"
          />
        </div>

        <ul v-else-if="hasItems" class="divide-y">
          <li
            v-for="{ item, status } in rows"
            :key="item.id"
            class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold">{{ productLabel(item) }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {{ item.sourceName }} · {{ directionLabel(item.direction) }} · target
                {{ formatRupiah(item.target) }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-4 sm:justify-end">
              <div class="text-left sm:text-right">
                <p v-if="status.state === 'ok'" class="text-sm font-semibold tabular-nums">
                  {{ formatRupiah(status.price) }}
                </p>
                <p v-else-if="status.state === 'nobuyback'" class="text-xs text-muted-foreground">
                  Buyback tidak tersedia
                </p>
                <p v-else-if="status.state === 'missing'" class="text-xs text-muted-foreground">
                  Produk tidak ditemukan
                </p>
                <p v-else class="text-xs text-muted-foreground">Harga belum tersedia</p>

                <p v-if="status.recorded" class="text-[11px] tabular-nums text-muted-foreground">
                  tercatat {{ formatDate(status.recorded) }}
                </p>
              </div>

              <Badge
                v-if="status.state === 'ok'"
                :variant="status.met ? 'outline' : 'secondary'"
                :class="
                  status.met ? 'border-positive/40 bg-positive-surface text-positive' : ''
                "
              >
                {{ status.met ? 'Tercapai' : 'Menunggu' }}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                class="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                :aria-label="`Hapus pantauan ${productLabel(item)}`"
                @click="remove(item.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </li>
        </ul>

        <div v-else class="flex flex-col items-start gap-4 py-10">
          <p class="max-w-md text-sm leading-relaxed text-muted-foreground">
            Belum ada pantauan. Tambahkan produk incaranmu, misalnya emas 10 gram di Pegadaian
            dengan target harga tertentu.
          </p>
          <Button variant="outline" @click="focusForm">Tambah pantauan</Button>
        </div>
      </section>
    </div>
  </div>
</template>
