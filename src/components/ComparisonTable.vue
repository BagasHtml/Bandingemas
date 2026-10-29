<script setup lang="ts">
import { ref } from 'vue'
import { useComparison, type SpotPrice } from '@/composables/useComparison'
import { LOGOS } from '@/lib/logos'
import { formatRupiah } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, RefreshCw } from '@lucide/vue'

const { goldSpots, silverSpots, failedCount, isLoading, error, fetchComparison } =
  useComparison()

const MATERIALS = [
  { value: 'gold', label: 'Emas' },
  { value: 'silver', label: 'Perak' },
] as const

const selectedMaterial = ref<string>('gold')

function spotsFor(material: string): SpotPrice[] {
  return material === 'gold' ? goldSpots.value : silverSpots.value
}

function spreadOf(spot: SpotPrice): { rp: number; percent: number } | null {
  if (spot.buybackPerGram === null) return null
  const rp = spot.pricePerGram - spot.buybackPerGram
  if (rp <= 0) return null
  return { rp, percent: (rp / spot.pricePerGram) * 100 }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function hasProductType(type: string): boolean {
  return type.trim().length > 0 && type.toLowerCase() !== 'unknown'
}
</script>

<template>
  <section aria-labelledby="perbandingan-title" class="min-w-0">
    <Tabs v-model="selectedMaterial" class="flex flex-col gap-0">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div class="min-w-0">
          <h2 id="perbandingan-title" class="text-xl font-bold tracking-[-0.02em]">
            Perbandingan perantara
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Harga per gram, diurutkan dari termurah.
            <span v-if="failedCount > 0 && !isLoading">
              {{ failedCount }} sumber sedang tidak tersedia.
            </span>
          </p>
        </div>

        <TabsList class="h-11" aria-label="Pilih material">
          <TabsTrigger
            v-for="material in MATERIALS"
            :key="material.value"
            :value="material.value"
            class="h-11 px-3"
          >
            {{ material.label }}
          </TabsTrigger>
        </TabsList>
      </header>

      <div v-if="isLoading" class="py-6" aria-busy="true">
        <span class="sr-only">Memuat tabel perbandingan...</span>
        <div class="flex flex-col gap-4">
          <div v-for="i in 7" :key="i" class="flex items-center gap-3">
            <Skeleton class="size-9 shrink-0" />
            <Skeleton class="h-4 flex-1" />
            <Skeleton class="h-4 w-24 shrink-0" />
          </div>
        </div>
      </div>

      <Alert
        v-else-if="error && goldSpots.length === 0 && silverSpots.length === 0"
        variant="destructive"
        class="mt-6"
      >
        <AlertTitle>Tidak ada data harga</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center gap-3">
          <span>{{ error }}</span>
          <Button size="sm" variant="outline" @click="fetchComparison">
            <RefreshCw />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>

      <template v-else>
        <TabsContent
          v-for="material in MATERIALS"
          :key="material.value"
          :value="material.value"
          class="mt-0"
        >
          <div
            v-if="spotsFor(material.value).length === 0"
            class="py-10 text-sm text-muted-foreground"
          >
            Belum ada data {{ material.label.toLowerCase() }} dari sumber mana pun. Coba lagi nanti.
          </div>

          <template v-else>
            <div class="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow class="hover:bg-transparent">
                    <TableHead scope="col" class="w-10 pl-0">#</TableHead>
                    <TableHead scope="col" class="pl-0">Perantara</TableHead>
                    <TableHead scope="col" class="hidden md:table-cell">Produk</TableHead>
                    <TableHead scope="col" class="text-right">Beli/gram</TableHead>
                    <TableHead scope="col" class="text-right">Buyback/gram</TableHead>
                    <TableHead scope="col" class="text-right">Spread</TableHead>
                    <TableHead scope="col" class="w-12 pr-0 text-right">
                      <span class="sr-only">Situs</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(spot, index) in spotsFor(material.value)"
                    :key="spot.source"
                  >
                    <TableCell class="pl-0 text-xs tabular-nums text-muted-foreground">
                      {{ String(index + 1).padStart(2, '0') }}
                    </TableCell>
                    <TableCell class="pl-0">
                      <div class="flex items-center gap-3">
                        <span
                          v-if="LOGOS[spot.source]"
                          class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-white p-1"
                        >
                          <img
                            :src="LOGOS[spot.source]"
                            :alt="`Logo ${spot.displayName}`"
                            class="size-full object-contain"
                            loading="lazy"
                          />
                        </span>
                        <span
                          v-else
                          class="flex size-9 shrink-0 items-center justify-center rounded-sm bg-gold-surface text-xs font-bold text-gold-strong"
                        >
                          {{ initials(spot.displayName) }}
                        </span>

                        <div class="min-w-0">
                          <RouterLink
                            :to="`/sumber/${spot.source}`"
                            class="block truncate font-semibold underline-offset-4 hover:underline"
                          >
                            {{ spot.displayName }}
                          </RouterLink>
                          <Badge
                            v-if="index === 0"
                            variant="outline"
                            class="mt-1 px-1.5 py-0 text-[10px] font-semibold text-gold-strong"
                          >
                            Termurah
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="hidden max-w-40 truncate text-muted-foreground md:table-cell">
                      {{ hasProductType(spot.materialType) ? spot.materialType : '-' }}
                    </TableCell>
                    <TableCell class="text-right font-semibold tabular-nums">
                      {{ formatRupiah(spot.pricePerGram) }}
                    </TableCell>
                    <TableCell class="text-right tabular-nums text-muted-foreground">
                      {{ spot.buybackPerGram === null ? '-' : formatRupiah(spot.buybackPerGram) }}
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      <template v-if="spreadOf(spot)">
                        <span class="font-medium">{{ formatRupiah(spreadOf(spot)!.rp) }}</span>
                        <span class="block text-xs text-muted-foreground">
                          {{ spreadOf(spot)!.percent.toFixed(1).replace('.', ',') }}%
                        </span>
                      </template>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell class="pr-0 text-right">
                      <Button
                        v-if="spot.urlHomepage"
                        as-child
                        variant="ghost"
                        size="icon-sm"
                      >
                        <a
                          :href="spot.urlHomepage"
                          target="_blank"
                          rel="noopener noreferrer"
                          :aria-label="`Buka situs ${spot.displayName}`"
                        >
                          <ExternalLink />
                        </a>
                      </Button>
                      <span v-else class="text-xs text-muted-foreground">-</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <ul class="divide-y sm:hidden">
              <li
                v-for="(spot, index) in spotsFor(material.value)"
                :key="spot.source"
                class="py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      v-if="LOGOS[spot.source]"
                      class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-white p-1"
                    >
                      <img
                        :src="LOGOS[spot.source]"
                        :alt="`Logo ${spot.displayName}`"
                        class="size-full object-contain"
                        loading="lazy"
                      />
                    </span>
                    <span
                      v-else
                      class="flex size-9 shrink-0 items-center justify-center rounded-sm bg-gold-surface text-xs font-bold text-gold-strong"
                    >
                      {{ initials(spot.displayName) }}
                    </span>

                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <RouterLink
                          :to="`/sumber/${spot.source}`"
                          class="inline-flex min-h-11 min-w-0 items-center truncate font-semibold underline-offset-4 hover:underline"
                        >
                          {{ spot.displayName }}
                        </RouterLink>
                        <Badge
                          v-if="index === 0"
                          variant="outline"
                          class="shrink-0 px-1.5 py-0 text-[10px] font-semibold text-gold-strong"
                        >
                          Termurah
                        </Badge>
                      </div>
                      <p v-if="hasProductType(spot.materialType)" class="truncate text-xs text-muted-foreground">
                        {{ spot.materialType }}
                      </p>
                    </div>
                  </div>

                  <div class="shrink-0 text-right">
                    <p class="font-semibold tabular-nums">{{ formatRupiah(spot.pricePerGram) }}</p>
                    <p class="text-xs text-muted-foreground">per gram</p>
                  </div>
                </div>

                <dl class="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt class="text-muted-foreground">Buyback</dt>
                    <dd class="mt-0.5 font-medium tabular-nums">
                      {{
                        spot.buybackPerGram === null
                          ? 'tidak tersedia'
                          : formatRupiah(spot.buybackPerGram)
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Spread</dt>
                    <dd class="mt-0.5 font-medium tabular-nums">
                      <template v-if="spreadOf(spot)">
                        {{ spreadOf(spot)!.percent.toFixed(1).replace('.', ',') }}%
                      </template>
                      <template v-else>-</template>
                    </dd>
                  </div>
                  <div class="text-right">
                    <dt class="text-muted-foreground">Situs</dt>
                    <dd class="mt-0.5">
                      <a
                        v-if="spot.urlHomepage"
                        :href="spot.urlHomepage"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex min-h-11 items-center font-semibold text-gold-strong underline-offset-4 hover:underline"
                      >
                        Buka
                      </a>
                      <span v-else>-</span>
                    </dd>
                  </div>
                </dl>
              </li>
            </ul>
          </template>
        </TabsContent>
      </template>
    </Tabs>
  </section>
</template>
