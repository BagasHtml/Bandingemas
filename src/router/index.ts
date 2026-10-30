import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/sumber/:source',
      name: 'source-detail',
      component: () => import('../views/SourceDetailView.vue'),
    },
    {
      path: '/pantauan',
      name: 'watchlist',
      component: () => import('../views/WatchlistView.vue'),
    },
    {
      path: '/saham',
      name: 'saham',
      component: () => import('../views/SahamView.vue'),
    },
    {
      path: '/berita',
      name: 'news',
      component: () => import('../views/NewsView.vue'),
    },
  ],
})

export default router
