<script setup lang="ts">
import type { SourceInfo } from '@/api/emas/types'
import { LOGOS } from '@/lib/logos'
import { ExternalLink } from '@lucide/vue'

defineProps<{
  source: SourceInfo
}>()

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
</script>

<template>
  <div class="flex min-h-16 items-center gap-3 border-b py-3">
    <span
      class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-white p-1"
    >
      <img
        v-if="LOGOS[source.name]"
        :src="LOGOS[source.name]"
        :alt="`Logo ${source.displayName ?? source.name}`"
        class="size-full object-contain"
        loading="lazy"
      />
      <span v-else class="text-xs font-bold text-gold-strong">{{
        initials(source.displayName)
      }}</span>
    </span>

    <RouterLink
      :to="`/sumber/${source.name}`"
      class="group flex min-h-11 min-w-0 flex-1 flex-col justify-center"
    >
      <span class="block truncate text-sm font-medium underline-offset-4 group-hover:underline">
        {{ source.displayName ?? source.name }}
      </span>
      <span class="block text-xs text-muted-foreground">Lihat harga dan riwayat</span>
    </RouterLink>

    <a
      v-if="source.urlHomepage"
      :href="source.urlHomepage"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      :aria-label="`Buka situs ${source.displayName ?? source.name} di tab baru`"
    >
      Situs
      <ExternalLink class="size-3.5" aria-hidden="true" />
    </a>
  </div>
</template>
