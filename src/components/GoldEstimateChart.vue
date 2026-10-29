<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah, formatDate } from '@/lib/format'
import { median } from '@/lib/stats'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Estimasi harga emas saat ini: median harga per gram dari semua
 * perantara yang sehat, ditampilkan sebagai distribusi harga antar sumber.
 * Semua angka dari API, tidak ada nilai karangan.
 */
const { goldSpots, isLoading } = useComparison()

const rows = computed(() => goldSpots.value)

// Skala bar memakai rentang harga normal saja. Satu kutipan ekstrem
// (mis. satuan berat keliru dari sumber) tidak boleh memipihkan bar lainnya.
const scale = computed(() => {
  const prices = goldSpots.value.map((s) => s.pricePerGram)
  if (prices.length < 2) return null
  const mid = median(prices) ?? prices[0]!
  const normal = prices.filter((price) => price >= mid * 0.6 && price <= mid * 1.6)
  const pool = normal.length >= 2 ? normal : prices
  const min = Math.min(...pool)
  const max = Math.max(...pool)
  const pad = (max - min) * 0.08 || max * 0.01
  return { min: min - pad, max: max + pad }
})

function widthOf(price: number): string {
  if (!scale.value) return '0%'
  const pct = ((price - scale.value.min) / (scale.value.max - scale.value.min)) * 100
  return `${Math.max(2, Math.min(100, pct))}%`
}

// Median: tahan terhadap harga ekstrem dari satu-dua sumber scraping
// (implementasi di lib/stats.ts)

const medianPrice = computed(() => {
  if (goldSpots.value.length < 2) return null
  return median(goldSpots.value.map((s) => s.pricePerGram))
})

const lastRecorded = computed(() => goldSpots.value[0]?.recordedDate ?? null)
</script>

<template>
  <div class="flex flex-col gap-4" :aria-busy="isLoading">
    <div class="flex items-baseline justify-between gap-3 border-b pb-3">
      <h2 class="text-sm font-semibold">Estimasi pasar</h2>
      <span class="text-xs text-muted-foreground">median</span>
    </div>

    <div v-if="isLoading">
      <span class="sr-only">Memuat estimasi harga dari perantara...</span>
      <Skeleton class="h-8 w-40" />
      <div class="mt-4 flex flex-col gap-2">
        <Skeleton v-for="i in 5" :key="i" class="h-5 w-full" />
      </div>
    </div>

    <template v-else-if="medianPrice !== null && scale">
      <div>
        <p class="text-2xl font-bold tabular-nums tracking-tight text-gold-strong">
          {{ formatRupiah(medianPrice) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          per gram dari {{ rows.length }} perantara
          <template v-if="lastRecorded">, {{ formatDate(lastRecorded) }}</template>
        </p>
      </div>

      <div
        class="flex flex-col gap-2"
        role="img"
        :aria-label="`Distribusi harga emas per gram dari ${rows.length} perantara, median ${formatRupiah(medianPrice)}`"
      >
        <RouterLink
          v-for="spot in rows"
          :key="spot.source"
          :to="`/sumber/${spot.source}`"
          class="flex min-h-11 items-center gap-2.5 transition-colors hover:bg-muted/50 lg:min-h-8"
        >
          <span class="w-24 shrink-0 truncate text-xs text-muted-foreground">
            {{ spot.displayName }}
          </span>
          <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              class="block h-full rounded-full bg-gold"
              :style="{ width: widthOf(spot.pricePerGram) }"
            />
          </span>
          <span class="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
            {{ formatRupiah(spot.pricePerGram) }}
          </span>
        </RouterLink>
      </div>

      <p class="text-xs leading-relaxed text-muted-foreground">
        Median dipakai agar harga ekstrem dari satu-dua sumber tidak menggeser angka. Skala bar
        mengabaikan kutipan ekstrem agar sebaran harga normal tetap terbaca. Harga dinormalisasi ke
        per gram dari berat terdekat 1 gram.
      </p>
    </template>

    <p v-else class="text-sm text-muted-foreground">
      Estimasi butuh minimal dua perantara sehat untuk dibandingkan. Coba muat ulang beberapa saat
      lagi.
    </p>
  </div>
</template>
