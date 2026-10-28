<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah, formatDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Estimasi harga emas saat ini: rata-rata harga per gram dari semua
 * perantara yang sehat, divisualkan sebagai distribusi harga antar sumber.
 * Semua angka dari API, tidak ada nilai karangan.
 */
const { goldSpots, isLoading } = useComparison()

const rows = computed(() => goldSpots.value)

// Skala bersama untuk semua bar, diberi ruang kecil di kedua ujung
const scale = computed(() => {
  const prices = goldSpots.value.map((s) => s.pricePerGram)
  if (prices.length < 2) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const pad = (max - min) * 0.08 || max * 0.01
  return { min: min - pad, max: max + pad }
})

function widthOf(price: number): string {
  if (!scale.value) return '0%'
  const pct = ((price - scale.value.min) / (scale.value.max - scale.value.min)) * 100
  return `${Math.max(2, Math.min(100, pct))}%`
}

// Median: tahan terhadap harga ekstrem dari satu-dua sumber scraping
function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const lower = sorted[mid - 1]
  const upper = sorted[mid]
  if (lower === undefined || upper === undefined) return null
  return sorted.length % 2 === 1 ? upper : Math.round((lower + upper) / 2)
}

const medianPrice = computed(() => {
  if (goldSpots.value.length < 2) return null
  return median(goldSpots.value.map((s) => s.pricePerGram))
})

const averageLeft = computed(() => {
  if (medianPrice.value === null || !scale.value) return null
  const pct = ((medianPrice.value - scale.value.min) / (scale.value.max - scale.value.min)) * 100
  return `${Math.max(0, Math.min(100, pct))}%`
})

const lastRecorded = computed(() => goldSpots.value[0]?.recordedDate ?? null)
</script>

<template>
  <section class="rounded-2xl border bg-card p-6 sm:p-8" :aria-busy="isLoading">
    <h2 class="text-lg font-bold tracking-[-0.02em]">Estimasi Harga Emas Saat Ini</h2>

    <!-- Loading: kerangka seukuran konten asli -->
    <div v-if="isLoading" class="mt-5">
      <span class="sr-only">Memuat estimasi harga dari perantara...</span>
      <Skeleton class="h-10 w-64" />
      <div class="mt-6 space-y-3">
        <Skeleton v-for="i in 6" :key="i" class="h-6 w-full" />
      </div>
    </div>

    <template v-else-if="medianPrice !== null && scale">
      <p class="mt-2 text-sm text-muted-foreground">
        Median dari {{ rows.length }} perantara
        <template v-if="lastRecorded">, data tercatat {{ formatDate(lastRecorded) }}</template
        >.
      </p>

      <p class="mt-3 text-4xl font-extrabold tabular-nums tracking-[-0.03em] text-gold-strong">
        {{ formatRupiah(medianPrice) }}
        <span class="text-base font-semibold text-muted-foreground">/gram</span>
      </p>

      <!-- Distribusi harga antar perantara -->
      <div
        class="mt-6"
        role="img"
        :aria-label="`Distribusi harga emas per gram dari ${rows.length} perantara, median ${formatRupiah(medianPrice)}`"
      >
        <div class="relative">
          <!-- Penanda estimasi (median) -->
          <div
            v-if="averageLeft"
            class="pointer-events-none absolute inset-y-0 z-10 border-l-2 border-dashed border-foreground/50"
            :style="{ left: averageLeft }"
            aria-hidden="true"
          >
            <span
              class="absolute -top-1 left-0 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background"
            >
              estimasi
            </span>
          </div>

          <div class="space-y-2.5">
            <div v-for="spot in rows" :key="spot.source" class="flex items-center gap-3">
              <RouterLink
                :to="`/sumber/${spot.source}`"
                class="w-28 shrink-0 truncate text-xs font-medium underline-offset-4 hover:underline sm:w-36 sm:text-sm"
              >
                {{ spot.displayName }}
              </RouterLink>

              <div class="relative h-6 flex-1">
                <div
                  class="absolute inset-y-0 left-0 origin-left rounded-md bg-gold/85 transition-[width] duration-200 ease-out bar-grow"
                  :style="{ width: widthOf(spot.pricePerGram) }"
                />
              </div>

              <span class="w-28 shrink-0 text-right text-sm font-semibold tabular-nums sm:w-32">
                {{ formatRupiah(spot.pricePerGram) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-xs text-muted-foreground">
        Estimasi memakai median agar harga ekstrem dari satu-dua sumber tidak menggeser angka. Harga
        tiap perantara dinormalisasi ke per gram dari berat terdekat 1 gram; quote yang buybacknya
        di atas harga jual ditolak karena tidak konsisten.
      </p>
    </template>

    <p v-else class="mt-4 text-sm text-muted-foreground">
      Estimasi butuh minimal dua perantara yang sehat untuk dibandingkan. Sumber sedang fluktuatif,
      coba muat ulang halaman beberapa saat lagi.
    </p>
  </section>
</template>

<style scoped>
/* Bar tumbuh dari kiri saat data tiba; dimatikan oleh prefers-reduced-motion */
.bar-grow {
  animation: bar-grow 0.3s ease-out;
}
@keyframes bar-grow {
  from {
    transform: scaleX(0);
  }
}
</style>
