<script setup lang="ts">
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { formatRupiah } from '@/lib/format'

export interface ChartPoint {
  date: string
  price: number
}

const props = defineProps<{
  data: ChartPoint[]
}>()

// Garis emas: grafik adalah titik fokus halaman ini (DESIGN.md, aksen hemat)
const chartConfig = {
  price: {
    label: 'Harga Jual',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

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
  <ChartContainer :config="chartConfig" class="h-72 w-full">
    <VisXYContainer :data="props.data" :style="{ height: '100%' }">
      <ChartCrosshair template="y" color="rgba(0, 0, 0, 0.15)" />
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
</template>
