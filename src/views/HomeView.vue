<script setup lang="ts">
import { onMounted } from 'vue'
import { useSources } from '@/composables/useSources'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import HeroPriceCard from '@/components/HeroPriceCard.vue'
import ComparisonTable from '@/components/ComparisonTable.vue'
import GoldEstimateChart from '@/components/GoldEstimateChart.vue'
import LiquidityLeague from '@/components/LiquidityLeague.vue'
import GoldCalculator from '@/components/GoldCalculator.vue'
import SourceRow from '@/components/SourceRow.vue'
import { RefreshCw } from '@lucide/vue'

const { sources, isLoading: sourcesLoading, error: sourcesError, fetchSources } = useSources()

onMounted(() => {
  fetchSources()
})
</script>

<template>
  <div class="flex flex-col gap-14 sm:gap-20">
    <HeroPriceCard />

    <section class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <ComparisonTable />

      <aside
        aria-label="Bacaan pasar"
        class="flex flex-col gap-8 lg:border-l lg:border-border lg:pl-10"
      >
        <GoldEstimateChart />
        <Separator />
        <LiquidityLeague />
      </aside>
    </section>

    <GoldCalculator />

    <section aria-labelledby="direktori-title">
      <div class="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
        <h2 id="direktori-title" class="text-lg font-semibold tracking-tight">
          Indeks perantara
        </h2>
        <span
          v-if="!sourcesLoading && sources.length > 0"
          class="text-sm tabular-nums text-muted-foreground"
        >
          {{ sources.length }} sumber terpantau
        </span>
      </div>

      <Alert v-if="sourcesError && !sourcesLoading" variant="destructive" class="mt-4">
        <AlertTitle>Gagal memuat daftar sumber</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center gap-3">
          <span>{{ sourcesError }}</span>
          <Button size="sm" variant="outline" @click="fetchSources">
            <RefreshCw class="size-4" />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>

      <div
        v-if="sourcesLoading"
        aria-busy="true"
        class="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        <span class="sr-only">Memuat daftar perantara...</span>
        <Skeleton v-for="i in 6" :key="i" class="h-16 rounded-none" />
      </div>

      <div v-else-if="sources.length > 0" class="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <SourceRow v-for="source in sources" :key="source.name" :source="source" />
      </div>

      <p v-else class="py-4 text-sm text-muted-foreground">
        Daftar perantara kosong. Coba muat ulang halaman.
      </p>
    </section>
  </div>
</template>
