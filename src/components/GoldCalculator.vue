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
 * Kalkulator simulasi (DESIGN.md 5.5): fokus interaksi, mengikuti tema
 * terang/gelap. Kalkulasi instan dari harga nyata sumber terpilih.
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
  <section class="rounded-2xl border bg-card p-6 sm:p-8">
    <h2 class="text-lg font-bold tracking-[-0.02em]">Kalkulator Simulasi Emas</h2>
    <p class="mt-1 text-sm text-muted-foreground">
      Hitung estimasi beli dan proyeksi buyback dari harga perantara pilihanmu.
    </p>

    <div v-if="isLoading" aria-busy="true" class="mt-6">
      <span class="sr-only">Memuat kalkulator...</span>
      <div class="grid gap-4 sm:grid-cols-2">
        <Skeleton class="h-16" />
        <Skeleton class="h-16" />
      </div>
      <div class="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="h-14" />
      </div>
    </div>

    <template v-else-if="activeSpot">
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            for="calc-grams"
            class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"
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
            class="mt-2 h-11 tabular-nums sm:h-9"
            placeholder="contoh: 10"
          />
        </div>
        <div>
          <label
            class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"
          >
            Acuan harga
          </label>
          <Select v-model="selectedSource">
            <SelectTrigger class="mt-2 h-11 w-full sm:h-9">
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

      <dl class="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Estimasi total beli
          </dt>
          <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
            {{ totalBuy === null ? '-' : formatRupiah(totalBuy) }}
          </dd>
          <p class="mt-1 text-xs text-muted-foreground">
            {{
              gramCount === null
                ? 'masukkan gramasi'
                : `${gramCount} g × ${formatRupiah(activeSpot.pricePerGram)}`
            }}
          </p>
        </div>
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Proyeksi buyback bersih
          </dt>
          <dd
            class="mt-1 text-xl font-bold tabular-nums sm:text-2xl"
            :class="netBuyback === null ? '' : 'text-gold-strong'"
          >
            {{ netBuyback === null ? 'tidak tersedia' : formatRupiah(netBuyback) }}
          </dd>
          <p v-if="netBuyback !== null" class="mt-1 text-xs text-muted-foreground">
            {{
              gramCount === null
                ? ''
                : `${gramCount} g × ${formatRupiah(activeSpot.buybackPerGram)}`
            }}
          </p>
        </div>
        <div>
          <dt class="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Selisih beli vs buyback
          </dt>
          <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
            {{ spreadLoss === null ? '-' : formatRupiah(spreadLoss) }}
          </dd>
          <p class="mt-1 text-xs text-muted-foreground">perkiraan biaya likuidasi</p>
        </div>
      </dl>

      <p class="mt-6 text-xs text-muted-foreground">
        Simulasi berdasarkan harga {{ activeSpot.displayName }} tanggal
        {{ activeSpot.recordedDate }}. Angka riil dapat berbeda karena ongkos buat, pajak, dan
        kebijakan masing-masing perantara.
      </p>
    </template>

    <p v-else class="mt-6 text-sm text-muted-foreground">
      Harga perantara sedang tidak tersedia, kalkulator belum bisa dihitung.
    </p>
  </section>
</template>
