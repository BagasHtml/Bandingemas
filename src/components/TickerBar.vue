<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

const { goldSpots, isLoading, fetchComparison } = useComparison()

const items = computed(() => goldSpots.value.slice(0, 8))

// Ticker tampil di semua halaman; jangan bergantung pada halaman beranda
fetchComparison()
</script>

<template>
  <div class="border-b border-strong-border bg-strong text-strong-foreground" aria-label="Harga pasar">
    <div
      class="mx-auto flex h-9 max-w-6xl items-center gap-6 overflow-x-auto px-4 text-xs whitespace-nowrap [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
    >
      <template v-if="isLoading">
        <span class="sr-only">Memuat harga pasar...</span>
        <Skeleton v-for="i in 6" :key="i" class="h-3 w-36 shrink-0 bg-white/10" />
      </template>
      <template v-else-if="items.length > 0">
        <span v-for="spot in items" :key="spot.source" class="flex shrink-0 items-baseline gap-2">
          <span class="text-strong-muted">{{ spot.displayName }}</span>
          <span class="font-semibold tabular-nums">{{ formatRupiah(spot.pricePerGram) }}</span>
        </span>
      </template>
      <span v-else class="text-strong-muted">Harga pasar sedang tidak tersedia</span>
    </div>
  </div>
</template>
