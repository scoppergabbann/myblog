# Monolog

Monolog memakai file konten lokal di `content/monolog/episodes.ts`. Hanya entri dengan `status: 'published'` yang tampil di `/monolog`, halaman detail, dan sitemap.

## Menambah episode

1. Ekspor rekaman Voice Memos sebagai `.m4a`.
2. Ubah nama file menjadi slug yang sederhana, misalnya `belajar-mendengar.m4a`.
3. Taruh file di `public/audio/monolog/`. URL kontennya menjadi `/audio/monolog/belajar-mendengar.m4a`.
4. Salin entri contoh di `content/monolog/episodes.ts`, lalu isi semua metadata.
5. Biarkan `status: 'draft'` selama menyiapkan konten. Ubah menjadi `published` setelah audio, tanggal, dan durasi sudah benar.
6. Jalankan `npm run check:monolog`, `npm run type-check`, dan `npm run build` sebelum deploy.

Contoh entri siap terbit:

```ts
{
  id: 'monolog-001',
  slug: 'belajar-mendengar',
  title: 'Belajar Mendengar',
  description: 'Catatan singkat tentang mendengar sebelum menjawab.',
  category: 'karier',
  audioUrl: '/audio/monolog/belajar-mendengar.m4a',
  durationSeconds: 312,
  publishedAt: '2026-11-15T08:00:00+07:00',
  status: 'published',
  transcript: null,
  reflection: null,
  tags: ['komunikasi'],
}
```

Kategori yang tersedia: `menuju-nikah`, `karier`, `olahraga`, `hobi`, dan `random`.

## Hosting audio

File lokal di `public/audio/monolog/` ikut ter-deploy bersama website dan cocok untuk MVP. Model konten juga menerima URL HTTPS langsung yang berakhir dengan `.m4a`, sehingga file dapat dipindahkan ke penyimpanan publik seperti Supabase Storage atau CDN tanpa mengubah komponen pemutar.

Untuk file yang besar atau trafik yang meningkat, gunakan bucket publik/CDN agar ukuran deployment tetap kecil. Pastikan server audio mendukung byte-range request dan mengirim content type `audio/mp4` supaya seeking bekerja baik di Mobile Safari.

## Catatan konten

- `transcript`, `reflection`, dan `tags` bersifat opsional.
- Bagian kosong tidak dirender.
- Slug dan id harus unik.
- Episode published wajib memiliki URL `.m4a`, tanggal publikasi valid, dan durasi lebih dari nol.
- Entri `development-example` adalah draft dokumentasi dan tidak muncul di website publik.
