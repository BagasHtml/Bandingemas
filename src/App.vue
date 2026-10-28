<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { Button } from '@/components/ui/button'
import TickerBar from '@/components/TickerBar.vue'
import { Moon, Sun } from '@lucide/vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Terapkan tema tersimpan saat aplikasi dimuat
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
  isDark.value = true
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Bar pasar paling atas (DESIGN.md 5.1) -->
    <TickerBar />

    <header class="border-b bg-card">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <RouterLink to="/" class="text-base font-extrabold tracking-[-0.02em] sm:text-lg">
          Banding<span class="text-gold-strong">emas</span>
        </RouterLink>

        <nav class="flex items-center gap-2.5 text-[13px] sm:gap-5 sm:text-sm">
          <RouterLink
            to="/"
            class="py-3 transition-colors duration-150 hover:text-foreground sm:py-2"
            active-class="font-semibold text-foreground"
            exact-active-class="font-semibold text-foreground"
          >
            Harga
          </RouterLink>
          <RouterLink
            to="/pantauan"
            class="py-3 text-muted-foreground transition-colors duration-150 hover:text-foreground sm:py-2"
            active-class="font-semibold text-foreground"
          >
            Pantauan
          </RouterLink>
          <RouterLink
            to="/berita"
            class="py-3 text-muted-foreground transition-colors duration-150 hover:text-foreground sm:py-2"
            active-class="font-semibold text-foreground"
          >
            Berita
          </RouterLink>
          <Button
            variant="ghost"
            size="icon"
            class="size-11"
            @click="toggleTheme"
            :title="isDark ? 'Mode terang' : 'Mode gelap'"
          >
            <Sun v-if="isDark" class="size-4" />
            <Moon v-else class="size-4" />
          </Button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <RouterView />
    </main>

    <footer class="border-t bg-card">
      <div class="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
        Data disediakan oleh Logam Mulia API. Harga di-cache di perangkatmu
        selama satu menit agar tidak membanjiri API. Harga bersifat informasi,
        bukan ajakan investasi.
      </div>
    </footer>
  </div>
</template>
