<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComparison, type SpotPrice } from '@/composables/useComparison'
import { formatRupiah, formatPercent } from '@/lib/format'
import { LOGOS } from '@/lib/logos'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Liga Likuiditas: peringkat perantara berdasarkan biaya main lagi,
 * yaitu selisih harga beli dan buyback di tempat yang sama. Makin kecil,
 * makin murah keluarnya kalau suatu saat mau cair. Data dari API, tanpa karangan.
 */
interface LeagueRow {
  spot: SpotPrice
  cost: number
  pct: number
}

const { goldSpots, silverSpots, isLoading } = useComparison()
const material = ref<'gold' | 'silver'>('gold')

function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const spots = computed(() => (material.value === 'gold' ? goldSpots.value : silverSpots.value))

const rows = computed<LeagueRow[]>(() =>
  spots.value
    .filter((spot) => spot.buybackPerGram !== null && spot.buybackPerGram > 0)
    .map((spot) => {
      const buyback = spot.buybackPerGram as number
      const cost = spot.pricePerGram - buyback
      return { spot, cost, pct: (cost / spot.pricePerGram) * 100 }
    })
    .sort((a, b) => a.pct - b.pct),
)

const excludedCount = computed(
  () => spots.value.filter((spot) => spot.buybackPerGram === null || spot.buybackPerGram <= 0).length,
)

// Skala bersama semua bar, diberi ruang kecil di kedua ujung
const scale = computed(() => {
  if (rows.value.length < 2) return null
  const pcts = rows.value.map((row) => row.pct)
  const min = Math.min(...pcts)
  const max = Math.max(...pcts)
  const pad = (max - min) * 0.08 || max * 0.01
  return { min: min - pad, max: max + pad }
})

function widthOf(pct: number): string {
  if (!scale.value) return '0%'
  const position = ((pct - scale.value.min) / (scale.value.max - scale.value.min)) * 100
  return `${Math.max(2, Math.min(100, position))}%`
}
</script>

<template>
  <section class="rounded-2xl border bg-card p-6 sm:p-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold tracking-[-0.02em]">Liga Likuiditas</h2>
        <p class="mt-1 max-w-xl text-sm text-muted-foreground">
          Kalau kamu beli lalu jual balik di perantara yang sama, ini yang hilang.
          Makin kecil persentasenya, makin murah keluarnya saat butuh cair.
        </p>
      </div>

      <!-- Toggle material -->
      <div class="flex rounded-xl border p-1" role="group" aria-label="Pilih material">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-150"
          :class="material === 'gold' ? 'bg-gold-surface text-gold-strong' : 'text-muted-foreground hover:text-foreground'"
          :aria-pressed="material === 'gold'"
          @click="material = 'gold'"
        >
          Emas
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-150"
          :class="material === 'silver' ? 'bg-gold-surface text-gold-strong' : 'text-muted-foreground hover:text-foreground'"
          :aria-pressed="material === 'silver'"
          @click="material = 'silver'"
        >
          Perak
        </button>
      </div>
    </div>

    <!-- Loading: kerangka seukuran konten asli -->
    <div v-if="isLoading" class="mt-6" aria-busy="true">
      <span class="sr-only">Memuat liga likuiditas...</span>
      <div class="space-y-3">
        <Skeleton v-for="i in 6" :key="i" class="h-9 w-full" />
      </div>
    </div>

    <template v-else-if="rows.length > 0 && scale">
      <div
        class="mt-6"
        role="img"
        :aria-label="`Peringkat biaya main lagi ${material === 'gold' ? 'emas' : 'perak'} dari ${rows.length} perantara, terbaik ${rows[0]?.spot.displayName ?? ''}`"
      >
        <div class="space-y-5">
          <div
            v-for="(row, index) in rows"
            :key="row.spot.source"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                {{ index + 1 }}
              </span>

              <img
                v-if="LOGOS[row.spot.source]"
                :src="LOGOS[row.spot.source]"
                :alt="`Logo ${row.spot.displayName}`"
                class="size-8 shrink-0 rounded-full border border-border bg-white object-contain p-0.5"
                loading="lazy"
              />
              <span
                v-else
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-surface text-[10px] font-bold text-gold-strong ring-1 ring-gold-border"
              >
                {{ initials(row.spot.displayName) }}
              </span>

              <RouterLink
                :to="`/sumber/${row.spot.source}`"
                class="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {{ row.spot.displayName }}
              </RouterLink>

              <span
                v-if="index === 0"
                class="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gold-strong sm:inline"
              >
                paling likuid
              </span>

              <div class="shrink-0 text-right">
                <p class="text-sm font-bold tabular-nums">{{ formatPercent(row.pct) }}</p>
                <p class="text-[10px] tabular-nums text-muted-foreground">
                  {{ formatRupiah(row.cost) }}/gram
                </p>
              </div>
            </div>

            <!-- Bar selebar baris: panjang = besar biaya likuidasi -->
            <div class="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full origin-left rounded-full transition-[width] duration-200 ease-out bar-grow"
                :class="material === 'gold' ? 'bg-gold' : 'bg-muted-foreground/50'"
                :style="{ width: widthOf(row.pct) }"
              />
            </div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-xs text-muted-foreground">
        Biaya main lagi = harga beli dikurangi harga buyback, per gram dari berat
        terdekat 1 gram.
        <template v-if="excludedCount > 0">
          {{ excludedCount }} perantara tidak memuat harga buyback dan tidak
          ikut diperingkat.
        </template>
      </p>
    </template>

    <p v-else class="mt-6 text-sm text-muted-foreground">
      Belum ada perantara yang memuat harga buyback saat ini, jadi liga belum
      bisa disusun. Coba muat ulang halaman beberapa saat lagi.
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
