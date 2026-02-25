# 🚀 PANDUAN DEPLOY - operasional.gstransport.id
## Tanggal: 25 Februari 2026

---

## 📁 Struktur Target di Server

```
public_html/
└── operasional.gstransport.id/
    ├── .htaccess              ← BARU (dari React/dist/.htaccess)
    ├── index.html             ← dari React/dist/
    ├── status.html            ← dari React/dist/
    ├── assets/                ← dari React/dist/assets/
    │   ├── index-GLm2KfqE.js
    │   └── index-t75WJoPJ.css
    ├── documents/             ← dari React/dist/documents/
    ├── templates/             ← dari React/dist/templates/
    └── Laravel/               ← folder Laravel (upload seluruhnya)
        ├── .env               ← GANTI dengan .env.production
        ├── app/
        ├── config/
        ├── public/
        │   ├── .htaccess
        │   ├── index.php
        │   ├── uploads/
        │   └── storage/       ← symlink (dibuat via Terminal)
        ├── storage/
        ├── vendor/
        └── ...
```

---

## 📋 LANGKAH-LANGKAH DEPLOY

### LANGKAH 1: Siapkan Database di cPanel

1. Login ke cPanel: `https://dieng.iixcp.rumahweb.net:2083/`
2. Buka **MySQL Databases**
3. **Buat database baru**, misalnya: `umkm_db`
4. **Buat user MySQL baru** dengan password kuat
5. **Assign user ke database** dengan pilih ALL PRIVILEGES
6. **Catat:**
   - Nama database: `cpanelusername_umkm_db`
   - Username: `cpanelusername_user`
   - Password: (yang kamu buat)

> ⚠️ Di Rumah Web, nama DB dan user otomatis ditambah prefix username cPanel!

---

### LANGKAH 2: Import Database

1. Di cPanel, buka **phpMyAdmin**
2. Pilih database yang baru dibuat
3. Klik tab **Import**
4. Upload file SQL dari project lokal (ekspor dulu dari phpMyAdmin lokal)
5. Klik **Go**

---

### LANGKAH 3: Upload React (Frontend)

Upload **semua isi folder** `React/dist/` ke `public_html/operasional.gstransport.id/`:

File yang diupload:
- ✅ `.htaccess` (PENTING! file ini hidden, pastikan ikut terupload)
- ✅ `index.html`
- ✅ `status.html`
- ✅ folder `assets/`
- ✅ folder `documents/`
- ✅ folder `templates/`

**Cara upload via File Manager cPanel:**
1. Buka **File Manager** di cPanel
2. Navigasi ke `public_html/operasional.gstransport.id/`
3. Klik **Upload** → upload semua file
4. Atau: Zip dulu isinya → upload zip → Extract di sana

---

### LANGKAH 4: Upload Laravel (Backend)

Upload seluruh folder `Laravel/` ke dalam `public_html/operasional.gstransport.id/Laravel/`:

> ⚠️ Jangan upload folder `node_modules/` (tidak ada di Laravel, tapi jaga-jaga)

**Yang WAJIB ada:**
- `app/`
- `bootstrap/`
- `config/`
- `database/`
- `public/`
- `resources/`
- `routes/`
- `storage/`
- `vendor/` ← ⚠️ WAJIB ada! Jika tidak ada, jalankan `composer install` di server
- `artisan`
- `composer.json`
- `composer.lock`

---

### LANGKAH 5: Edit .env Laravel di Server

1. Di File Manager, navigasi ke `public_html/operasional.gstransport.id/Laravel/`
2. Klik kanan `.env` → **Edit**
3. Update isi dengan (ganti DB credentials):

```
APP_NAME="UMKM Digital"
APP_ENV=production
APP_KEY=base64:f2lwoi7cCOb9srctJtpVrBsTf3lmbL+zu0qlJceOaao=
APP_DEBUG=false
APP_URL=https://operasional.gstransport.id

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=NAMADB_DARI_CPANEL
DB_USERNAME=USERNAME_DARI_CPANEL
DB_PASSWORD=PASSWORD_DARI_CPANEL

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

---

### LANGKAH 6: Jalankan Artisan Commands

Di cPanel, buka **Terminal** (atau gunakan SSH):

```bash
# Masuk ke folder Laravel
cd public_html/operasional.gstransport.id/Laravel

# Clear semua cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Generate APP_KEY baru (OPSIONAL - jika belum ada)
# php artisan key:generate

# Buat storage link (untuk akses file upload)
php artisan storage:link

# Set permission folder storage
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
```

---

### LANGKAH 7: Set Permission File

Di cPanel Terminal atau SSH:
```bash
cd public_html/operasional.gstransport.id/Laravel
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

---

### LANGKAH 8: Test

1. Buka `https://operasional.gstransport.id` → harus muncul React app
2. Buka `https://operasional.gstransport.id/api/` → harus ada response JSON dari Laravel
3. Coba login di React app

---

## ⚠️ TROUBLESHOOTING

### Error 500 di API
- Cek `.env` Laravel sudah benar
- Jalankan `php artisan config:clear`
- Cek `storage/logs/laravel.log` untuk detail error

### CORS Error di Browser
- Pastikan `config/cors.php` sudah ter-upload dengan benar
- Jalankan `php artisan config:clear`

### Gambar tidak muncul
- Pastikan `php artisan storage:link` sudah dijalankan
- Cek apakah symlink `public/storage` → `storage/app/public` sudah ada

### React routing 404
- Pastikan `.htaccess` di root sudah ter-upload (file hidden!)
- Di File Manager, aktifkan "Show Hidden Files"

---

## 📞 Checklist Final

- [ ] Database dibuat & data diimport
- [ ] React dist/ ter-upload ke root
- [ ] `.htaccess` root ter-upload (cek via "Show Hidden Files")
- [ ] Laravel ter-upload ke subfolder `Laravel/`
- [ ] `.env` Laravel di server sudah diedit (DB credentials production)
- [ ] `php artisan config:clear` sudah dijalankan
- [ ] `php artisan storage:link` sudah dijalankan
- [ ] Permission storage sudah 775
- [ ] Test buka website ✅
