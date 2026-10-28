<script setup lang="ts">
import { onMounted } from 'vue'
import { useNews } from '@/composables/useNews'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import NewsCard from '@/components/NewsCard.vue'
import { RefreshCw } from '@lucide/vue'

const { news, isLoading, error, fetchNews } = useNews()

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div>
    <div class="mb-6 border-b pb-6">
      <h1 class="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Berita Emas & Investasi</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Kabar terbaru seputar harga emas dan pasar logam mulia.
      </p>
    </div>

    <!-- Status gagal memuat berita -->
    <Alert v-if="error && !isLoading" variant="destructive" class="mb-6">
      <AlertTitle>Gagal memuat berita</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <span>{{ error }}</span>
        <Button size="sm" variant="outline" @click="fetchNews">
          <RefreshCw class="size-4" />
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Loading: kerangka artikel -->
    <div v-if="isLoading" aria-busy="true" class="space-y-6">
      <span class="sr-only">Memuat berita...</span>
      <div v-for="i in 5" :key="i" class="border-b pb-5">
        <Skeleton class="h-3 w-48" />
        <Skeleton class="mt-2 h-5 w-full max-w-xl" />
        <Skeleton class="mt-2 h-4 w-full max-w-lg" />
      </div>
    </div>

    <!-- Daftar berita -->
    <div v-else-if="news.length > 0">
      <NewsCard v-for="item in news" :key="item.url" :item="item" />
    </div>

    <!-- Kosong -->
    <p v-else class="py-12 text-sm text-muted-foreground">
      Belum ada berita yang tersedia. Coba lagi nanti.
    </p>
  </div>
</template>
