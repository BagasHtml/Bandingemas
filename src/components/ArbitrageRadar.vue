<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah, formatDate } from '@/lib/format'
import { median } from '@/lib/stats'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Radar selisih: gap harga termurah dan termahal antar perantara hari ini,
 * plus usia kutipan. Melengkapi estimasi pasar (yang menyebarkan semua bar):
 * di sini yang dibaca satu angka, gap-nya sendiri.
 */
const { goldSpots, isLoading } = useComparison()

const cheapest = computed(() => goldSpots.value[0] ?? null)
const priciest = computed(() => goldSpots.value.at(-1) ?? null)

const gap = computed(() => {
  const low = cheapest.value
  const high = priciest.value
  if (!low || !high || goldSpots.value.length < 2 || low.pricePerGram === high.pricePerGram) {
    return null
  }
  const value = high.pricePerGram - low.pricePerGram
  return { value, pct: (value / median(goldSpots.value.map((s) => s.pricePerGram))!) * 100 }
})

const staleness = computed(() => {
  const spot = cheapest.value
  if (!spot) return null
  const recorded = new Date(spot.recordedDate)
  if (Number.isNaN(recorded.getTime())) return null
  const days = Math.floor((Date.now() - recorded.getTime()) / 86_400_000)
  return days >= 3 ? { days, displayName: spot.displayName } : null
})

const lastRecorded = computed(() => (cheapest.value && priciest.value
  ? (new Date(cheapest.value.recordedDate) > new Date(priciest.value.recordedDate)
      ? cheapest.value.recordedDate
      : priciest.value.recordedDate)
  : null))
</script>

<template>
  <div class="flex flex-col gap-4" :aria-busy="isLoading">
    <div class="flex items-baseline justify-between gap-3 border-b pb-3">
      <h2 class="text-sm font-semibold">Selisih hari ini</h2>
      <span class="text-xs text-muted-foreground">beli vs beli</span>
    </div>

    <div v-if="isLoading">
      <span class="sr-only">Memuat selisih harga antar perantara...</span>
      <Skeleton class="h-8 w-36" />
      <div class="mt-4 flex flex-col gap-2">
        <Skeleton v-for="i in 3" :key="i" class="h-4 w-full" />
      </div>
    </div>

    <template v-else-if="gap && cheapest && priciest">
      <div>
        <p class="text-2xl font-bold tabular-nums tracking-tight text-gold-strong">
          {{ formatRupiah(gap.value) }}/g
        </p>
        <p class="mt-1 text-xs tabular-nums text-muted-foreground">
          {{ gap.pct.toLocaleString('id-ID', { maximumFractionDigits: 2 }) }}% di atas median,
          {{ formatRupiah(cheapest.pricePerGram) }} vs {{ formatRupiah(priciest.pricePerGram) }}
        </p>
      </div>

      <p class="text-xs leading-relaxed text-muted-foreground">
        <RouterLink
          :to="`/sumber/${cheapest.source}`"
          class="font-medium text-foreground underline decoration-border underline-offset-2"
        >
          {{ cheapest.displayName }}
        </RouterLink>
        paling murah,
        <RouterLink
          :to="`/sumber/${priciest.source}`"
          class="font-medium text-foreground underline decoration-border underline-offset-2"
        >
          {{ priciest.displayName }}
        </RouterLink>
        paling mahal.
      </p>

      <p
        v-if="staleness"
        class="border border-gold-border bg-gold-surface px-3 py-2 text-xs leading-relaxed text-gold-strong"
      >
        Harga {{ staleness.displayName }} terakhir tercatat {{ staleness.days }} hari lalu. Selisih
        bisa jadi bukan perbedaan harga, tapi kutipan yang belum diperbarui.
      </p>

      <p class="text-xs leading-relaxed text-muted-foreground">
        Bandingkan harga beli di antara perantara, bukan buyback: buyback kamu kembali ke tempat
        beli, bukan ke perantara merek lain.
        <template v-if="lastRecorded">Data {{ formatDate(lastRecorded) }}.</template>
      </p>
    </template>

    <p v-else class="text-sm text-muted-foreground">
      Selisih butuh minimal dua perantara sehat. Coba muat ulang beberapa saat lagi.
    </p>
  </div>
</template>
