# Monolog

Monolog dikelola melalui dashboard admin di `/admin/monolog`. Data episode berada di tabel Supabase `monolog_episodes`; file Voice Memos berada di bucket publik `monolog-audio`.

Halaman publik `/monolog` disajikan sebagai perpustakaan audio dengan pencarian judul/deskripsi/tag, filter kategori berbentuk tab, artwork koleksi, statistik, dan player compact per episode.

## Aktivasi pertama

Jalankan `supabase/migrations/019_monolog.sql` di SQL Editor Supabase. Migrasi tersebut:

- membuat tabel episode dan aturan agar pengunjung hanya bisa membaca episode published;
- membuat bucket publik `monolog-audio` dengan batas 50 MB;
- membatasi upload bucket pada format `.m4a` yang dikenali sebagai audio MP4/M4A.

Tidak ada environment variable atau dependency baru.

## Menambah episode

1. Masuk ke `/admin`, lalu pilih menu `monolog`.
2. Klik **Tambah episode**.
3. Isi judul; slug dibuat otomatis dan masih dapat diedit. Lengkapi deskripsi, kategori, tanggal publikasi, dan tag.
4. Klik **Upload .m4a** lalu pilih hasil ekspor dari iPhone Voice Memos.
5. Progress upload tampil dalam persen. Durasi dibaca otomatis dari metadata audio; jika browser tidak bisa membacanya, isi durasi dalam detik secara manual.
6. Isi transkrip atau refleksi jika tersedia.
7. Simpan sebagai Draft, atau pilih Published jika semua data sudah siap.

Upload memakai signed upload URL yang hanya dapat dibuat oleh admin. File dikirim langsung dari browser ke Supabase Storage sehingga tidak melewati request body server Vercel.

## Perilaku CRUD

- Draft tidak muncul di halaman publik, detail, atau sitemap.
- Episode published dapat disematkan dari tabel admin; episode yang disematkan selalu berada di urutan teratas perpustakaan.
- Archive/restore hanya tersedia untuk admin. Episode arsip tidak muncul di halaman publik, detail, sitemap, atau reaction dan pin dilepas otomatis.
- Maksimal 5 episode published aktif per kategori. Draft tidak dihitung; mengarsipkan atau menjadikan draft sebuah episode akan membuka slot kategori.
- Setiap episode published memiliki empat reaction positif anonim: Suka, Bersulang, Semangat, dan Keren.
- Reaction dibatasi satu per jenis per browser dan dapat dibatalkan dengan mengeklik pilihan yang sama.
- Timeline pemutar berbentuk waveform minimal: bagian yang sudah diputar berubah warna, bergerak halus saat play, berhenti saat pause, dan menghormati pengaturan reduced motion perangkat.
- Draft yang sudah disimpan dapat dipreview lewat tautan rahasia dari halaman edit admin dan diberi instruksi `noindex`.
- Publish dari tabel otomatis mengisi waktu publikasi saat masih kosong.
- Episode tidak dapat dipublish sebelum memiliki audio dan durasi.
- Mengganti audio lalu menyimpan akan menghapus file lama dari bucket.
- Menghapus episode juga menghapus file audio yang tersimpan di bucket.
- Upload yang dibatalkan atau diganti sebelum disimpan dibersihkan otomatis. File yatim yang lebih lama dari 24 jam juga dibersihkan saat admin memulai upload berikutnya.

## Kontrol perpustakaan

Jalankan `supabase/migrations/020_monolog_library_controls.sql` setelah migrasi 019. Migrasi ini menambahkan kolom pin/arsip, memperketat policy publik, mengurutkan episode pinned, dan menerapkan batas lima episode published aktif per kategori melalui trigger database.
- URL HTTPS `.m4a` eksternal tetap dapat dipakai melalui kolom URL audio.

## Kategori

- `menuju-nikah`
- `karier`
- `olahraga`
- `hobi`
- `random`
