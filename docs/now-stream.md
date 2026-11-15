# /now Stream

Halaman publik `/now` menampilkan timeline catatan, terbaru berdasarkan tanggal lalu ID. Kategori Maintenance, Release, dan Life menentukan ikon. Proyek dan URL proyek opsional. Konten menggunakan Markdown (paragraf, daftar, tautan, tebal/miring, kode); JSX dan HTML tidak dieksekusi. Draft tidak dapat dibaca pengunjung melalui RLS. RSS khusus tersedia di `/now/rss.xml`.

## Aktivasi database

Jalankan `supabase/migrations/015_now_stream.sql` di SQL Editor proyek Supabase yang sama dengan konfigurasi aplikasi, sesudah migrasi sebelumnya. Migrasi menyalin aktivitas lama dan fokus hidup ke Stream. Tabel lama dan pengaturan Spotify tetap dipertahankan. Migrasi aman dijalankan ulang; penanda internal mencegah impor ulang catatan yang sudah dihapus.

Sebelum migrasi, halaman publik menggunakan data lama dalam tampilan timeline. Admin menampilkan petunjuk migrasi dan menonaktifkan editor Stream, sehingga tidak menyatakan data berhasil disimpan padahal tabel belum tersedia.

## Kelola konten

Admin yang sudah login dapat mengelola catatan langsung di `/now`. Klik tombol bulat **+** di kanan bawah untuk membuka composer, pilih Jogging, Tenis, Ngafe, Wisata, Riding, atau Lainnya, lalu isi cerita dan klik **Posting aktivitas**. Judul awal mengikuti pilihan aktivitas dan dapat diubah. Aktivitas baru langsung dipublikasikan; tanggal awal memakai zona waktu Asia/Jakarta. Pilihan aktivitas memakai kategori `life` dan konteks/proyek yang sudah tersedia (misalnya `Olahraga · Jogging`), sehingga tidak membutuhkan migrasi baru setelah migrasi 015.

Tombol **Edit** dan **Hapus** tampil pada masing-masing catatan untuk admin, dengan konfirmasi sebelum menghapus. Form mempertahankan isian jika penyimpanan gagal dan meminta konfirmasi ketika perubahan yang belum tersimpan ditutup. Pengunjung biasa hanya melihat timeline publik. Halaman bersifat dinamis agar kontrol admin tidak masuk cache halaman publik; semua mutasi tetap memeriksa sesi admin di server. Draft tetap dikelola melalui dashboard.

Buka `/admin/now`, klik **Tambah catatan**, isi judul, kategori, tanggal, dan isi Markdown. Isi proyek/URL bila perlu. Centang **Publikasikan di Stream dan RSS** untuk menampilkannya ke pengunjung; biarkan tidak dicentang untuk draft. Gunakan Edit untuk memperbarui atau mengubah status publikasi. Hapus memerlukan konfirmasi di baris terkait. Pengaturan Spotify berada di bagian Musik / Spotify.

Tanggal menentukan urutan, bukan jadwal otomatis terbit. Catatan yang ditandai publik langsung tampil, termasuk bila tanggalnya di masa depan.

## Verifikasi

### Reaksi positif dari pengunjung

Setiap catatan publik di `/now` memiliki empat tombol berupa ikon dan angka: hati, dua botol bersulang, api, dan tepuk tangan. Tidak ada tulisan Love, termasuk pada tooltip dan label aksesibilitas. Pengunjung dapat memilih lebih dari satu jenis, tanpa login. Klik menambah reaksi; klik lagi membatalkan jenis itu saja. Ikon bergoyang dan emoji kecil melayang saat dipilih, dengan dukungan reduced motion.

Reaksi memakai tabel `reactions` yang sudah ada. Hati mempertahankan pasangan slug `/now#update-ID` / emoji `love` agar data lama tetap tampil. Api memakai slug yang sama dan emoji `fire`. Bersulang dan tepuk tangan memakai suffix slug `:cheers` dan `:clap`, masing-masing memakai nilai vote positif `love` yang sudah didukung enum database. Jenis baru tetap terpisah dari hati dan artikel, tanpa migrasi baru.

Identitas anonim disimpan dalam cookie HttpOnly selama setahun dan di-hash sebelum disimpan. Satu browser dapat memberi satu reaksi per jenis per catatan; browser berbeda dalam jaringan yang sama dihitung terpisah. Pembatasan 60 perubahan per jam per hash IP memakai rate limiter dalam memori aplikasi. Server hanya menerima empat jenis positif pada catatan yang masih dipublikasikan, memakai mutasi idempotent dan count exact. Data identitas tidak dikirim ke komponen klien. Verifikasi: `node scripts/check-stream-reactions.cjs`.

### Foto dokumentasi

Jalankan `supabase/migrations/018_stream_photos.sql` di SQL Editor Supabase untuk menambahkan kolom `photos` dan batas maksimum tiga lampiran per catatan. Aktifkan bucket gambar publik yang sama dengan upload blog (`NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, default `bbs-images`). Entri tanpa foto tetap terbaca sebelum migrasi; penyimpanan lampiran menampilkan pesan migrasi jika kolom belum tersedia.

Composer `/now` dan editor `/admin/now` mendukung maksimal tiga foto JPG, PNG, atau WebP, masing-masing maksimal 3 MB. Pilih beberapa foto sekaligus, tambahkan keterangan opsional, atau hapus foto untuk menggantinya. Simpan dan tutup dinonaktifkan selama upload. Keterangan menjadi caption dan teks alternatif gambar. Galeri publik memuat gambar secara lazy dan tautannya membuka foto asli di tab baru. RSS menyertakan foto dengan HTML yang di-escape.

Server memeriksa sesi admin, ukuran, MIME, dan signature file sebelum upload. Server memeriksa jumlah dan struktur foto lagi saat menyimpan, dan constraint database membatasi tiga foto. Upload dilakukan satu per satu dengan batas request Server Action 4 MB untuk mengakomodasi satu file 3 MB beserta multipart overhead. Editor lama yang tidak mengirim properti `photos` tidak menghapus lampiran yang sudah tersimpan.

Menghapus lampiran hanya melepasnya dari catatan setelah Simpan; objek di bucket tidak dihapus otomatis, untuk mempertahankan URL yang mungkin masih digunakan konten lain. File yang sudah diunggah tetapi form-nya dibatalkan juga tetap berada di bucket. Bucket publik berarti URL upload dapat diakses sebelum catatan dipublikasikan, sesuai mekanisme upload blog yang sudah ada.

Uji tambahan: `node scripts/check-stream-photos.cjs` (batas jumlah/ukuran/format, otorisasi upload, signature, galeri, dan escaping RSS).

- `npm run type-check`
- `node scripts/check-stream-render.mjs`
- `node scripts/check-stream-actions.cjs`
- `npm run build`

Setelah migrasi: pastikan catatan lama muncul di admin, buat draft dan periksa bahwa draft tidak muncul di `/now` atau RSS, publikasikan, edit, lalu periksa permalink. Periksa tampilan pada ukuran mobile dan desktop dalam kedua tema.
