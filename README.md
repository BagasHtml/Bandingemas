# EmasKu

Portal pemantau dan komparasi harga emas komoditas Indonesia: harga perantara
resmi (Antam, Pegadaian, BSI, Treasury, dll), riwayat harga, kalkulator simulasi,
dan berita pasar.

Dibangun dengan Vue 3 + TypeScript + Vite, shadcn-vue (Tailwind CSS v4),
dan data dari [Logam Mulia API](https://logam-mulia-api.iamutaki.workers.dev/api/docs).

Sistem desain ada di [DESIGN.md](DESIGN.md): netral bersih dengan aksen emas
taktis, Inter + angka tabular, komponen fungsional tanpa gimmick visual.

Logo perantara di `public/logos/` diunduh langsung dari situs resmi
masing-masing (ulangi dengan `node scripts/fetch-logos.mjs`; pemetaan ada di
`src/lib/logos.ts`, fallback inisial bila logo tidak tersedia).

## Fitur

- **Bar pasar (ticker)**: bar gelap sticky di atas, harga per gram dari sumber
  yang sehat, data nyata dari API
- **Hero price card**: harga emas terendah hari ini, chip gramasi interaktif
  (0.5g sampai 100g) untuk estimasi total beli, metrik selisih antar perantara,
  perubahan 30 hari, dan sparkline 7 hari
- **Perbandingan antar perantara**: tabel harga beli/buyback per gram + spread
  (Rp & %), filter material emas/perak, diurutkan dari termurah
- **Kalkulator simulasi**: kontainer gelap fokus, estimasi total beli, proyeksi
  buyback bersih, dan selisih likuidasi dari harga sumber pilihan
- **Indeks perantara**: grid direktori semua sumber terpantau
- **Detail sumber**: tabel harga per produk, filter material, grafik riwayat harga
- **Berita**: kabar emas & investasi dari Investor.id
- **Estimasi harga saat ini**: median harga per gram antar perantara dengan
  bar chart distribusi, tahan terhadap harga ekstrem dari satu-dua sumber
- **Cache & throttling**: cache TTL di sisi klien (harga 60 detik, riwayat dan
  berita 5 menit, daftar sumber 10 menit), dedup request in-flight, jeda
  antar request 250 ms, dan fallback data kadaluarsa saat upstream gagal
- **Skeleton loading**: kerangka animasi yang menyerupai konten asli di semua
  bagian yang memuat data, menghormati `prefers-reduced-motion`
- **Mode terang/gelap**: toggle tersimpan di localStorage, keduanya berfungsi penuh

## Menjalankan

```sh
bun install
bun run dev      # server pengembangan
bun run build    # build produksi + type-check
bun run lint     # oxlint + eslint
bun run test:unit
```

## Struktur

```
src/
├── api/          # Client API bertipe (types.ts, client.ts)
├── components/   # TickerBar, HeroPriceCard, ComparisonTable, GoldCalculator, dll
├── composables/  # useSources, usePrices, useHistory, useNews, useComparison
├── lib/          # Helper format (Rupiah, persen, tanggal)
├── views/        # HomeView, SourceDetailView, NewsView
└── router/       # vue-router
```

## Catatan data

- Harga spot dinormalisasi ke per gram dari berat terdekat 1 gram tiap sumber.
- Request perbandingan dikirim bertahap (250ms) karena upstream membatasi burst
  paralel.
- Kolom status stok dan kurs XAU/USD tidak ditampilkan karena API tidak
  menyediakan datanya; hanya kolom dengan data nyata yang dipakai.
- Beberapa sumber bisa gagal sesekali; aplikasi menampilkan error per sumber
  dengan opsi coba lagi, dan halaman tetap berfungsi dari sumber yang sehat.
