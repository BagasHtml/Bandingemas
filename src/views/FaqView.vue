<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-12 sm:gap-16">
    <header class="border-b pb-6">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">FAQ & panduan</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Cara pakai Bandingemas secara singkat, lalu jawaban untuk pertanyaan yang paling sering
        muncul.
      </p>

      <nav aria-label="Isi halaman" class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <a
          href="#mulai"
          class="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >Mulai cepat</a
        >
        <a
          href="#membaca-angka"
          class="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >Membaca angka</a
        >
        <a
          href="#faq"
          class="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >Pertanyaan umum</a
        >
        <a
          href="#sumber"
          class="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >Sumber data</a
        >
      </nav>
    </header>

    <section id="mulai" aria-labelledby="mulai-title" class="scroll-mt-6">
      <h2 id="mulai-title" class="text-lg font-semibold tracking-tight">Mulai cepat</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Tujuh langkah dari melihat harga sampai menyimpan target.
      </p>

      <ol
        class="mt-5 flex list-decimal flex-col gap-5 pl-5 marker:font-semibold marker:text-muted-foreground"
      >
        <li class="pl-1">
          <h3 class="text-sm font-semibold">Baca harga terendah hari ini</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Angka besar di beranda adalah harga per gram dari perantara termurah yang datanya sehat.
            Pilih chip gramasi (0,5 g sampai 100 g) untuk estimasi cepat. Estimasi belum termasuk
            ongkos buat dan pajak.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Lihat tren 30 hari</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Grafik di bawah hero memakai riwayat perantara termurah. Di bawahnya ada angka 30 hari
            terendah, tertinggi, dan perubahan. Grafik muncul setelah sumber punya minimal dua
            tanggal pencatatan.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Bandingkan perantara</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Tabel perbandingan punya tab Emas dan Perak. Baris diurutkan dari harga beli per gram
            termurah. Kolom buyback dan spread membantu melihat biaya saat dijual kembali. Tautan
            "Situs" membuka situs resmi perantara.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Periksa satu perantara</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Klik nama perantara untuk membuka halaman detail. Di sana ada daftar produk dan harga
            saat ini, filter material, serta riwayat 365 hari. Pilih produk untuk mengganti grafik
            riwayat.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Hitung rencana beli atau untung-rugi</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Kalkulator emas punya dua mode. "Simulasi beli" memakai gramasi dan perantara acuan
            untuk menghitung total beli, buyback bersih, dan selisih. "Untung-rugi jual" memakai
            gram milikmu dan total beli atau harga per gram untuk menghitung nilai jual terbaik dan
            posisi untung-rugi.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Simpan target harga</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Buka Pantauan, lalu isi perantara, material, berat, target, dan arah (beli saat turun ke
            target atau jual saat naik ke target). Status dicek dari harga terbaru setiap halaman
            dibuka. Daftar tersimpan di browser, tanpa akun.
          </p>
        </li>

        <li class="pl-1">
          <h3 class="text-sm font-semibold">Ikuti berita dan atur tema</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Halaman Berita merangkum kabar terbaru seputar emas dan pasar logam mulia. Tombol
            matahari atau bulan di header mengganti tema terang dan gelap.
          </p>
        </li>
      </ol>
    </section>

    <section id="membaca-angka" aria-labelledby="angka-title" class="scroll-mt-6">
      <h2 id="angka-title" class="text-lg font-semibold tracking-tight">Membaca angka</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Istilah yang dipakai di tabel dan panel bacaan pasar.
      </p>

      <dl class="mt-5 flex flex-col gap-4">
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Harga per gram</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Harga jual dibagi berat produk. Semua perbandingan memakai satuan ini agar gramasi
            berbeda bisa dibandingkan langsung.
          </dd>
        </div>
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Selisih antar perantara</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Beda harga beli antara perantara termurah dan termahal hari itu. Perbandingan ini
            memakai harga beli ke beli, bukan buyback.
          </dd>
        </div>
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Buyback</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Harga saat perantara membeli kembali produknya. Buyback hanya berlaku di tempat produk
            itu dibeli, bukan di perantara merek lain.
          </dd>
        </div>
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Biaya cair</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Selisih harga beli dan buyback di perantara yang sama, dalam persen. Makin kecil, makin
            murah emas itu saat dijual kembali. Hanya perantara yang memuat buyback yang masuk
            peringkat.
          </dd>
        </div>
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Estimasi pasar</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Median harga per gram dari perantara yang datanya sehat. Median dipakai agar satu
            kutipan ekstrem tidak menggeser angka.
          </dd>
        </div>
        <div class="border-b pb-4 last:border-b-0 last:pb-0">
          <dt class="text-sm font-semibold">Harga per pecahan</dt>
          <dd class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Harga per gram termurah untuk tiap pecahan di semua perantara. Pecahan kecil umumnya
            lebih mahal per gram karena ongkos buat.
          </dd>
        </div>
      </dl>
    </section>

    <section id="faq" aria-labelledby="faq-title" class="scroll-mt-6">
      <h2 id="faq-title" class="text-lg font-semibold tracking-tight">Pertanyaan umum</h2>

      <div class="mt-2 flex flex-col">
        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Dari mana data harga berasal?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Data berasal dari Logam Mulia API, proyek open source oleh iamutaki. Tautan repo dan
            profil ada di bagian Sumber data. Harga di-cache sekitar satu menit agar sumber tidak
            dibebani permintaan berulang.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Apakah harganya real-time?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Bukan. Harga mengikuti waktu pencatatan tiap sumber dan cache singkat di aplikasi.
            Tanggal pembaruan tampil di hero dan halaman perantara. Untuk transaksi, selalu
            konfirmasi ke situs resmi.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kenapa harga antar perantara berbeda?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Produk dan gramasi berbeda, ongkos buat berbeda, dan waktu pencatatan bisa berbeda.
            Karena itu, bandingkan harga beli ke beli. Buyback hanya relevan di tempat produk itu
            dibeli.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kenapa grafik tren belum muncul?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Grafik butuh minimal dua tanggal pencatatan dari perantara termurah. Jika sumber baru
            punya satu hari data, tunggu snapshot berikutnya. Sumber yang gagal dimuat juga tidak
            masuk perhitungan.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kenapa tab Perak kosong?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ketersediaan perak bergantung pada sumber. Tab Perak menampilkan pesan belum ada data
            selama belum ada sumber aktif yang mengirim harga perak terkini. Coba lagi beberapa saat
            lagi.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kenapa ada perantara yang tidak muncul?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sumber bisa gagal dimuat sementara. Jumlah sumber yang gagal tampil di keterangan tabel
            perbandingan. Gunakan tombol "Coba lagi" atau muat ulang halaman beberapa saat lagi.
          </p>
        </details>

        <details class="border-b py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Apakah daftar pantauan saya hilang?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pantauan disimpan di localStorage browser. Data bisa hilang jika penyimpanan situs
            dibersihkan, memakai mode privat, atau berganti perangkat. Tidak ada akun dan tidak ada
            sinkronisasi antar perangkat.
          </p>
        </details>

        <details class="py-4">
          <summary
            class="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Apakah angka di sini bisa dipakai sebagai patokan transaksi?
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Angka di sini bersifat informasi, bukan ajakan investasi. Harga akhir bisa berbeda
            karena pajak, ongkos buat, promo, dan kebijakan masing-masing perantara.
          </p>
        </details>
      </div>
    </section>

    <section id="sumber" aria-labelledby="sumber-title" class="scroll-mt-6">
      <h2 id="sumber-title" class="text-lg font-semibold tracking-tight">Sumber data</h2>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        Data harga disediakan oleh
        <a
          href="https://github.com/iamutaki/logam-mulia-api"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-foreground underline-offset-4 hover:underline"
          >Logam Mulia API</a
        >, proyek open source oleh
        <a
          href="https://github.com/iamutaki"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-foreground underline-offset-4 hover:underline"
          >@iamutaki</a
        >.
      </p>
    </section>

    <div>
      <Button as-child class="h-11 px-5">
        <RouterLink to="/">Lihat harga hari ini</RouterLink>
      </Button>
    </div>
  </div>
</template>
