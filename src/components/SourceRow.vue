<script setup lang="ts">
import type { SourceInfo } from '@/api/types'
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
  <!-- Kartu direktori (DESIGN.md 5.4): tautan ke detail + portal resmi -->
  <div
    class="flex items-center gap-3 rounded-2xl border bg-card p-5 transition-colors duration-150 hover:bg-[#f9fafb] dark:hover:bg-[#26292d]"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border"
    >
      <img
        v-if="LOGOS[source.name]"
        :src="LOGOS[source.name]"
        :alt="`Logo ${source.displayName ?? source.name}`"
        class="size-7 object-contain"
        loading="lazy"
      />
      <template v-else>
        <span class="text-xs font-bold text-gold-strong">{{ initials(source.displayName) }}</span>
      </template>
    </span>

    <div class="min-w-0 flex-1">
      <RouterLink
        :to="`/sumber/${source.name}`"
        class="block truncate text-sm font-semibold underline-offset-4 hover:underline"
      >
        {{ source.displayName ?? source.name }}
      </RouterLink>
      <p class="truncate text-xs text-muted-foreground">Lihat harga lengkap</p>
    </div>

    <a
      v-if="source.urlHomepage"
      :href="source.urlHomepage"
      target="_blank"
      rel="noopener noreferrer"
      class="flex shrink-0 items-center gap-1 text-xs font-medium text-gold-strong underline-offset-4 hover:underline"
      :title="`Buka situs ${source.displayName ?? source.name}`"
    >
      Situs
      <ExternalLink class="size-3" />
    </a>
  </div>
</template>
