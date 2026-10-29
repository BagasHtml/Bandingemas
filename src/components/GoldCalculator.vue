<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComparison } from '@/composables/useComparison'
import { formatRupiah, formatDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

/*
 * Kalkulator simulasi (DESIGN.md 5.5): hitung total beli dan buyback bersih
 * dari harga nyata perantara terpilih.
 */
const { goldSpots, isLoading } = useComparison()

const grams = ref<number | string>(1)
const selectedSource = ref<string>('')

// Isi pilihan awal supaya kontrol tidak tampil seperti placeholder kosong
watch(
  goldSpots,
  (spots) => {
    if (!selectedSource.value && spots[0]) selectedSource.value = spots[0].source
  },
  { immediate: true },
)

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
  <section
    class="on-strong -mx-4 bg-strong px-5 py-10 text-strong-foreground sm:-mx-6 sm:px-10 sm:py-12"
    aria-labelledby="kalkulator-title"
  >
    <div class="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
      <div class="flex flex-col gap-6">
        <div>
          <h2 id="kalkulator-title" class="text-xl font-semibold tracking-tight">
            Kalkulator emas
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-strong-muted">
            Hitung total beli dan buyback bersih dari harga perantara pilihanmu.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label for="calc-grams" class="text-xs font-medium text-strong-muted">Gramasi</label>
            <Input
              id="calc-grams"
              v-model="grams"
              type="number"
              min="0"
              step="0.5"
              inputmode="decimal"
              class="h-11 tabular-nums"
              placeholder="contoh: 10"
            />
          </div>
          <div class="flex flex-col gap-2">
            <span id="calc-source-label" class="text-xs font-medium text-strong-muted">
              Acuan harga
            </span>
            <Select v-model="selectedSource">
              <SelectTrigger
                class="w-full data-[size=default]:h-11"
                aria-labelledby="calc-source-label"
              >
                <SelectValue :placeholder="activeSpot?.displayName ?? 'Pilih perantara'" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="spot in goldSpots" :key="spot.source" :value="spot.source">
                    {{ spot.displayName }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div v-if="isLoading" aria-busy="true">
        <span class="sr-only">Memuat kalkulator...</span>
        <div class="grid gap-6 sm:grid-cols-3">
          <Skeleton v-for="i in 3" :key="i" class="h-16 bg-white/10" />
        </div>
      </div>

      <div v-else-if="activeSpot" class="flex flex-col gap-6">
        <dl class="grid gap-6 sm:grid-cols-3 lg:border-l lg:border-strong-border lg:pl-12">
          <div>
            <dt class="text-xs text-strong-muted">Total beli</dt>
            <dd class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
              {{ totalBuy === null ? '-' : formatRupiah(totalBuy) }}
            </dd>
            <p class="mt-1 text-xs tabular-nums text-strong-muted">
              {{
                gramCount === null || totalBuy === null
                  ? 'masukkan gramasi'
                  : `${gramCount} g × ${formatRupiah(activeSpot.pricePerGram)}`
              }}
            </p>
          </div>
          <div>
            <dt class="text-xs text-strong-muted">Buyback bersih</dt>
            <dd
              class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight"
              :class="netBuyback === null ? 'text-strong-muted' : 'text-gold'"
            >
              {{ netBuyback === null ? 'tidak tersedia' : formatRupiah(netBuyback) }}
            </dd>
            <p v-if="netBuyback !== null" class="mt-1 text-xs tabular-nums text-strong-muted">
              {{ gramCount }} g × {{ formatRupiah(activeSpot.buybackPerGram) }}
            </p>
          </div>
          <div>
            <dt class="text-xs text-strong-muted">Selisih</dt>
            <dd class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
              {{ spreadLoss === null ? '-' : formatRupiah(spreadLoss) }}
            </dd>
            <p class="mt-1 text-xs text-strong-muted">perkiraan biaya likuidasi</p>
          </div>
        </dl>

        <p class="text-xs leading-relaxed text-strong-muted">
          Berdasarkan harga {{ activeSpot.displayName }} per {{ formatDate(activeSpot.recordedDate) }}.
          Angka riil bisa berbeda karena ongkos buat, pajak, dan kebijakan tiap perantara.
        </p>
      </div>

      <p v-else class="text-sm text-strong-muted">
        Harga perantara sedang tidak tersedia, kalkulator belum bisa dihitung.
      </p>
    </div>
  </section>
</template>
