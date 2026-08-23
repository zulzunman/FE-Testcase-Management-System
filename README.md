# FE — Test Case Management System (Frontend)

Frontend web untuk aplikasi **QA Test Case Management** — antarmuka pengguna untuk mengelola
test case, mengeksekusi, dan melihat laporan hasil testing. Dibangun dengan React + Vite + TypeScript + Tailwind CSS.

## Tech Stack

- React 19
- Vite 8
- TypeScript 6 (strict, `verbatimModuleSyntax`)
- Tailwind CSS v4
- React Router 7
- Axios (dengan interceptor auto-refresh JWT)

## Struktur Folder

```
frontend/src/
├── api/          # axios client + fungsi per resource (client.ts, projects.ts)
├── context/      # AuthContext (login/logout/state user)
├── components/   # Layout, ProtectedRoute
└── pages/        # Login, Dashboard, Project List, Project Detail
```

## Cara Build & Menjalankan

### Prasyarat

- Node.js 24+ (npm)
- Backend API berjalan (lihat repo BE-Testcase-Management-System) di `http://localhost:8000`

### 1. Clone & masuk folder

```bash
git clone https://github.com/zulzunman/FE-Testcase-Management-System.git
cd FE-Testcase-Management-System
```

### 2. Install dependency

```bash
npm install
```

> **Windows**: jika environment global kamu menyetel `NODE_ENV=production`, npm akan
> melewatkan devDependencies (typescript, vite). Set dulu sebelum install/build:
> ```powershell
> $env:NODE_ENV = 'development'
> ```

### 3. Konfigurasi environment (opsional)

Salin `.env.example` ke `.env` jika perlu mengubah URL API:

```bash
cp .env.example .env   # Linux/macOS
Copy-Item .env.example .env   # Windows PowerShell
```

```env
VITE_API_URL=http://localhost:8000/api
```

Jika tidak diset, axios memakai base URL yang sama (via proxy Vite ke `localhost:8000`).

### 4. Menjalankan dev server

```bash
npm run dev
# Aplikasi: http://localhost:5173  (proxy /api -> http://localhost:8000)
```

### 5. Build produksi

```bash
npm run build
# Hasil build di folder dist/
```

### 6. Preview hasil build

```bash
npm run preview
```

## Halaman yang Tersedia (Fase 0–1)

- `/login` — login dengan email & password (JWT)
- `/` — Dashboard (statistik project/module/feature)
- `/projects` — daftar & buat project
- `/projects/:id` — detail project, CRUD module & feature

Akses tulis dibatasi per role: Admin & QA Lead dapat membuat/mengubah; Developer & Product Manager read-only.

## Status Pengerjaan

Fase 0–1 selesai (foundation UI, auth, project/module/feature). Lihat dokumentasi internal untuk detail progres.
