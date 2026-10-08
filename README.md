# ⚔️ GLADIATOR AI V4 — DEPLOY READY

V4 mempertahankan UI Gladiator dari V3 dan menambahkan backend AI sungguhan melalui OpenAI Responses API.

## Fitur
- Chat AI sungguhan
- Streaming jawaban
- Riwayat chat, profil, XP, rank, dan tema tetap disimpan di browser
- Backend Node.js + Express
- API key hanya di server/environment variable
- Health check `/api/health`
- Siap deploy ke Render melalui `render.yaml`
- Siap dijalankan dengan Docker melalui `Dockerfile`

## Jalankan lokal

Butuh Node.js 20+.

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu isi:

```env
OPENAI_API_KEY=isi_api_key_anda
OPENAI_MODEL=gpt-6-luna
PORT=3000
```

Jalankan:

```bash
npm start
```

Buka `http://localhost:3000`.

## Deploy tercepat: Render

1. Upload folder ini ke repository GitHub.
2. Di Render, buat Blueprint dari repository tersebut.
3. Render akan membaca `render.yaml`.
4. Masukkan `OPENAI_API_KEY` ketika diminta.
5. Deploy.
6. Buka URL HTTPS hasil deploy dari HP.

Panduan lengkap ada di `DEPLOY_RENDER.md`.

## Docker

```bash
docker build -t gladiator-ai-v4 .
docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY="isi_api_key_anda" \
  -e OPENAI_MODEL="gpt-6-luna" \
  gladiator-ai-v4
```

## Keamanan

Jangan pernah menaruh API key di frontend, GitHub, HTML, atau mengirimkannya ke browser. Gunakan environment variable di server/hosting.

`.env` sudah masuk `.gitignore`.

## Catatan API

V4 memakai Responses API, yang merupakan API yang direkomendasikan OpenAI untuk integrasi baru.
