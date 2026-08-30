# Buku Tamu BBMKG — Versi Terpisah

Halaman pengunjung sengaja DIPISAH:
- masuk.html = khusus QR pintu masuk
- keluar.html = khusus QR pintu keluar
- admin.html = khusus petugas/admin

Tidak ada halaman yang menggabungkan tombol Masuk dan Keluar.

Alur:
QR Masuk -> masuk.html -> isi data -> menunggu -> admin konfirmasi -> boleh masuk
QR Keluar -> keluar.html -> masukkan nomor kunjungan -> data keluar tercatat

Ini masih demo frontend. Data menggunakan localStorage browser, belum database/backend.
