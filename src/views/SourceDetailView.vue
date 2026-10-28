<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrices } from '@/composables/usePrices'
import { useHistory } from '@/composables/useHistory'
import { formatRupiah, formatDate } from '@/lib/format'
import { LOGOS } from '@/lib/logos'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
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
import { RefreshCw } from '@lucide/vue'

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

// Material unik untuk filter
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

// Reset pilihan produk saat filter material berubah
watch(selectedMaterial, () => {
  selectedProduct.value = ''
})

// Produk terpilih untuk grafik (default produk pertama)
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
  <div>
    <div class="mb-8 border-b pb-6">
      <RouterLink
        to="/"
        class="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Semua perantara
      </RouterLink>
      <div class="mt-2 flex items-center gap-3">
        <img
          v-if="LOGOS[sourceName]"
          :src="LOGOS[sourceName]"
          :alt="`Logo ${displayName}`"
          class="size-12 rounded-full border border-border bg-white object-contain p-1"
        />
        <h1 class="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{{ displayName }}</h1>
      </div>
      <p v-if="lastUpdated" class="mt-1 text-sm text-muted-foreground">
        Pembaruan terakhir {{ formatDate(lastUpdated) }}
        <template v-if="prices[0]?.urlHomepage">
          <span aria-hidden="true"> · </span>
          <a
            :href="prices[0].urlHomepage"
            target="_blank"
            rel="noopener noreferrer"
            class="underline-offset-4 hover:text-foreground hover:underline"
          >
            situs resmi
          </a>
        </template>
      </p>
    </div>

    <!-- Status gagal memuat harga -->
    <Alert v-if="pricesError && !pricesLoading" variant="destructive" class="mb-6">
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
      <div class="space-y-3">
        <Skeleton v-for="i in 6" :key="i" class="h-10 w-full" />
      </div>
    </div>

    <template v-else-if="prices.length > 0">
      <!-- Filter material -->
      <div class="mb-4 flex items-center gap-2">
        <span class="text-sm text-muted-foreground">Material:</span>
        <Select v-model="selectedMaterial">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Semua material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem
              v-for="material in materials"
              :key="material"
              :value="material"
              class="capitalize"
            >
              {{ material }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Tabel harga saat ini -->
      <section class="mb-10 rounded-2xl border bg-card p-6">
        <h2 class="mb-3 text-lg font-bold tracking-[-0.02em]">Harga Saat Ini</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Berat</TableHead>
              <TableHead class="text-right">Harga Jual</TableHead>
              <TableHead class="text-right">Buyback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="item in filteredPrices"
              :key="item.lineKey || item.materialType + item.weight"
            >
              <TableCell class="font-medium">{{ item.materialType }}</TableCell>
              <TableCell class="tabular-nums">{{ item.weight }} {{ item.weightUnit }}</TableCell>
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

      <!-- Grafik riwayat harga -->
      <section class="rounded-2xl border bg-card p-6">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-bold tracking-[-0.02em]">Riwayat Harga</h2>
          <div v-if="products.length > 1" class="flex items-center gap-2">
            <Select v-model="selectedProduct">
              <SelectTrigger class="h-8 w-64 text-xs">
                <SelectValue placeholder="Produk otomatis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="product in products"
                  :key="productKeyOf(product)"
                  :value="productKeyOf(product)"
                >
                  {{ product.materialType }} ({{ product.weight }} {{ product.weightUnit }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-if="historyLoading" aria-busy="true" class="py-2">
          <span class="sr-only">Memuat riwayat harga...</span>
          <Skeleton class="h-72 w-full" />
        </div>
        <p v-else-if="chartData.length < 2" class="py-8 text-sm text-muted-foreground">
          Data riwayat belum cukup untuk digambarkan. Grafik muncul setelah sumber mencatat harga
          minimal dua hari.
        </p>
        <HistoryChart v-else :data="chartData" />
      </section>
    </template>

    <!-- Sumber tidak memiliki data harga -->
    <Alert v-else-if="!pricesError">
      <AlertTitle>Belum ada data harga</AlertTitle>
      <AlertDescription>
        Sumber ini belum mencatat harga yang bisa ditampilkan. Coba lagi nanti atau pilih perantara
        lain dari indeks.
      </AlertDescription>
    </Alert>
  </div>
</template>
