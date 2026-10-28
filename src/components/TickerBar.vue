<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

/*
 * Bar pasar (DESIGN.md 5.1): sticky, latar gelap, data nyata dari API.
 * Tanpa animasi marquee tanpa akhir: teks bergulir horizontal bila sempit.
 */
const { goldSpots, isLoading } = useComparison()

const items = computed(() => goldSpots.value.slice(0, 8))
</script>

<template>
  <div class="sticky top-0 z-50 bg-[#111315] text-[#f9fafb] dark:bg-black">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div
        v-if="isLoading"
        aria-busy="true"
        class="flex h-9 items-center gap-6 overflow-hidden text-xs whitespace-nowrap"
      >
        <span class="sr-only">Memuat harga pasar...</span>
        <Skeleton v-for="i in 6" :key="i" class="h-4 w-44 shrink-0 bg-[#26292d]" />
      </div>
      <div
        v-else
        class="flex h-9 items-center gap-6 overflow-x-auto text-xs whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <template v-if="items.length > 0">
          <span
            v-for="spot in items"
            :key="spot.source"
            class="flex shrink-0 items-center gap-2"
          >
            <span class="font-medium text-[#9ca3af]">{{ spot.displayName }}</span>
            <span class="font-semibold tabular-nums">{{ formatRupiah(spot.pricePerGram) }}</span>
          </span>
        </template>
        <span v-else class="text-[#9ca3af]">Harga pasar sedang tidak tersedia</span>
      </div>
    </div>
  </div>
</template>
