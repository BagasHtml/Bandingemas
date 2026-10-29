<script setup lang="ts">
import { computed } from 'vue'
import { useComparison, type WeightQuote } from '@/composables/useComparison'
import { formatRupiah } from '@/lib/format'
import { median } from '@/lib/stats'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Efisiensi pecahan: harga efektif per gram tiap pecahan, diambil termurah
 * per pechahan lintas perantara. Angkanya menunjukkan sendiri kenapa pecahan
 * kecil lebih mahal per gram (ongkos buat), tanpa perlu narasi.
 */
interface FractionRow {
  weight: number
  pricePerGram: number
  source: string
  sourceName: string
  count: number
  premium: number
}

const { goldQuotes, isLoading } = useComparison()

const rows = computed<FractionRow[]>(() => {
  // Buang baris yang jelas-jelas rusak: berat ekstrem atau harga yang
  // menyimpang jauh dari median adalah hasil scraping yang kotor.
  const mid = median(goldQuotes.value.map((quote) => quote.pricePerGram))
  if (mid === null) return []
  const clean = goldQuotes.value.filter(
    (quote) =>
      quote.weight >= 0.1 &&
      quote.weight <= 2000 &&
      quote.pricePerGram >= mid * 0.5 &&
      quote.pricePerGram <= mid * 1.5,
  )
  if (clean.length === 0) return []

  const byWeight = new Map<number, WeightQuote[]>()
  for (const quote of clean) {
    const bucket = byWeight.get(quote.weight) ?? []
    bucket.push(quote)
    byWeight.set(quote.weight, bucket)
  }

  const grouped = [...byWeight.values()].map((bucket) => {
    const cheapest = bucket.reduce((a, b) => (b.pricePerGram < a.pricePerGram ? b : a))
    return {
      weight: cheapest.weight,
      pricePerGram: cheapest.pricePerGram,
      source: cheapest.source,
      sourceName: cheapest.displayName,
      count: new Set(bucket.map((quote) => quote.source)).size,
      premium: 0,
    }
  })

  const best = Math.min(...grouped.map((row) => row.pricePerGram))
  return grouped
    .map((row) => ({ ...row, premium: ((row.pricePerGram - best) / best) * 100 }))
    .sort((a, b) => a.weight - b.weight)
})

const weightFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
})

const premiumFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
</script>

<template>
  <section aria-labelledby="pecahan-title">
    <div class="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
      <h2 id="pecahan-title" class="text-lg font-semibold tracking-tight">
        Harga per pecahan
      </h2>
      <span v-if="!isLoading && rows.length > 0" class="text-xs text-muted-foreground">
        termurah per pecahan, lintas perantara
      </span>
    </div>

    <div v-if="isLoading" aria-busy="true" class="mt-6 flex flex-col gap-3">
      <span class="sr-only">Memuat harga per pecahan...</span>
      <Skeleton v-for="i in 4" :key="i" class="h-10 w-full" />
    </div>

    <ol v-else-if="rows.length > 0" class="mt-2 flex flex-col">
      <li
        v-for="row in rows"
        :key="row.weight"
        class="flex min-h-11 items-center gap-2 border-b py-2 last:border-b-0"
        :class="row.premium === 0 ? 'bg-gold-surface' : ''"
      >
        <span class="w-14 shrink-0 text-sm font-semibold tabular-nums">
          {{ weightFormatter.format(row.weight) }} g
        </span>
        <RouterLink
          :to="`/sumber/${row.source}`"
          class="min-w-0 flex-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ row.sourceName }}
          <span class="md:hidden"> ({{ row.count }} perantara)</span>
        </RouterLink>
        <span
          v-if="row.count > 1"
          class="hidden shrink-0 text-xs text-muted-foreground md:inline"
        >
          {{ row.count }} perantara
        </span>
        <span class="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
          {{ formatRupiah(row.pricePerGram) }}/g
        </span>
        <span
          class="w-14 shrink-0 text-right text-xs tabular-nums"
          :class="row.premium === 0 ? 'text-gold-strong' : 'text-muted-foreground'"
        >
          {{ row.premium === 0 ? 'termurah' : `&#43;${premiumFormatter.format(row.premium)}%` }}
        </span>
      </li>
    </ol>

    <p v-else class="mt-4 text-sm text-muted-foreground">
      Harga pecahan belum tersedia dari perantara. Coba muat ulang beberapa saat lagi.
    </p>

    <p v-if="!isLoading && rows.length > 1" class="mt-4 text-xs leading-relaxed text-muted-foreground">
      Harga per gram = harga jual dibagi berat pecahan. Pecahan kecil menanggung ongkos buat yang
      lebih besar per gram, dan jaraknya terlihat langsung di kolom kanan; jumlah pecahan terbaik
      bukan selalu yang beratnya kecil. Kutipan yang menyimpang jauh dari median diabaikan agar
      tidak memalsukan pemeringkatan.
    </p>
  </section>
</template>
