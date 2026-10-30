<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrices } from '@/composables/usePrices'
import { useHistory } from '@/composables/useHistory'
import { formatRupiah, formatDate } from '@/lib/format'
import { LOGOS } from '@/lib/logos'
import { safeExternalUrl } from '@/lib/url'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import HistoryChart, { type ChartPoint } from '@/components/HistoryChart.vue'
import { ArrowLeft, ArrowUpRight, RefreshCw } from '@lucide/vue'

const route = useRoute()
const sourceName = computed(() => String(route.params.source))

const {
  prices,
  isLoading: pricesLoading,
  error: pricesError,
  fetchPrices,
} = usePrices(sourceName.value)

const {
  items: historyItems,
  isLoading: historyLoading,
  fetchHistory,
} = useHistory(sourceName.value)

onMounted(() => {
  fetchPrices()
})

const materials = computed(() => {
  const set = new Set(prices.value.map((item) => item.material))
  return [...set]
})

const selectedMaterial = ref<string>('all')

const filteredPrices = computed(() => {
  if (selectedMaterial.value === 'all') return prices.value
  return prices.value.filter((item) => item.material === selectedMaterial.value)
})

// Kombinasi unik produk (material + tipe + berat) untuk grafik
interface ProductKey {
  material: string
  materialType: string
  weight: number
  weightUnit: string
}

function productKeyOf(product: ProductKey): string {
  return `${product.material}|${product.materialType}|${product.weight}`
}

function materialLabel(material: string): string {
  if (material === 'gold') return 'Emas'
  if (material === 'silver') return 'Perak'
  return material
}

// API kadang mengirim materialType "unknown"; sebut materialnya saja
function typeLabel(item: { material: string; materialType: string }): string {
  const type = item.materialType.trim()
  if (type.length === 0 || type.toLowerCase() === 'unknown') {
    return item.material === 'silver' ? 'Perak' : 'Emas'
  }
  return type
}

const products = computed<ProductKey[]>(() => {
  const map = new Map<string, ProductKey>()
  for (const item of filteredPrices.value) {
    map.set(productKeyOf(item), {
      material: item.material,
      materialType: item.materialType,
      weight: item.weight,
      weightUnit: item.weightUnit,
    })
  }
  return [...map.values()]
})

const selectedProduct = ref<string>('')

watch(selectedMaterial, () => {
  selectedProduct.value = ''
})

const activeProduct = computed<ProductKey | null>(() => {
  const found = products.value.find((p) => productKeyOf(p) === selectedProduct.value)
  return found ?? products.value[0] ?? null
})

watch(
  activeProduct,
  (product) => {
    if (!product) return
    fetchHistory({
      material: product.material,
      materialType: product.materialType,
      weight: product.weight,
      length: 365,
    })
  },
  { immediate: true },
)

// Ubah riwayat menjadi titik grafik: urut naik, buang tanggal duplikat
const chartData = computed<ChartPoint[]>(() => {
  const byDate = new Map<string, number>()
  for (const item of historyItems.value) {
    byDate.set(item.recordedDate, item.sellPrice)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, price]) => ({ date, price }))
})

const displayName = computed(() => prices.value[0]?.displayName ?? sourceName.value)

const lastUpdated = computed(() => {
  const dates = prices.value.map((item) => item.recordedDate).sort()
  return dates[dates.length - 1] ?? null
})
</script>

<template>
  <div class="flex flex-col gap-10 sm:gap-12">
    <header class="border-b pb-6">
      <RouterLink
        to="/"
        class="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        Semua perantara
      </RouterLink>

      <div class="mt-2 flex items-center gap-3">
        <span
          class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-white p-1"
        >
          <img
            v-if="LOGOS[sourceName]"
            :src="LOGOS[sourceName]"
            :alt="`Logo ${displayName}`"
            class="size-full object-contain"
          />
        </span>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ displayName }}</h1>
      </div>

      <p v-if="lastUpdated" class="mt-2 text-sm text-muted-foreground">
        Pembaruan terakhir {{ formatDate(lastUpdated) }}
        <template v-if="safeExternalUrl(prices[0]?.urlHomepage)">
          <span aria-hidden="true"> · </span>
          <a
            :href="safeExternalUrl(prices[0]?.urlHomepage)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
          >
            situs resmi
            <ArrowUpRight class="size-3.5" aria-hidden="true" />
          </a>
        </template>
      </p>
    </header>

    <Alert v-if="pricesError && !pricesLoading" variant="destructive">
      <AlertTitle>Gagal memuat harga dari sumber ini</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <span>{{ pricesError }}</span>
        <Button size="sm" variant="outline" @click="fetchPrices">
          <RefreshCw class="size-4" />
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>

    <div v-if="pricesLoading" aria-busy="true">
      <span class="sr-only">Memuat harga {{ displayName }}...</span>
      <div class="flex flex-col gap-2">
        <Skeleton v-for="i in 6" :key="i" class="h-11 w-full rounded-none" />
      </div>
    </div>

    <template v-else-if="prices.length > 0">
      <section aria-labelledby="harga-sekarang-title" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <div>
            <h2 id="harga-sekarang-title" class="text-sm font-semibold">Harga saat ini</h2>
            <p class="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {{ filteredPrices.length }} produk
            </p>
          </div>

          <div class="flex items-center gap-2">
            <label for="material-filter" class="text-xs text-muted-foreground">Material</label>
            <Select v-model="selectedMaterial">
              <SelectTrigger
                id="material-filter"
                class="w-32 data-[size=default]:h-11 sm:data-[size=default]:h-9"
              >
                <SelectValue placeholder="Semua material" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem v-for="material in materials" :key="material" :value="material">
                    {{ materialLabel(material) }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" class="h-9 text-xs font-medium text-muted-foreground">
                Produk
              </TableHead>
              <TableHead scope="col" class="h-9 text-xs font-medium text-muted-foreground">
                Berat
              </TableHead>
              <TableHead
                scope="col"
                class="h-9 text-right text-xs font-medium text-muted-foreground"
              >
                Harga jual
              </TableHead>
              <TableHead
                scope="col"
                class="h-9 text-right text-xs font-medium text-muted-foreground"
              >
                Buyback
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="item in filteredPrices"
              :key="item.lineKey || item.materialType + item.weight"
            >
              <TableCell class="font-medium">{{ typeLabel(item) }}</TableCell>
              <TableCell class="tabular-nums text-muted-foreground">
                {{ item.weight }} {{ item.weightUnit }}
              </TableCell>
              <TableCell class="text-right font-semibold tabular-nums">
                {{ formatRupiah(item.sellPrice) }}
              </TableCell>
              <TableCell class="text-right tabular-nums text-muted-foreground">
                {{ formatRupiah(item.buybackPrice) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby="riwayat-title" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <div>
            <h2 id="riwayat-title" class="text-sm font-semibold">Riwayat harga</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              365 hari terakhir, harga jual per produk
            </p>
          </div>

          <Select v-if="products.length > 1" v-model="selectedProduct">
            <SelectTrigger
              class="w-60 data-[size=default]:h-11 sm:data-[size=default]:h-9"
              aria-label="Pilih produk"
            >
              <SelectValue placeholder="Produk otomatis" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="product in products"
                  :key="productKeyOf(product)"
                  :value="productKeyOf(product)"
                >
                  {{ typeLabel(product) }} ({{ product.weight }} {{ product.weightUnit }})
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div v-if="historyLoading" aria-busy="true" class="py-2">
          <span class="sr-only">Memuat riwayat harga...</span>
          <Skeleton class="h-72 w-full rounded-none" />
        </div>
        <p v-else-if="chartData.length < 2" class="py-8 text-sm text-muted-foreground">
          Data riwayat belum cukup untuk digambarkan. Grafik muncul setelah sumber mencatat harga
          minimal dua hari.
        </p>
        <HistoryChart v-else :data="chartData" />
      </section>
    </template>

    <Alert v-else-if="!pricesError">
      <AlertTitle>Belum ada data harga</AlertTitle>
      <AlertDescription>
        Sumber ini belum mencatat harga yang bisa ditampilkan. Coba lagi nanti atau pilih perantara
        lain dari indeks.
      </AlertDescription>
    </Alert>
  </div>
</template>
