<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

/*
 * Kalkulator simulasi (DESIGN.md 5.5): kontainer gelap, fokus interaksi.
 * Kalkulasi instan dari harga nyata sumber terpilih.
 */
const { goldSpots, isLoading } = useComparison()

const grams = ref<number | string>(1)
const selectedSource = ref<string>('')

const activeSpot = computed(() => {
  const found = goldSpots.value.find((s) => s.source === selectedSource.value)
  return found ?? goldSpots.value[0] ?? null
})

const gramCount = computed(() => {
  const value = typeof grams.value === 'number' ? grams.value : Number(grams.value)
  return Number.isFinite(value) && value > 0 ? value : null
})

const totalBuy = computed(() => {
  if (!activeSpot.value || gramCount.value === null) return null
  return activeSpot.value.pricePerGram * gramCount.value
})

const netBuyback = computed(() => {
  if (!activeSpot.value || gramCount.value === null) return null
  if (activeSpot.value.buybackPerGram === null) return null
  return activeSpot.value.buybackPerGram * gramCount.value
})

const spreadLoss = computed(() => {
  if (totalBuy.value === null || netBuyback.value === null) return null
  return totalBuy.value - netBuyback.value
})
</script>

<template>
  <section class="rounded-2xl bg-[#111315] p-6 text-[#f9fafb] sm:p-8 dark:bg-black">
    <h2 class="text-lg font-bold tracking-[-0.02em]">Kalkulator Simulasi Emas</h2>
    <p class="mt-1 text-sm text-[#9ca3af]">
      Hitung estimasi beli dan proyeksi buyback dari harga perantara pilihanmu.
    </p>

    <div v-if="isLoading" aria-busy="true" class="mt-6">
      <span class="sr-only">Memuat kalkulator...</span>
      <div class="grid gap-4 sm:grid-cols-2">
        <Skeleton class="h-16 bg-[#26292d]" />
        <Skeleton class="h-16 bg-[#26292d]" />
      </div>
      <div class="mt-6 grid gap-4 border-t border-[#2a2e33] pt-6 sm:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="h-14 bg-[#26292d]" />
      </div>
    </div>

    <template v-else-if="activeSpot">
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            for="calc-grams"
            class="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]"
          >
            Gramasi
          </label>
          <Input
            id="calc-grams"
            v-model="grams"
            type="number"
            min="0"
            step="0.5"
            inputmode="decimal"
            class="mt-2 border-[#2a2e33] bg-[#1a1d20] tabular-nums text-[#f9fafb] placeholder:text-[#6b7280]"
            placeholder="contoh: 10"
          />
        </div>
        <div>
          <label class="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
            Acuan harga
          </label>
          <Select v-model="selectedSource">
            <SelectTrigger class="mt-2 w-full border-[#2a2e33] bg-[#1a1d20] text-[#f9fafb]">
              <SelectValue :placeholder="activeSpot.displayName" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="spot in goldSpots" :key="spot.source" :value="spot.source">
                {{ spot.displayName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <dl class="mt-6 grid gap-4 border-t border-[#2a2e33] pt-6 sm:grid-cols-3">
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
            Estimasi total beli
          </dt>
          <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
            {{ totalBuy === null ? '-' : formatRupiah(totalBuy) }}
          </dd>
          <p class="mt-1 text-xs text-[#9ca3af]">
            {{
              gramCount === null
                ? 'masukkan gramasi'
                : `${gramCount} g × ${formatRupiah(activeSpot.pricePerGram)}`
            }}
          </p>
        </div>
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
            Proyeksi buyback bersih
          </dt>
          <dd
            class="mt-1 text-xl font-bold tabular-nums sm:text-2xl"
            :class="netBuyback === null ? '' : 'text-[#c89922]'"
          >
            {{ netBuyback === null ? 'tidak tersedia' : formatRupiah(netBuyback) }}
          </dd>
          <p v-if="netBuyback !== null" class="mt-1 text-xs text-[#9ca3af]">
            {{
              gramCount === null
                ? ''
                : `${gramCount} g × ${formatRupiah(activeSpot.buybackPerGram)}`
            }}
          </p>
        </div>
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">
            Selisih beli vs buyback
          </dt>
          <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
            {{ spreadLoss === null ? '-' : formatRupiah(spreadLoss) }}
          </dd>
          <p class="mt-1 text-xs text-[#9ca3af]">perkiraan biaya likuidasi</p>
        </div>
      </dl>

      <p class="mt-6 text-xs text-[#9ca3af]">
        Simulasi berdasarkan harga {{ activeSpot.displayName }} tanggal
        {{ activeSpot.recordedDate }}. Angka riil dapat berbeda karena ongkos buat, pajak, dan
        kebijakan masing-masing perantara.
      </p>
    </template>

    <p v-else class="mt-6 text-sm text-[#9ca3af]">
      Harga perantara sedang tidak tersedia, kalkulator belum bisa dihitung.
    </p>
  </section>
</template>
