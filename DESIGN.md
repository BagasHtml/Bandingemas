web application/stitch/projects/8644483373554369489/screens/2a145c640d2c4c13a7e12e1ea9562938
# Design System & Documentation: Logam Mulia Hub

Dokumentasi sistem desain, panduan gaya visual, token desain, dan spesifikasi antarmuka untuk portal pemantau dan komparasi harga emas komoditas **Logam Mulia Hub**.

---

## 1. Brand Identity & Filosofi Desain

### 1.1 Visi Produk
Portal finansial komoditas emas terpercaya, cepat, dan transparan di Indonesia. Menjembatani investor ritel dengan data pasar riil (Antam, Pegadaian, BSI, Treasury, Laku Emas, dll.) dengan antarmuka yang bersih, fungsional, dan bebas dari *gimmick* visual berlebihan.

### 1.2 Prinsip Desain
1. **Financial Clarity & Trustworthiness**: Data harga, pecahan gramasi, dan spread komisi harus jelas terbaca tanpa ambiguitas.
2. **Lightweight & High-Performance**: Menghindari beban animasi berlebih (*zero-bloat*). Setiap interaksi dan transisi menggunakan native CSS/JS ringan.
3. **Refined Luxury (Bukan Artificial Slop)**: Sentuhan warna emas (*amber/gold*) digunakan secara taktis sebagai aksen nilai komoditas, diimbangi oleh monokrom netral gelap dan abu-abu arsitektural.

---

## 2. Color Palette & Design Tokens

### 2.1 Primary & Accent (Gold / Komoditas)
* **Gold Primary**: `#B48518` / `#C89922` — Digunakan untuk penekanan nilai harga utama, logo highlight, dan indikator aktif.
* **Gold Light Surface**: `#FDF9EE` — Digunakan sebagai background pill aktif, highlight baris, dan badge seleksi gramasi.
* **Gold Border**: `#F1E3B8` / `#E5D399` — Batas halus pada elemen bernuansa emas.

### 2.2 Neutrals (Clean Slate)
* **Canvas Background**: `#F8F9FA` / `#FFFFFF` — Latar belakang utama halaman dan kartu data.
* **Surface Card**: `#FFFFFF` — Kartu komponen dan tabel perantara.
* **Surface Border**: `#E5E7EB` / `#E2E8F0` — Garis pemisah tabel, border input, dan kartu perantara.
* **Dark Contrast Surface**: `#111315` / `#1A1D20` — Digunakan pada *Live Feeds Marquee bar* dan kontainer *Kalkulator Simulasi*.

### 2.3 Typography & Neutral Grayscale
* **Text Main (Heading & Primary Data)**: `#111827` (Gray 900)
* **Text Secondary**: `#4B5563` (Gray 600)
* **Text Muted / Caption**: `#9CA3AF` (Gray 400)
* **Text on Dark Surface**: `#F9FAFB` (Gray 50)

### 2.4 Semantic & Feedback
* **Positive / Naik / Ready**: `#10B981` (Emerald 500) | Background: `#ECFDF5`
* **Negative / Turun**: `#EF4444` (Red 500) | Background: `#FEF2F2`
* **Warning / PPh Note**: `#D97706` (Amber 600) | Background: `#FFFBEB`

---

## 3. Typography Hierarchy

Font Family: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`. Font tabular numbers (`font-variant-numeric: tabular-nums`) wajib digunakan pada seluruh representasi numerik dan harga rupiah.

| Peruntukan | Ukuran (Size) | Bobot (Weight) | Tracking / Leading |
|---|---|---|---|
| **Main Price Display** | `44px - 52px` | Extra Bold (800) | `-0.03em`, line-height `1.1` |
| **Section Title (H2)** | `24px - 28px` | Bold (700) | `-0.02em`, line-height `1.3` |
| **Card Header / Metric Title** | `13px - 14px` | SemiBold (600) | `+0.05em` (Caps / Sub-header) |
| **Table Body & Data** | `14px - 15px` | Medium (500) / Regular (400) | Normal, `tabular-nums` |
| **Ticker / Badge / Chip** | `11px - 12px` | SemiBold (600) | `+0.03em` |
| **Disclaimers & Footnote** | `11px - 12px` | Regular (400) | Normal |

---

## 4. Layout & Grid Architecture

* **Container Max Width**: `1280px` (`max-w-7xl`), terpusat horizontal (`mx-auto`).
* **Desktop Padding**: `px-6` atau `px-8` pada kontainer induk.
* **Vertical Rhythm / Spacing**:
  * Jarak antar seksi utama: `48px - 64px` (`my-12` sampai `my-16`).
  * Jarak internal kartu (Padding): `24px - 32px` (`p-6` sampai `p-8`).
* **Border Radius**:
  * Cards & Containers: `rounded-2xl` (`16px`)
  * Buttons & Gram Chips: `rounded-xl` (`10px` - `12px`)
  * Badges & Status Pills: `rounded-full` (`9999px`)

---

## 5. Komponen Utama (UI Components)

### 5.1 Live Ticker Marquee Bar
* **Posisi**: Fixed / Sticky bar paling atas.
* **Warna**: Latar `#111315`, teks monokrom dan hijau/merah indikator pasar dunia (XAU/USD, Kurs IDR, Spot Antam).
* **Fungsi**: Memberikan informasi detak pasar riil sebelum pengguna masuk ke kartu utama.

### 5.2 Hero Price Card & Gram Selector
* Menampilkan harga referensi terendah hari ini (*Rp 2.430.000 / 1 gram*).
* Dilengkapi *Interactive Chips* pecahan gram (0.5g, 1g, 2g, 5g, 10g, 25g, 50g, 100g).
* Perhitungan *Spread* dan histori rentang 30 hari ditampilkan secara padat (*compact metrics*).
* Chart mini 7 hari dengan efek visual sparkline dan gradien emas tipis.

### 5.3 Perbandingan Antar Perantara (Comparison Table)
* Menampilkan daftar perantara resmi: Pegadaian, Antam Logam Mulia, Laku Emas, Bank BSI, Brankas LM, Treasury.
* Fitur filter kategori: `Semua`, `Batangan Fisik`, `Tabungan Digital`.
* Kolom terstruktur: Logo/Inisial perantara, Jenis Produk, Harga Beli/gr, Buyback/gr, Spread (Rp & %), Status ketersediaan (*Ready*, *Tersedia*, *BSI Mobile*), dan CTA eksternal (*Kunjungi Situs*).

### 5.4 Indeks Perantara (Directory Grid)
* Grid responsif 3 kolom (`grid-cols-1 md:grid-cols-3 gap-4`).
* Menghubungkan pengguna langsung ke portal resmi penyedia data.

### 5.5 Kalkulator Simulasi Emas (Dark Focus Component)
* Kontainer gelap kontras tinggi untuk menarik fokus interaksi kalkulasi.
* Input gramasi dinamis + *Dropdown Selector* acuan harga perantara.
* Menampilkan kalkulasi instan untuk:
  * **Estimasi Total Beli** (Gram × Harga Beli)
  * **Proyeksi Nilai Buyback Bersih** (Gram × Harga Buyback)

---

## 6. Motion & Micro-interactions Guide

1. **Prinsip**: *Purposeful & Snappy* (150ms - 250ms). Tidak ada elemen berputar atau transisi lambat yang menghambat pembacaan data finansial.
2. **Pill Selector Hover & Active**:
   - `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
   - Active state menambahkan border emas dan warna latar hangat.
3. **Table Row Hover**:
   - Background transisi halus ke `#F9FAFB` dengan indikator tombol aksi yang lebih kontras.
4. **Accessibility (`prefers-reduced-motion`)**:
   - Semua animasi dinonaktifkan secara anggun bagi pengguna dengan pengaturan aksesibilitas khusus.
