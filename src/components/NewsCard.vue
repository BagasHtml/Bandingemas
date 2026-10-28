<script setup lang="ts">
import type { NewsItem } from '@/api/types'
import { formatDateTime } from '@/lib/format'

defineProps<{
  item: NewsItem
}>()
</script>

<template>
  <!-- Item berita gaya kolom koran: garis tipis, judul serif, tanpa kartu -->
  <article class="border-b py-5 last:border-b-0">
    <p class="text-xs text-muted-foreground">
      {{ item.displayName || item.source }} · {{ formatDateTime(item.publishedAt) }}
      <template v-if="item.category"> · {{ item.category }}</template>
    </p>
    <h2 class="mt-1.5 text-base font-semibold leading-snug">
      <a
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="underline-offset-4 hover:underline"
      >
        {{ item.title }}
      </a>
    </h2>
    <p v-if="item.summary" class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
      {{ item.summary }}
    </p>
  </article>
</template>
