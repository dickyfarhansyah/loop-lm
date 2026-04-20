# Wiratek AI - Python Backend

Backend Python equivalent dari JavaScript backend. API identik 100%, menggunakan:

- **FastAPI** – web framework (setara Hono)
- **SQLite + SQLAlchemy** – database (setara Drizzle ORM)
- **ChromaDB embedded** – vector store untuk RAG (**tanpa Docker**)
- **sentence-transformers** – embedding lokal (all-MiniLM-L6-v2)
- **python-jose** – JWT
- **passlib[bcrypt]** – password hashing

## Quickstart

```bash
cd apps/backend-python

# 1. Buat virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Konfigurasi environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 4. Jalankan server
python main.py
```

Server berjalan di http://localhost:8080

## API Endpoints

Semua endpoint identik dengan JavaScript backend:

| Prefix | Deskripsi |
|---|---|
| `GET /health` | Health check |
| `GET /api/v1/setup/status` | Cek setup |
| `POST /api/v1/setup` | Buat admin pertama |
| `POST /api/v1/auths/signup` | Daftar |
| `POST /api/v1/auths/signin` | Login |
| `POST /api/v1/auths/signout` | Logout |
| `GET /api/v1/auths/session` | Get session |
| `GET/PUT /api/v1/users/me` | Profil user |
| `GET /api/v1/chats` | List chat |
| `POST /api/v1/files/parse` | Upload + parse dokumen (RAG) |
| `POST /api/v1/files/search` | Semantic search (RAG) |
| `GET /api/v1/connections` | AI provider connections |
| `POST /api/v1/proxy/chat/completions` | Proxy ke AI provider |
| `GET /docs` | Swagger UI |

## ChromaDB - Embedded Mode (Tanpa Docker)

Default mode adalah **embedded persistent** — ChromaDB berjalan langsung di dalam proses Python, data disimpan di `./data/chroma/`.

```env
# .env
CHROMA_MODE=embedded          # default
CHROMA_PERSIST_DIR=./data/chroma
```

### Gunakan HTTP mode (opsional, jika ingin Docker/server terpisah)

```env
CHROMA_MODE=http
CHROMA_URL=http://localhost:8000
```

## RAG (Retrieval-Augmented Generation)

1. Upload dokumen via `POST /api/v1/files/parse`
   - File di-parse (PDF, DOCX, XLSX, TXT)
   - Teks di-chunk otomatis
   - Chunks di-embed dan disimpan ke ChromaDB

2. Cari dokumen via `POST /api/v1/files/search`
   ```json
   { "query": "pertanyaan kamu", "nResults": 5 }
   ```
   - Embedding query dibuat secara lokal
   - ChromaDB mencari chunks paling relevan (cosine similarity)
   - Mengembalikan top-N hasil

## Struktur

```
apps/backend-python/
├── main.py                    # Entry point
├── requirements.txt
├── .env.example
├── src/
│   ├── config/
│   │   ├── env.py             # Environment variables
│   │   └── database.py        # SQLAlchemy engine + session
│   ├── db/
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   └── migrate.py         # Auto-create tables
│   ├── middleware/
│   │   └── auth.py            # JWT + API key auth
│   ├── routes/api/v1/
│   │   ├── auths.py
│   │   ├── users.py
│   │   ├── chats.py
│   │   ├── files.py           # + RAG endpoints
│   │   ├── folders.py
│   │   ├── prompts.py
│   │   ├── models.py
│   │   ├── model_prompts.py
│   │   ├── tags.py
│   │   ├── connections.py
│   │   ├── settings.py
│   │   ├── notes.py
│   │   ├── proxy.py           # Forward ke AI provider
│   │   └── setup.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── chat_service.py
│   │   ├── file_service.py
│   │   ├── chunking_service.py  # Text chunking untuk RAG
│   │   ├── chroma_service.py    # ChromaDB vector store
│   │   ├── folder_service.py
│   │   ├── prompt_service.py
│   │   ├── model_service.py
│   │   ├── model_prompt_service.py
│   │   ├── tag_service.py
│   │   ├── connection_service.py
│   │   ├── settings_service.py
│   │   ├── note_service.py
│   │   └── proxy_service.py
│   └── utils/
│       ├── errors.py
│       ├── hash.py
│       └── jwt.py
```
