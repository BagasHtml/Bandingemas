<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getPriceHistory } from '@/api/client'
import type { HistoryItem } from '@/api/types'
import { useComparison, GRAM_OPTIONS } from '@/composables/useComparison'
import { formatRupiah, formatDate, formatPercent } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisArea, VisLine, VisXYContainer } from '@unovis/vue'

/*
 * Hero price card (DESIGN.md 5.2): harga terendah hari ini, chip gramasi,
 * metrik spread + 30 hari, sparkline 7 hari.
 */
const { goldSpots, isLoading, fetchComparison } = useComparison()

const lowest = computed(() => goldSpots.value[0] ?? null)
const highest = computed(() => goldSpots.value[goldSpots.value.length - 1] ?? null)

const spread = computed(() => {
  if (!lowest.value || !highest.value || lowest.value === highest.value) return null
  return highest.value.pricePerGram - lowest.value.pricePerGram
})

const spreadPercent = computed(() => {
  if (!spread.value || !lowest.value) return null
  return (spread.value / lowest.value.pricePerGram) * 100
})

// Chip gramasi aktif: estimasi total dari harga terendah
const selectedGram = ref<number>(1)

const estimate = computed(() => {
  if (!lowest.value) return null
  return lowest.value.pricePerGram * selectedGram.value
})

// Riwayat 30 hari sumber termurah, untuk metrik delta + sparkline 7 hari
const history = ref<HistoryItem[]>([])
const historyLoading = ref(false)

watch(
  lowest,
  async (spot) => {
    if (!spot) return
    historyLoading.value = true
    try {
      const res = await getPriceHistory(spot.source, {
        material: 'gold',
        weight: 1,
        length: 30,
      })
      if (res.success) history.value = res.data
    } catch {
      history.value = []
    } finally {
      historyLoading.value = false
    }
  },
  { immediate: true },
)

const dailyPrices = computed(() => {
  const byDate = new Map<string, number>()
  for (const item of history.value) {
    byDate.set(item.recordedDate, item.sellPrice)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, price]) => price)
})

const change30d = computed(() => {
  const prices = dailyPrices.value
  if (prices.length < 2) return null
  const first = prices[0]
  const last = prices[prices.length - 1]
  if (first === undefined || last === undefined || first === 0) return null
  return ((last - first) / first) * 100
})

const sparklineData = computed(() => dailyPrices.value.slice(-7))

const x = (_: unknown, i: number) => i
const y = (value: number) => value

fetchComparison()
</script>

<template>
  <section class="rounded-2xl border bg-card p-6 sm:p-8">
    <!-- Loading: kerangka menyerupai konten asli -->
    <div v-if="isLoading" aria-busy="true">
      <span class="sr-only">Memuat harga dari perantara...</span>
      <Skeleton class="h-4 w-56" />
      <Skeleton class="mt-4 h-12 w-72 sm:h-14" />
      <Skeleton class="mt-4 h-4 w-80 max-w-full" />
      <div class="mt-8 flex flex-wrap gap-2 border-t pt-6">
        <Skeleton v-for="i in 8" :key="i" class="h-10 w-16 rounded-xl" />
      </div>
    </div>

    <template v-else-if="lowest">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <h1 class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Harga emas terendah hari ini
          </h1>
          <p class="mt-2 text-5xl font-extrabold tabular-nums tracking-[-0.03em] text-gold-strong sm:text-[52px] sm:leading-[1.1]">
            {{ formatRupiah(lowest.pricePerGram) }}
            <span class="text-lg font-semibold text-muted-foreground">/gram</span>
          </p>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ lowest.materialType }},
            dari
            <RouterLink
              :to="`/sumber/${lowest.source}`"
              class="font-medium text-foreground underline-offset-4 hover:underline"
            >{{ lowest.displayName }}</RouterLink>,
            tercatat {{ formatDate(lowest.recordedDate) }}.
          </p>

          <!-- Metrik padat: spread + 30 hari -->
          <dl class="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div v-if="spread !== null">
              <dt class="text-xs text-muted-foreground">Selisih antar perantara</dt>
              <dd class="mt-0.5 font-semibold tabular-nums">
                {{ formatRupiah(spread) }}
                <span class="font-normal text-muted-foreground">
                  ({{ spreadPercent === null ? '' : formatPercent(spreadPercent) }})
                </span>
              </dd>
            </div>
            <div v-if="change30d !== null">
              <dt class="text-xs text-muted-foreground">30 hari ({{ lowest.displayName }})</dt>
              <dd
                class="mt-0.5 font-semibold tabular-nums"
                :class="change30d >= 0 ? 'text-positive' : 'text-negative'"
              >
                {{ formatPercent(change30d) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Sparkline 7 hari -->
        <div class="w-full shrink-0 lg:w-64">
          <p class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            7 hari terakhir
          </p>
          <div v-if="historyLoading" class="mt-3 h-16 text-sm text-muted-foreground">
            Memuat riwayat...
          </div>
          <div v-else-if="sparklineData.length >= 2" class="mt-3 h-16">
            <VisXYContainer :data="sparklineData" :style="{ height: '100%' }" :padding="{ top: 4 }">
              <!-- Isian emas tipis: penekanan seri harga, fungsi hierarki data -->
              <VisArea :x="x" :y="y" color="var(--gold)" :opacity="0.12" />
              <VisLine :x="x" :y="y" color="var(--gold)" :stroke-width="1.5" />
            </VisXYContainer>
          </div>
          <p v-else class="mt-3 text-sm text-muted-foreground">
            Riwayat belum cukup untuk digambarkan.
          </p>
        </div>
      </div>

      <!-- Chip gramasi -->
      <div class="mt-8 border-t pt-6">
        <p class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          Estimasi beli dari {{ lowest.displayName }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilih gramasi">
          <button
            v-for="gram in GRAM_OPTIONS"
            :key="gram"
            type="button"
            class="rounded-xl border px-4 py-2 text-sm font-semibold tabular-nums transition-all duration-200"
            :class="
              selectedGram === gram
                ? 'border-gold bg-gold-surface text-gold-strong'
                : 'border-border bg-background text-foreground hover:border-gold-border hover:bg-gold-surface/50'
            "
            :aria-pressed="selectedGram === gram"
            @click="selectedGram = gram"
          >
            {{ gram }} g
          </button>
        </div>
        <p v-if="estimate !== null" class="mt-4 text-sm text-muted-foreground">
          Perkiraan total:
          <span class="text-base font-bold tabular-nums text-foreground">{{ formatRupiah(estimate) }}</span>
          ({{ selectedGram }} gram × harga terendah, belum termasuk ongkos buat/pajak)
        </p>
      </div>
    </template>

    <template v-else>
      <h1 class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        Harga emas hari ini
      </h1>
      <p class="mt-3 text-lg font-semibold">Harga sedang tidak tersedia</p>
      <Button size="sm" variant="outline" class="mt-3" @click="fetchComparison">
        Muat ulang
      </Button>
    </template>
  </section>
</template>
