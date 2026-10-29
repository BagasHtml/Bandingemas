<script setup lang="ts">
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { VisArea, VisLine, VisXYContainer } from '@unovis/vue'
import { formatRupiah } from '@/lib/format'
import { computed } from 'vue'

export interface ChartPoint {
  date: string
  price: number
}

const props = defineProps<{
  data: ChartPoint[]
  gradId?: string
}>()

// Garis emas: grafik adalah titik fokus halaman ini (DESIGN.md, aksen hemat)
const chartConfig = {
  price: {
    label: 'Harga Jual',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

// Isi gunung dari gradien svg: puncak pekat, dasar pudar. Id harus unik
// karena fill url() dilihat dari seluruh dokumen.
const gradId = computed(() => `grad-${props.gradId ?? 'gold-mountain'}`)
const areaFill = computed(() => `url(#${gradId.value})`)

const x = (point: ChartPoint) => new Date(point.date).getTime()
const y = (point: ChartPoint) => point.price

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
})

function tickFormatX(value: number): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
    new Date(value),
  )
}

function tickFormatY(value: number): string {
  return `Rp ${compactFormatter.format(value)}`
}

function tooltipTemplate(point: ChartPoint): string {
  return `
    <div class="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div class="font-medium">${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(point.date))}</div>
      <div class="mt-1 font-semibold tabular-nums">${formatRupiah(point.price)}</div>
    </div>
  `
}
</script>

<template>
  <div class="relative w-full">
    <svg class="pointer-events-none absolute size-0" aria-hidden="true">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--gold-strong)" stop-opacity="0.4" />
          <stop offset="100%" stop-color="var(--gold-strong)" stop-opacity="0.04" />
        </linearGradient>
      </defs>
    </svg>

    <ChartContainer :config="chartConfig" class="h-72 w-full">
      <VisXYContainer :data="props.data" :style="{ height: '100%' }">
        <ChartCrosshair template="y" color="rgba(0, 0, 0, 0.15)" />
        <VisArea :x="x" :y="y" :color="areaFill" />
        <VisLine :x="x" :y="y" color="var(--color-price)" :stroke-width="1.5" />
        <VisAxis type="x" :x="x" :tick-format="tickFormatX" :num-ticks="6" :grid-line="false" />
        <VisAxis
          type="y"
          :y="y"
          :tick-format="tickFormatY"
          :num-ticks="5"
          :domain="[undefined, undefined]"
        />
        <ChartTooltip :template="tooltipTemplate" />
      </VisXYContainer>
    </ChartContainer>
  </div>
</template>
