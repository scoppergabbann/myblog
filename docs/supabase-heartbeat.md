# Supabase Heartbeat

Vercel memanggil `/api/cron/supabase-heartbeat` setiap hari dengan jadwal
02.00 UTC (09.00 WIB). Pada paket Hobby, waktu eksekusi dapat bergeser dalam
jam tersebut. Cron berjalan pada deployment production, bukan localhost/preview.

## Aktivasi

1. Jalankan `supabase/migrations/014_database_heartbeat.sql` di SQL Editor project
   Supabase yang digunakan website, atau melalui workflow migrasi yang tersedia.
2. Buat secret acak dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Di environment variables project Vercel, tambahkan `CRON_SECRET` untuk Production.
   Jangan memakai prefix `NEXT_PUBLIC_`, memasukkan secret ke Git, atau menggunakan password admin.
4. Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` Production
   menunjuk ke project yang sama. Deploy perubahan ini ke production.
5. Jalankan cron secara manual dari pengaturan Cron Jobs di Vercel. Periksa logs
   untuk respons 200 dan nilai `last_seen_at` pada tabel `database_heartbeat`.

Vercel otomatis mengirim `Authorization: Bearer <CRON_SECRET>`.
Membuka URL langsung tanpa header akan menghasilkan 401, bukan menjalankan heartbeat.
Secret belum diatur menghasilkan 503. Kegagalan database/timeout menghasilkan 503;
Vercel tidak otomatis mencoba ulang cron yang gagal, jadi periksa log kegagalan.

## Batasan

Heartbeat meng-upsert satu baris dengan ID 1. Tidak menambah konten blog,
mengubah tanggal pembaruan halaman, atau menumpuk riwayat. Tabel menggunakan RLS
dan hanya service role yang memperoleh akses. Endpoint tidak mengembalikan isi
database atau detail kredensial. Permintaan database dibatasi 10 detik.

Ini aktivitas database berkala, bukan backup, pemulihan otomatis, atau jaminan
anti-pause. Supabase dapat menjeda project Free dengan aktivitas rendah selama
periode tujuh hari. Jika sudah paused, restore melalui dashboard terlebih dahulu.
Paket berbayar tidak terkena automatic pausing karena inactivity.

Referensi:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://vercel.com/docs/cron-jobs/usage-and-pricing
