<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Menu, Moon, Sun } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import TickerBar from '@/components/TickerBar.vue'

const route = useRoute()
const isDark = ref(document.documentElement.classList.contains('dark'))
const mobileOpen = ref(false)

const links = [
  { to: '/', label: 'Harga' },
  { to: '/pantauan', label: 'Pantauan' },
  { to: '/berita', label: 'Berita' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/sumber/')
  return route.path === to
}

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
  isDark.value = true
}
</script>

<template>
  <a
    href="#konten"
    class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-md"
  >
    Lewati ke konten
  </a>

  <div class="min-h-screen bg-background text-foreground">
    <TickerBar />

    <header class="border-b bg-background">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <RouterLink
          to="/"
          class="inline-flex min-h-11 shrink-0 items-center gap-2.5 text-base font-extrabold tracking-[-0.02em] sm:text-lg"
        >
          <img
            src="/logos/bandingemas-mark.webp"
            alt=""
            width="256"
            height="187"
            class="h-9 w-auto"
            decoding="async"
          />
          <span>Banding<span class="text-gold-strong">emas</span></span>
        </RouterLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            :class="
              cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive(link.to)
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )
            "
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="size-11"
            :aria-label="isDark ? 'Matikan mode gelap' : 'Nyalakan mode gelap'"
            :title="isDark ? 'Matikan mode gelap' : 'Nyalakan mode gelap'"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" />
            <Moon v-else />
          </Button>

          <Sheet v-model:open="mobileOpen">
            <SheetTrigger as-child>
              <Button variant="outline" size="sm" class="h-11 gap-2 md:hidden">
                <Menu />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="right" class="w-72">
              <SheetHeader>
                <SheetTitle>Navigasi</SheetTitle>
              </SheetHeader>
              <nav class="flex flex-col gap-1 px-4" aria-label="Navigasi seluler">
                <RouterLink
                  v-for="link in links"
                  :key="link.to"
                  :to="link.to"
                  :aria-current="isActive(link.to) ? 'page' : undefined"
                  :class="
                    cn(
                      'flex min-h-11 items-center rounded-md px-3 text-sm transition-colors',
                      isActive(link.to)
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  "
                  @click="mobileOpen = false"
                >
                  {{ link.label }}
                </RouterLink>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <main id="konten" class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <RouterView />
    </main>

    <footer class="border-t">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6"
      >
        <p>Data disediakan oleh Logam Mulia API. Harga di-cache di perangkat selama satu menit.</p>
        <p>Harga bersifat informasi, bukan ajakan investasi.</p>
      </div>
    </footer>
  </div>
</template>
