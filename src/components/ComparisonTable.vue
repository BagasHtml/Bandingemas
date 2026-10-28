<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComparison, type SpotPrice } from '@/composables/useComparison'
import { LOGOS } from '@/lib/logos'
import { formatRupiah } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, RefreshCw } from '@lucide/vue'

/*
 * Tabel perbandingan (DESIGN.md 5.3). Kolom status stok tidak diikutkan:
 * API tidak menyediakan data ketersediaan (kesepakatan dengan pemilik produk).
 */
const { goldSpots, silverSpots, failedCount, isLoading, error, fetchComparison } =
  useComparison()

// Filter material nyata dari API (kesepakatan: bukan fisik/digital)
const FILTERS = [
  { value: 'gold', label: 'Emas' },
  { value: 'silver', label: 'Perak' },
] as const

const selectedMaterial = ref<'gold' | 'silver'>('gold')

const spots = computed(() =>
  selectedMaterial.value === 'gold' ? goldSpots.value : silverSpots.value,
)

function spreadOf(spot: SpotPrice): { rp: number; percent: number } | null {
  if (spot.buybackPerGram === null) return null
  const rp = spot.pricePerGram - spot.buybackPerGram
  if (rp <= 0) return null
  return { rp, percent: (rp / spot.pricePerGram) * 100 }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
</script>

<template>
  <section class="rounded-2xl border bg-card">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b p-6 sm:px-8">
      <div>
        <h2 class="text-lg font-bold tracking-[-0.02em]">Perbandingan Antar Perantara</h2>
        <p class="mt-0.5 text-sm text-muted-foreground">
          Harga per gram, diurutkan dari termurah.
          <span v-if="failedCount > 0 && !isLoading" class="text-xs">
            {{ failedCount }} sumber sedang tidak tersedia.
          </span>
        </p>
      </div>

      <!-- Filter material -->
      <div class="flex gap-2" role="group" aria-label="Filter material">
        <button
          v-for="filter in FILTERS"
          :key="filter.value"
          type="button"
          class="rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200"
          :class="
            selectedMaterial === filter.value
              ? 'border-gold bg-gold-surface text-gold-strong'
              : 'border-border bg-background hover:border-gold-border hover:bg-gold-surface/50'
          "
          :aria-pressed="selectedMaterial === filter.value"
          @click="selectedMaterial = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" aria-busy="true" class="p-6 sm:px-8">
      <span class="sr-only">Memuat tabel perbandingan...</span>
      <div class="space-y-4">
        <div v-for="i in 7" :key="i" class="flex items-center gap-3">
          <Skeleton class="size-9 shrink-0 rounded-full" />
          <Skeleton class="h-5 flex-1" />
          <Skeleton class="h-5 w-28 shrink-0" />
          <Skeleton class="hidden h-5 w-28 shrink-0 sm:block" />
        </div>
      </div>
    </div>

    <Alert v-else-if="error && spots.length === 0" variant="destructive" class="m-6">
      <AlertTitle>Tidak ada data harga</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <span>{{ error }}</span>
        <Button size="sm" variant="outline" @click="fetchComparison">
          <RefreshCw class="size-4" />
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>

    <div v-else-if="spots.length > 0" class="overflow-x-auto">
      <table class="w-full min-w-150 text-sm">
        <thead>
          <tr class="border-b text-left text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            <th class="px-6 py-3 font-semibold sm:px-8">Perantara</th>
            <th class="px-4 py-3 font-semibold">Produk</th>
            <th class="px-4 py-3 text-right font-semibold">Beli/gram</th>
            <th class="px-4 py-3 text-right font-semibold">Buyback/gram</th>
            <th class="px-4 py-3 text-right font-semibold">Spread</th>
            <th class="px-6 py-3 text-right font-semibold sm:px-8">Situs</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(spot, index) in spots"
            :key="spot.source"
            class="border-b transition-colors duration-150 last:border-b-0 hover:bg-[#f9fafb] dark:hover:bg-[#26292d]"
          >
            <td class="px-6 py-3.5 sm:px-8">
              <div class="flex items-center gap-3">
                <img
                  v-if="LOGOS[spot.source]"
                  :src="LOGOS[spot.source]"
                  :alt="`Logo ${spot.displayName}`"
                  class="size-9 shrink-0 rounded-full border border-border bg-white object-contain p-1"
                  loading="lazy"
                />
                <span
                  v-else
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-surface text-xs font-bold text-gold-strong ring-1 ring-gold-border"
                >
                  {{ initials(spot.displayName) }}
                </span>
                <div class="min-w-0">
                  <RouterLink
                    :to="`/sumber/${spot.source}`"
                    class="block truncate font-semibold underline-offset-4 hover:underline"
                  >
                    {{ spot.displayName }}
                  </RouterLink>
                  <span v-if="index === 0" class="text-xs font-semibold text-gold-strong">termurah</span>
                </div>
              </div>
            </td>
            <td class="max-w-40 truncate px-4 py-3.5 text-muted-foreground">
              {{ spot.materialType }}
            </td>
            <td class="px-4 py-3.5 text-right font-semibold tabular-nums">
              {{ formatRupiah(spot.pricePerGram) }}
            </td>
            <td class="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
              {{ spot.buybackPerGram === null ? 'tidak tersedia' : formatRupiah(spot.buybackPerGram) }}
            </td>
            <td class="px-4 py-3.5 text-right tabular-nums">
              <template v-if="spreadOf(spot)">
                <span class="font-medium">{{ formatRupiah(spreadOf(spot)!.rp) }}</span>
                <span class="block text-xs text-muted-foreground">
                  {{ spreadOf(spot)!.percent.toFixed(1).replace('.', ',') }}%
                </span>
              </template>
              <span v-else class="text-muted-foreground">-</span>
            </td>
            <td class="px-6 py-3.5 text-right sm:px-8">
              <a
                v-if="spot.urlHomepage"
                :href="spot.urlHomepage"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-sm font-medium text-gold-strong underline-offset-4 hover:underline"
              >
                Kunjungi situs
                <ExternalLink class="size-3.5" />
              </a>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="p-6 text-sm text-muted-foreground sm:px-8">
      Belum ada data {{ selectedMaterial === 'gold' ? 'emas' : 'perak' }} dari sumber
      mana pun. Coba lagi nanti.
    </p>
  </section>
</template>
