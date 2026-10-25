# Form Library per jenis

Library kini memiliki form Buku, Mobil, Motor, Catatan, Minuman, dan Koleksi lainnya. Pilih jenis bawaan saat membuat atau mengedit kategori. Jenis dapat diganti untuk tiap item; metadata item yang telah disimpan tidak bergantung pada perubahan nama kategori.

## Aktivasi

Jalankan `supabase/migrations/016_library_item_details.sql` di Supabase SQL Editor proyek aplikasi. Migrasi menambahkan `item_type` pada kategori dan item, serta objek JSONB `details` pada item. Kolom lama, foto, dan hubungan kategori tetap dipertahankan. Jenis kategori lama diisi berdasarkan nama; jenis tiap item lama tidak dipaksakan dan dapat dikonfirmasi saat edit.

Sebelum migrasi, data lama tetap dapat ditampilkan. Penyimpanan dengan form baru akan gagal dengan petunjuk migrasi; aplikasi tidak membuang metadata baru atau melaporkan sukses palsu.

## Isi form

- Buku: hanya judul wajib; penulis opsional; penerbit, tahun terbit, ISBN, halaman, bahasa, genre, tanggal selesai baca, penilaian, status membaca, kesan, serta catatan/kutipan tersedia.
- Mobil dan motor: hanya nama wajib; merek dan model opsional; tahun produksi, kapasitas mesin, transmisi, bahan bakar, warna, status kepemilikan/keinginan, pengalaman, dan catatan perawatan tersedia.
- Catatan: hanya judul wajib; isi opsional; topik, tanggal, sumber, dan tautan referensi tersedia.
- Minuman: merek/kedai, jenis, asal, penyajian, kesan rasa, dan catatan penyajian tersedia.
- Koleksi lainnya: judul, cerita, dan label opsional untuk kebutuhan bebas.

Pengaturan tambahan menampung subtitle manual, Reels untuk jenis yang relevan, dan urutan tampil. Subtitle kartu dihasilkan dari metadata jika subtitle manual kosong. Subtitle lama dipertahankan karena tidak aman memecah teks bebas menjadi penulis, tahun, atau model secara otomatis.

Detail dan catatan yang disimpan tampil di detail library publik. Catatan ini bukan jurnal privat. UI memberi keterangan ini di bagian cerita pribadi.

## Verifikasi

`npm run type-check` dan `node scripts/check-library-details.cjs` memeriksa jenis form, validasi, pemisahan metadata, render publik, kompatibilitas data lama, otorisasi, serta error migrasi. Setelah migrasi, uji tambah/edit buku dan kendaraan serta simpan foto melalui admin yang sudah login.

Semua detail, kesan, isi catatan, dan catatan tambahan bersifat opsional. Isian kosong tidak disimpan sebagai metadata dan tidak menghasilkan label atau bagian kosong pada detail publik. Nama/judul tetap diperlukan untuk mengidentifikasi item.
