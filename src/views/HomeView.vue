<script setup lang="ts">
import { onMounted } from 'vue'
import { useSources } from '@/composables/useSources'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  <div class="space-y-12">
    <!-- Hero: harga terendah, chip gramasi, sparkline (DESIGN.md 5.2) -->
    <HeroPriceCard />

    <!-- Tabel perbandingan antar perantara (DESIGN.md 5.3) -->
    <ComparisonTable />

    <!-- Estimasi harga emas saat ini: distribusi + rata-rata -->
    <GoldEstimateChart />

    <!-- Liga likuiditas: peringkat biaya main lagi (beli ke buyback) -->
    <LiquidityLeague />

    <!-- Kalkulator simulasi (DESIGN.md 5.5) -->
    <GoldCalculator />

    <!-- Indeks perantara (DESIGN.md 5.4) -->
    <section>
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-lg font-bold tracking-[-0.02em]">Indeks Perantara</h2>
        <span v-if="!sourcesLoading && sources.length > 0" class="text-sm text-muted-foreground">
          {{ sources.length }} sumber terpantau
        </span>
      </div>

      <Alert v-if="sourcesError && !sourcesLoading" variant="destructive" class="mb-4">
        <AlertTitle>Gagal memuat daftar sumber</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center gap-3">
          <span>{{ sourcesError }}</span>
          <Button size="sm" variant="outline" @click="fetchSources">
            <RefreshCw class="size-4" />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>

      <div v-if="sourcesLoading" aria-busy="true" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <span class="sr-only">Memuat daftar perantara...</span>
        <Skeleton v-for="i in 6" :key="i" class="h-[74px] rounded-2xl" />
      </div>

      <div v-else-if="sources.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SourceRow v-for="source in sources" :key="source.name" :source="source" />
      </div>

      <p v-else class="text-sm text-muted-foreground">
        Daftar perantara kosong. Coba muat ulang halaman.
      </p>
    </section>
  </div>
</template>
