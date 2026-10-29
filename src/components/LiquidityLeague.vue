<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComparison, type SpotPrice } from '@/composables/useComparison'
import { formatRupiah } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/*
 * Biaya main lagi: peringkat perantara berdasarkan selisih harga beli dan
 * buyback di tempat yang sama. Makin kecil, makin murah keluarnya kalau
 * suatu saat mau cair. Data dari API, tanpa karangan.
 */
interface LeagueRow {
  spot: SpotPrice
  cost: number
  pct: number
}

const { goldSpots, silverSpots, isLoading } = useComparison()
const material = ref<string>('gold')

const spots = computed(() => (material.value === 'silver' ? silverSpots.value : goldSpots.value))

const rows = computed<LeagueRow[]>(() =>
  spots.value
    .filter((spot) => spot.buybackPerGram !== null && spot.buybackPerGram > 0)
    .map((spot) => {
      const buyback = spot.buybackPerGram as number
      const cost = spot.pricePerGram - buyback
      return { spot, cost, pct: (cost / spot.pricePerGram) * 100 }
    })
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6),
)

const excludedCount = computed(
  () => spots.value.filter((spot) => spot.buybackPerGram === null || spot.buybackPerGram <= 0).length,
)

const costFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatCostPct(value: number): string {
  return `${costFormatter.format(value)}%`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3 border-b pb-3">
      <h2 class="text-sm font-semibold">Biaya main lagi</h2>
      <Select v-model="material">
        <SelectTrigger
          size="sm"
          class="w-24 data-[size=sm]:h-11 sm:data-[size=sm]:h-8"
          aria-label="Pilih material"
        >
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

    <p class="text-xs leading-relaxed text-muted-foreground">
      Selisih harga beli dan buyback di tempat yang sama. Makin kecil, makin murah saat butuh cair.
    </p>

    <div v-if="isLoading" aria-busy="true">
      <span class="sr-only">Memuat peringkat biaya likuidasi...</span>
      <div class="flex flex-col gap-2">
        <Skeleton v-for="i in 5" :key="i" class="h-8 w-full" />
      </div>
    </div>

    <template v-else-if="rows.length > 0">
      <ol class="flex flex-col">
        <li
          v-for="(row, index) in rows"
          :key="row.spot.source"
          class="border-b last:border-b-0"
        >
          <RouterLink
            :to="`/sumber/${row.spot.source}`"
            class="flex min-h-11 items-center gap-2.5 py-2 transition-colors hover:bg-muted/50 lg:min-h-9 lg:py-1.5"
          >
            <span class="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
              {{ index + 1 }}
            </span>
            <span class="min-w-0 flex-1 truncate text-xs font-medium">
              {{ row.spot.displayName }}
            </span>
            <span class="shrink-0 text-right">
              <span class="block text-xs font-semibold tabular-nums">
                {{ formatCostPct(row.pct) }}
              </span>
              <span class="block text-[11px] tabular-nums text-muted-foreground">
                {{ formatRupiah(row.cost) }}/g
              </span>
            </span>
          </RouterLink>
        </li>
      </ol>

      <p class="text-[11px] leading-relaxed text-muted-foreground">
        6 perantara teratas.
        <template v-if="excludedCount > 0">
          {{ excludedCount }} lain tidak memuat harga buyback.
        </template>
      </p>
    </template>

    <p v-else class="text-sm text-muted-foreground">
      Belum ada perantara yang memuat harga buyback saat ini. Coba muat ulang beberapa saat lagi.
    </p>
  </div>
</template>
