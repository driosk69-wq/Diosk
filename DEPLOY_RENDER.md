# 🚀 Deploy Gladiator AI V4 ke Render

Paket ini sudah menyertakan `render.yaml`, jadi konfigurasi Node.js dan environment variable dasar sudah disiapkan.

## 1. Upload project ke GitHub

Buat repository baru, misalnya `gladiator-ai-v4`, lalu upload seluruh isi folder ini.

Struktur penting:

```text
gladiator_ai_v4/
├── public/
├── server/
├── package.json
├── render.yaml
└── .env.example
```

Jangan upload file `.env` jika nanti kamu membuatnya secara lokal. API key harus tetap menjadi secret.

## 2. Buat Blueprint di Render

Di Render Dashboard pilih opsi untuk membuat Blueprint dan hubungkan repository GitHub yang berisi `render.yaml`.

Render akan membaca:
- runtime: Node.js
- build: `npm install`
- start: `npm start`
- `OPENAI_API_KEY`: diminta sebagai secret
- `OPENAI_MODEL`: default `gpt-6-luna`

## 3. Masukkan API key

Saat diminta, isi `OPENAI_API_KEY` dengan API key milik akun OpenAI API kamu.

**Jangan masukkan API key ke `public/app.js`, HTML, GitHub, atau chat.**

## 4. Deploy

Setelah service selesai build dan deploy, Render akan memberikan alamat HTTPS. Buka alamat tersebut dari HP.

Tes kesehatan server:

```text
https://ALAMAT-RENDER-KAMU/api/health
```

Jika berhasil, akan muncul JSON seperti:

```json
{
  "ok": true,
  "aiConfigured": true,
  "model": "gpt-6-luna"
}
```

## 5. Chat

Buka halaman utama HTTPS Render. UI Gladiator akan muncul dan pesan akan diteruskan ke backend `/api/chat`.

API key tetap berada di server; browser tidak pernah menerima secret tersebut.

## Catatan

Responses API digunakan untuk integrasi AI pada V4. OpenAI saat ini merekomendasikan Responses API untuk integrasi baru.
