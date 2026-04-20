# Wiratek AI

Full-stack AI Chat Application — monorepo dengan Python backend dan React frontend.

## Struktur

```
wiratek-ai/
├── apps/
│   ├── backend-python/   # FastAPI + SQLAlchemy + SQLite + ChromaDB (RAG)
│   ├── backend/          # (legacy) Hono + Drizzle + SQLite
│   └── frontend/         # React + Vite + TailwindCSS
├── packages/
│   └── shared/           # Shared types (TypeScript)
├── Makefile              # Semua perintah tersedia di sini
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Requirements

| Tool | Versi minimum |
|---|---|
| Node.js | 18+ |
| pnpm | 8+ |
| Python | 3.9+ |

## Quick Start (Fresh Clone)

Cukup satu perintah — `make dev` atau `make prod` akan otomatis:
1. Install Node dependencies (`pnpm install`)
2. Buat Python virtual environment (`.venv`)
3. Install Python dependencies dari `requirements.txt`
4. Copy `.env` dari `.env.example` jika belum ada

```bash
# Clone repo
git clone <repo-url>
cd wiratek-ai

# Jalankan mode development (hot-reload)
make dev

# Atau jalankan mode production (build dulu lalu preview)
make prod
```

## Ports

| Service | URL |
|---|---|
| Backend API | http://localhost:8080 |
| Frontend (dev) | http://localhost:5173 |
| Frontend (prod preview) | http://localhost:4173 |
| API Docs (Swagger) | http://localhost:8080/docs |

## Konfigurasi Environment

File `.env` backend ada di `apps/backend-python/.env`. Otomatis di-copy dari `.env.example` saat pertama kali `make dev/prod` dijalankan.

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=./data/webui.db
JWT_SECRET=change-this-secret-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
WEBUI_NAME=Wiratek AI

# ChromaDB — embedded (default, tanpa Docker) atau HTTP
CHROMA_MODE=embedded
CHROMA_PERSIST_DIR=./data/chroma
# CHROMA_URL=http://localhost:8000

CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Perintah Make

```bash
make setup   # Install semua dependencies (tanpa menjalankan server)
make dev     # Setup + jalankan backend & frontend dalam mode development
make prod    # Setup + build frontend + jalankan dalam mode production
```

### Docker

```bash
make build          # Build semua Docker image
make start          # Jalankan semua container
make stop           # Stop semua container
make restart        # Restart semua container
make logs           # Lihat semua log
make logs-backend   # Log backend saja
make logs-frontend  # Log frontend saja
```

### Shell & Cleanup

```bash
make shell-backend    # Shell ke container backend
make shell-frontend   # Shell ke container frontend
make clean            # Stop container + hapus volume
make prune            # Hapus Docker resource tidak terpakai
```

## Tech Stack

### Backend (Python)
- **FastAPI** — Web framework
- **SQLAlchemy** + **aiosqlite** — Database ORM (SQLite)
- **ChromaDB** — Vector store untuk RAG (embedded, tanpa Docker)
- **sentence-transformers** — Local embedding model
- **python-jose** + **passlib** — JWT Authentication
- **uvicorn** — ASGI server
- **PyMuPDF**, **python-docx**, **openpyxl** — Document parsing

### Frontend
- **React 19** + **TypeScript**
- **Vite** — Build tool & dev server
- **TailwindCSS v4**
- **TanStack Query** — Server state management
- **React Router v7**
- **shadcn/ui** — UI components
- **i18next** — Internasionalisasi
