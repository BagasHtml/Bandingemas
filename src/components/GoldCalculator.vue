<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComparison, type SpotPrice } from '@/composables/useComparison'
import { formatRupiah, formatDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
 * Kalkulator simulasi (DESIGN.md 5.5) dengan dua mode: beli dulu atau
 * hitung untung-rugi emas yang sudah dimiliki. Semua angka harga nyata
 * dari API, tanpa karangan.
 */
const { goldSpots, isLoading } = useComparison()

const gramCount = (value: number | string): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// ## Mode beli: total beli dan buyback bersih di satu perantara
const buyGrams = ref<number | string>(1)
const selectedSource = ref<string>('')

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

const totalBuy = computed(() => {
  const grams = gramCount(buyGrams.value)
  if (!activeSpot.value || grams === null) return null
  return activeSpot.value.pricePerGram * grams
})

const netBuyback = computed(() => {
  const grams = gramCount(buyGrams.value)
  if (!activeSpot.value || grams === null || activeSpot.value.buybackPerGram === null) return null
  return activeSpot.value.buybackPerGram * grams
})

const spreadLoss = computed(() => {
  if (totalBuy.value === null || netBuyback.value === null) return null
  return totalBuy.value - netBuyback.value
})

// ## Mode untung-rugi: harga beli milik pengguna vs buyback terbaik
const heldGrams = ref<number | string>('')
const heldCost = ref<number | string>('')
const heldCostPerGram = ref<number | string>('')

// Buyback hanya berarti di perantara yang satu merek dengan barangnya,
// jadi peringkat ini bukan ajakan pindah gudang: ke mana untungnya tertinggi.
const sellable = computed(() =>
  goldSpots.value
    .filter((spot): spot is SpotPrice & { buybackPerGram: number } => spot.buybackPerGram !== null)
    .sort((a, b) => b.buybackPerGram - a.buybackPerGram),
)

const heldGramValue = computed(() => gramCount(heldGrams.value))

// Harga beli bisa lewat total pengeluaran atau langsung per gram; yang
// terisi lebih dulu dipakai, biar sesuai nota pengguna.
const heldCostValue = computed(() => {
  const grams = heldGramValue.value
  if (grams === null) return null
  if (heldCost.value !== '') {
    const parsed = Number(heldCost.value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed / grams
  }
  if (heldCostPerGram.value !== '') {
    const parsed = Number(heldCostPerGram.value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
})

const bestSell = computed(() => {
  const grams = heldGramValue.value
  const cost = heldCostValue.value
  const best = sellable.value[0]
  if (grams === null || cost === null || !best) return null
  const value = best.buybackPerGram * grams
  return { spot: best, value, pl: value - cost * grams, costPerGram: cost }
})

const topSell = computed(() => sellable.value[0] ?? null)

const altSells = computed(() => sellable.value.slice(1, 3))
</script>

<template>
  <section
    class="on-strong -mx-4 bg-strong px-5 py-10 text-strong-foreground sm:-mx-6 sm:px-10 sm:py-12"
    aria-labelledby="kalkulator-title"
  >
    <div class="flex max-w-xl flex-col gap-3">
      <h2 id="kalkulator-title" class="text-xl font-semibold tracking-tight">Kalkulator emas</h2>
      <p class="text-sm leading-relaxed text-strong-muted">
        Hitung rencana beli, atau anggarkan untung-rugi emas yang sudah kamu pegang, dengan harga
        nyata perantara.
      </p>
    </div>

    <Tabs default-value="beli" class="mt-6">
      <TabsList
        class="border border-strong-border bg-transparent"
        aria-label="Mode kalkulator"
      >
        <TabsTrigger
          value="beli"
          class="text-strong-muted data-[state=active]:text-foreground"
        >
          Simulasi beli
        </TabsTrigger>
        <TabsTrigger
          value="jual"
          class="text-strong-muted data-[state=active]:text-foreground"
        >
          Untung-rugi jual
        </TabsTrigger>
      </TabsList>

      <TabsContent value="beli" class="mt-8">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="calc-grams" class="text-xs font-medium text-strong-muted">Gramasi</label>
              <Input
                id="calc-grams"
                v-model="buyGrams"
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

          <div v-if="isLoading" aria-busy="true">
            <span class="sr-only">Memuat kalkulator beli...</span>
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
                    gramCount(buyGrams) === null || totalBuy === null
                      ? 'masukkan gramasi'
                      : `${gramCount(buyGrams)} g × ${formatRupiah(activeSpot.pricePerGram)}`
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
                  {{ gramCount(buyGrams) }} g × {{ formatRupiah(activeSpot.buybackPerGram) }}
                </p>
              </div>
              <div>
                <dt class="text-xs text-strong-muted">Selisih</dt>
                <dd class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
                  {{ spreadLoss === null ? '-' : formatRupiah(spreadLoss) }}
                </dd>
                <p class="mt-1 text-xs text-strong-muted">perkiraan biaya jual kembali</p>
              </div>
            </dl>

            <p class="text-xs leading-relaxed text-strong-muted">
              Berdasarkan harga {{ activeSpot.displayName }} per
              {{ formatDate(activeSpot.recordedDate) }}. Angka riil bisa berbeda karena ongkos buat,
              pajak, dan kebijakan tiap perantara.
            </p>
          </div>

          <p v-else class="text-sm text-strong-muted">
            Harga perantara sedang tidak tersedia, kalkulator belum bisa dihitung.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="jual" class="mt-8">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="calc-held-grams" class="text-xs font-medium text-strong-muted">
                Gram emasmu
              </label>
              <Input
                id="calc-held-grams"
                v-model="heldGrams"
                type="number"
                min="0"
                step="0.5"
                inputmode="decimal"
                class="h-11 tabular-nums"
                placeholder="contoh: 3"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="calc-held-total" class="text-xs font-medium text-strong-muted">
                Total pengeluaran beli
              </label>
              <Input
                id="calc-held-total"
                v-model="heldCost"
                type="number"
                min="0"
                step="1000"
                inputmode="numeric"
                class="h-11 tabular-nums"
                placeholder="contoh: 7500000"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="calc-held-cost" class="text-xs font-medium text-strong-muted">
                atau harga beli per gram
              </label>
              <Input
                id="calc-held-cost"
                v-model="heldCostPerGram"
                type="number"
                min="0"
                step="1000"
                inputmode="numeric"
                class="h-11 tabular-nums"
                placeholder="contoh: 2500000"
              />
            </div>
          </div>

          <div v-if="isLoading" aria-busy="true">
            <span class="sr-only">Memuat kalkulator untung-rugi...</span>
            <div class="grid gap-6 sm:grid-cols-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 bg-white/10" />
            </div>
          </div>

          <template v-else>
            <div v-if="bestSell" class="flex flex-col gap-6">
              <div class="grid gap-6 sm:grid-cols-3 lg:border-l lg:border-strong-border lg:pl-12">
                <div>
                  <dt class="text-xs text-strong-muted">Nilai jual terbaik</dt>
                  <dd class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
                    {{ formatRupiah(bestSell.value) }}
                  </dd>
                  <p class="mt-1 text-xs tabular-nums text-strong-muted">
                    {{ heldGramValue }} g × {{ formatRupiah(bestSell.spot.buybackPerGram) }} di
                    {{ bestSell.spot.displayName }}
                  </p>
                </div>
                <div>
                  <dt class="text-xs text-strong-muted">Posisi untung-rugi</dt>
                  <dd
                    class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight"
                    :class="bestSell.pl >= 0 ? 'text-positive' : 'text-negative'"
                  >
                    {{ bestSell.pl >= 0 ? '&#43;' : '-' }}{{ formatRupiah(Math.abs(bestSell.pl)) }}
                  </dd>
                  <p class="mt-1 text-xs tabular-nums text-strong-muted">
                    terhadap {{ formatRupiah(bestSell.costPerGram) }}/g yang kamu bayar
                  </p>
                </div>
                <div class="flex flex-col">
                  <dt class="text-xs text-strong-muted">Buyback lain</dt>
                  <ul v-if="altSells.length > 0" class="mt-1.5 flex flex-col gap-1.5">
                    <li
                      v-for="alt in altSells"
                      :key="alt.source"
                      class="flex items-baseline justify-between gap-3 border-b border-strong-border pb-1.5"
                    >
                      <span class="text-xs font-medium">{{ alt.displayName }}</span>
                      <span class="text-xs tabular-nums text-strong-muted">
                        {{ formatRupiah(alt.buybackPerGram) }}/g
                      </span>
                    </li>
                  </ul>
                  <span v-else class="mt-1.5 text-xs text-strong-muted">
                    tidak ada buyback lain yang diketahui
                  </span>
                </div>
              </div>

              <p class="text-xs leading-relaxed text-strong-muted">
                Peringatan penting: buyback berlaku di perantara keluaran produknya, jadi pilih
                berdasarkan ke mana emasmu bisa dikembalikan. Angka belum termasuk pajak transaksi
                dan biaya cetak. Harga {{ bestSell.spot.displayName }} tercatat
                {{ formatDate(bestSell.spot.recordedDate) }}.
              </p>
            </div>

            <div v-else class="grid gap-4 lg:border-l lg:border-strong-border lg:pl-12">
              <p class="text-sm leading-relaxed text-strong-muted">
                {{
                  gramCount(heldGrams) === null
                    ? 'Isi gram emasmu dulu, lalu harga belinya, untuk melihat posisi untung-rugi hari ini.'
                    : sellable.length === 0
                      ? 'Saat ini belum ada perantara yang memuat harga buyback. Muncul lagi saat harga terisi.'
                      : 'Total pengeluaran atau harga beli per gram belum terisi, posisi belum bisa dihitung.'
                }}
              </p>
              <p v-if="topSell" class="text-xs text-strong-muted">
                Buyback tertinggi saat ini: {{ topSell.displayName }},
                {{ formatRupiah(topSell.buybackPerGram) }}/g.
              </p>
            </div>
          </template>
        </div>
      </TabsContent>
    </Tabs>
  </section>
</template>
