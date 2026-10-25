# /now Stream

Halaman publik `/now` menampilkan timeline catatan, terbaru berdasarkan tanggal lalu ID. Kategori Maintenance, Release, dan Life menentukan ikon. Proyek dan URL proyek opsional. Konten menggunakan Markdown (paragraf, daftar, tautan, tebal/miring, kode); JSX dan HTML tidak dieksekusi. Draft tidak dapat dibaca pengunjung melalui RLS. RSS khusus tersedia di `/now/rss.xml`.

## Aktivasi database

Jalankan `supabase/migrations/015_now_stream.sql` di SQL Editor proyek Supabase yang sama dengan konfigurasi aplikasi, sesudah migrasi sebelumnya. Migrasi menyalin aktivitas lama dan fokus hidup ke Stream. Tabel lama dan pengaturan Spotify tetap dipertahankan. Migrasi aman dijalankan ulang; penanda internal mencegah impor ulang catatan yang sudah dihapus.

Sebelum migrasi, halaman publik menggunakan data lama dalam tampilan timeline. Admin menampilkan petunjuk migrasi dan menonaktifkan editor Stream, sehingga tidak menyatakan data berhasil disimpan padahal tabel belum tersedia.

## Kelola konten

Buka `/admin/now`, klik **Tambah catatan**, isi judul, kategori, tanggal, dan isi Markdown. Isi proyek/URL bila perlu. Centang **Publikasikan di Stream dan RSS** untuk menampilkannya ke pengunjung; biarkan tidak dicentang untuk draft. Gunakan Edit untuk memperbarui atau mengubah status publikasi. Hapus memerlukan konfirmasi di baris terkait. Pengaturan Spotify berada di bagian Musik / Spotify.

Tanggal menentukan urutan, bukan jadwal otomatis terbit. Catatan yang ditandai publik langsung tampil, termasuk bila tanggalnya di masa depan.

## Verifikasi

- `npm run type-check`
- `node scripts/check-stream-render.mjs`
- `node scripts/check-stream-actions.cjs`
- `npm run build`

Setelah migrasi: pastikan catatan lama muncul di admin, buat draft dan periksa bahwa draft tidak muncul di `/now` atau RSS, publikasikan, edit, lalu periksa permalink. Periksa tampilan pada ukuran mobile dan desktop dalam kedua tema.
