<script setup lang="ts">
import { computed } from 'vue'
import { useLowestHistory } from '@/composables/useLowestHistory'
import { formatRupiah, formatPercent } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from '@lucide/vue'
import HistoryChart, { type ChartPoint } from '@/components/HistoryChart.vue'

/*
 * Tren harga 30 hari di beranda: grafik gunung dari harga riil sumber
 * termurah. Ringkas: satu grafik, satu sumber, tiga angka keputusan.
 */
const { chartPoints, isLoading, error, lowest, reload } = useLowestHistory()

const chartData = computed<ChartPoint[]>(() => chartPoints.value)

const stats = computed(() => {
  const points = chartPoints.value
  if (points.length < 2) return null
  const prices = points.map((point) => point.price)
  const first = prices[0]
  const last = prices.at(-1)
  if (first === undefined || last === undefined || first === 0) return null
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    change: ((last - first) / first) * 100,
  }
})
</script>

<template>
  <section aria-labelledby="tren-title" :aria-busy="isLoading">
    <div class="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
      <h2 id="tren-title" class="text-lg font-semibold tracking-tight">Tren harga 30 hari</h2>
      <p v-if="lowest" class="text-xs text-muted-foreground">
        dari
        <RouterLink
          :to="`/sumber/${lowest.source}`"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {{ lowest.displayName }}
        </RouterLink>
      </p>
    </div>

    <div v-if="isLoading" class="mt-6">
      <span class="sr-only">Memuat grafik tren 30 hari...</span>
      <Skeleton class="h-72 w-full" />
      <div class="mt-3 flex gap-8">
        <Skeleton v-for="i in 3" :key="i" class="h-8 w-24" />
      </div>
    </div>

    <div v-else-if="error" class="mt-6 flex flex-wrap items-center gap-4">
      <p class="text-sm text-muted-foreground">{{ error }}.</p>
      <Button size="sm" variant="outline" @click="reload">
        <RefreshCw class="size-4" />
        Coba lagi
      </Button>
    </div>

    <template v-else-if="stats && lowest">
      <div class="mt-6">
        <HistoryChart :data="chartData" grad-id="gold-trend-home" />
      </div>

      <dl class="mt-4 flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt class="text-xs text-muted-foreground">30 hari terendah</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">{{ formatRupiah(stats.min) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">30 hari tertinggi</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">{{ formatRupiah(stats.max) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">perubahan 30 hari</dt>
          <dd
            class="mt-1 text-sm font-semibold tabular-nums"
            :class="stats.change >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatPercent(stats.change) }}
          </dd>
        </div>
      </dl>
    </template>

    <p v-else class="mt-4 text-sm text-muted-foreground">
      Data riwayat {{ lowest?.displayName ?? 'sumber termurah' }} belum cukup untuk digambarkan.
      Grafik muncul kalau ada dua hari pencatatan atau lebih.
    </p>
  </section>
</template>
