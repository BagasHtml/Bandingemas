<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComparison, GRAM_OPTIONS } from '@/composables/useComparison'
import { useLowestHistory } from '@/composables/useLowestHistory'
import { formatRupiah, formatDate, formatPercent } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from '@lucide/vue'
import { VisArea, VisLine, VisXYContainer } from '@unovis/vue'

const { goldSpots, isLoading, fetchComparison } = useComparison()
const {
  chartPoints,
  isLoading: historyLoading,
  lowest,
} = useLowestHistory()

const highest = computed(() => goldSpots.value.at(-1) ?? null)

const spread = computed(() => {
  if (!lowest.value || !highest.value || lowest.value === highest.value) return null
  return highest.value.pricePerGram - lowest.value.pricePerGram
})

const spreadPercent = computed(() => {
  if (!spread.value || !lowest.value) return null
  return (spread.value / lowest.value.pricePerGram) * 100
})

const selectedGram = ref<number>(1)

const estimate = computed(() => {
  if (!lowest.value) return null
  return lowest.value.pricePerGram * selectedGram.value
})

const change30d = computed(() => {
  const points = chartPoints.value
  const first = points[0]
  const lastPoint = points.at(-1)
  if (!first || !lastPoint || first.price === 0) return null
  return ((lastPoint.price - first.price) / first.price) * 100
})

const sparklineData = computed(() => chartPoints.value.slice(-7).map((point) => point.price))

const sparklineStats = computed(() => {
  const prices = sparklineData.value
  if (prices.length === 0) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
})

// Skala mengikuti rentang 7 hari; sumbu yang mulai dari nol membuat
// pergerakan kecil tampak datar.
const sparklineDomain = computed<[number, number]>(() => {
  const stats = sparklineStats.value
  if (!stats) return [0, 1]
  const pad = Math.max((stats.max - stats.min) * 0.15, stats.max * 0.002)
  return [stats.min - pad, stats.max + pad]
})

const sparklineFill = 'url(#gold-fade-hero)'

const x = (_: unknown, i: number) => i
const y = (value: number) => value

function formatGram(gram: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(gram)
}

fetchComparison()
</script>

<template>
  <section class="relative border-b pb-10 sm:pb-12" :aria-busy="isLoading">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h1 class="text-sm font-medium text-muted-foreground">Harga emas terendah hari ini</h1>
      <p v-if="lowest && !isLoading" class="text-xs text-muted-foreground">
        tercatat {{ formatDate(lowest.recordedDate) }}
      </p>
    </div>

    <div v-if="isLoading">
      <span class="sr-only">Memuat harga dari perantara...</span>
      <Skeleton class="mt-4 h-14 w-80 max-w-full" />
      <Skeleton class="mt-4 h-4 w-64 max-w-full" />
      <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div class="flex flex-wrap gap-2">
          <Skeleton v-for="i in 8" :key="i" class="h-11 w-16" />
        </div>
        <Skeleton class="h-24 w-full" />
      </div>
    </div>

    <template v-else-if="lowest">
      <div class="mt-3 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-16">
        <div class="min-w-0">
          <p
            class="text-[clamp(2.6rem,7vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.035em] tabular-nums text-gold-strong"
          >
            {{ formatRupiah(lowest.pricePerGram) }}
            <span class="text-base font-semibold tracking-normal text-muted-foreground sm:text-lg">
              /gram
            </span>
          </p>

          <p class="mt-3 max-w-xl text-sm text-muted-foreground">
            Harga per gram dari
            <RouterLink
              :to="`/sumber/${lowest.source}`"
              class="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {{ lowest.displayName }}
            </RouterLink>
            .
          </p>

          <dl class="mt-7 flex flex-wrap gap-x-10 gap-y-5">
            <div v-if="spread !== null">
              <dt class="text-xs text-muted-foreground">Selisih antar perantara</dt>
              <dd class="mt-1 text-sm font-semibold tabular-nums">
                {{ formatRupiah(spread) }}
                <span class="font-normal text-muted-foreground">
                  ({{ spreadPercent === null ? '' : formatPercent(spreadPercent) }})
                </span>
              </dd>
            </div>
            <div v-if="change30d !== null">
              <dt class="text-xs text-muted-foreground">30 hari · {{ lowest.displayName }}</dt>
              <dd
                class="mt-1 text-sm font-semibold tabular-nums"
                :class="change30d >= 0 ? 'text-positive' : 'text-negative'"
              >
                {{ formatPercent(change30d) }}
              </dd>
            </div>
          </dl>

          <div class="mt-8">
            <p id="gram-label" class="text-sm font-medium">Hitung cepat beli</p>
            <div class="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="gram-label">
              <button
                v-for="gram in GRAM_OPTIONS"
                :key="gram"
                type="button"
                class="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-semibold tabular-nums transition-colors"
                :class="
                  selectedGram === gram
                    ? 'border-gold bg-gold-surface text-gold-strong'
                    : 'border-border bg-background text-foreground hover:border-gold-border hover:bg-gold-surface/60'
                "
                :aria-pressed="selectedGram === gram"
                @click="selectedGram = gram"
              >
                {{ formatGram(gram) }} g
              </button>
            </div>
            <p v-if="estimate !== null" class="mt-3 text-sm text-muted-foreground" aria-live="polite">
              {{ formatGram(selectedGram) }} gram:
              <span class="font-semibold text-foreground">{{ formatRupiah(estimate) }}</span>
              <span class="mt-1 block text-xs">
                Harga terendah, belum termasuk ongkos buat dan pajak.
              </span>
            </p>
          </div>
        </div>

        <div class="min-w-0">
          <div class="flex items-baseline justify-between gap-3">
            <p class="text-sm font-medium">7 hari terakhir</p>
            <p class="text-xs text-muted-foreground">{{ lowest.displayName }}</p>
          </div>

          <div v-if="historyLoading" class="mt-3 text-xs text-muted-foreground">
            Memuat riwayat...
          </div>
          <div v-else-if="sparklineData.length >= 2" class="mt-3">
            <svg class="pointer-events-none absolute size-0" aria-hidden="true">
              <defs>
                <linearGradient id="gold-fade-hero" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--gold-strong)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--gold-strong)" stop-opacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
            <div class="h-24">
              <VisXYContainer
                :data="sparklineData"
                :y-domain="sparklineDomain"
                :style="{ height: '100%' }"
                :padding="{ top: 4 }"
              >
                <VisArea :x="x" :y="y" :color="sparklineFill" />
                <VisLine :x="x" :y="y" color="var(--gold-strong)" :stroke-width="1.5" />
              </VisXYContainer>
            </div>
            <div v-if="sparklineStats" class="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>terendah {{ formatRupiah(sparklineStats.min) }}</span>
              <span>tertinggi {{ formatRupiah(sparklineStats.max) }}</span>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-muted-foreground">
            Riwayat 7 hari belum cukup untuk digambarkan.
          </p>
        </div>
      </div>
    </template>

    <div v-else class="mt-3 flex flex-wrap items-center gap-4">
      <p class="text-lg font-semibold">Harga sedang tidak tersedia.</p>
      <Button size="sm" variant="outline" @click="fetchComparison">
        <RefreshCw />
        Muat ulang
      </Button>
    </div>
  </section>
</template>
