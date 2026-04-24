.PHONY: help dev prod setup build start stop restart logs logs-backend logs-frontend shell-backend shell-frontend db-push db-studio db-clear db-reset db-reset-python db-users db-update-email clean prune build-python start-python stop-python restart-python logs-python shell-python nginx-setup nginx-reload

# Auto-detect uv, allow override with USE_UV=0
UV := $(shell command -v uv 2>/dev/null)
ifdef USE_UV
  ifeq ($(USE_UV),0)
    UV :=
  endif
endif

ifeq ($(UV),)
  VENV_CMD    = python3 -m venv apps/backend-python/.venv
  PIP_UPGRADE = apps/backend-python/.venv/bin/python -m pip install --quiet --upgrade pip
  PIP_INSTALL = apps/backend-python/.venv/bin/python -m pip install --quiet -r apps/backend-python/requirements.txt
  BACKEND     = pip
else
  VENV_CMD    = uv venv --project apps/backend-python/
  PIP_UPGRADE = cd apps/backend-python && uv pip install --quiet --upgrade pip
  PIP_INSTALL = cd apps/backend-python && uv pip install --quiet -r requirements.txt
  BACKEND     = uv
endif

# Default target
help:
	@echo "LoopLM - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make setup            - Install all dependencies (Node + Python)"
	@echo "  make dev              - Setup + run Python backend + frontend dev servers"
	@echo "  make prod             - Setup + build frontend + run in production mode (no Docker)"
	@echo "  make db-push          - Push database schema changes"
	@echo "  make db-studio        - Open Drizzle Studio"
	@echo ""
	@echo "Docker:"
	@echo "  make build            - Build Docker images"
	@echo "  make start            - Start Docker containers"
	@echo "  make stop             - Stop Docker containers"
	@echo "  make restart          - Restart Docker containers"
	@echo "  make logs             - Show all container logs"
	@echo "  make logs-backend     - Show backend logs"
	@echo "  make logs-frontend    - Show frontend logs"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend    - Open shell in backend container"
	@echo "  make shell-frontend   - Open shell in frontend container"
	@echo ""
	@echo "Database (Docker):"
	@echo "  make db-clear         - Clear all data from database"
	@echo "  make db-reset         - Reset database (delete and recreate)"
	@echo "  make db-reset-python  - Reset Python backend database + ChromaDB (Docker)"
	@echo "  make db-users         - List all users in database"
	@echo "  make db-update-email  - Update user email (EMAIL_OLD=x EMAIL_NEW=y)"
	@echo ""
	@echo "Python Stack:"
	@echo "  make build-python     - Build Docker images (Python backend + frontend)"
	@echo "  make start-python     - Start Python backend + frontend on port 3081"
	@echo "  make stop-python      - Stop Python stack containers"
	@echo "  make restart-python   - Restart Python stack"
	@echo "  make logs-python      - Show Python backend logs"
	@echo "  make shell-python     - Open shell in Python backend container"
	@echo ""
	@echo "  make nginx-setup      - Setup nginx + self-signed SSL (run as root)"
	@echo "  make nginx-reload     - Reload nginx config"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Stop containers and remove volumes"
	@echo "  make prune            - Remove unused Docker resources"

# ==================== Development ====================

setup:
	@echo "[1/4] Installing Node dependencies..."
	pnpm install
	@echo "[2/4] Setting up Python virtual environment (using $(BACKEND))..."
	@if [ ! -d apps/backend-python/.venv ]; then \
		echo "Creating .venv..."; \
		$(VENV_CMD); \
	else \
		echo ".venv already exists, skipping."; \
	fi
	@echo "[3/4] Installing Python dependencies..."
	$(PIP_UPGRADE)
	$(PIP_INSTALL)
	@echo "[4/4] Copying .env files if missing..."
	@if [ ! -f apps/backend-python/.env ]; then \
		cp apps/backend-python/.env.example apps/backend-python/.env; \
		echo "Created apps/backend-python/.env from .env.example"; \
	else \
		echo "apps/backend-python/.env already exists, skipping."; \
	fi
	@echo "Setup complete!"


dev: setup
	@trap 'kill 0' SIGINT; \
	(cd apps/backend-python && .venv/bin/uvicorn main:app --reload --port 8080) & \
	pnpm --filter frontend dev & \
	wait

prod: setup
	@echo "Building frontend for production..."
	pnpm --filter frontend build
	@echo "Starting production servers..."
	@trap 'kill 0' SIGINT; \
	(cd apps/backend-python && .venv/bin/uvicorn main:app --port 8080) & \
	pnpm --filter frontend preview & \
	wait

db-push:
	cd apps/backend && pnpm db:push

db-studio:
	cd apps/backend && pnpm db:studio

# ==================== Docker ====================

build:
	docker compose --profile python build backend-python frontend-python

start:
	docker compose --profile python up -d backend-python frontend-python

stop:
	docker compose --profile python down

restart:
	docker compose --profile python down
	docker compose --profile python up -d --build backend-python frontend-python

logs:
	docker compose --profile python logs -f

logs-backend:
	docker compose --profile python logs -f backend-python

logs-frontend:
	docker compose --profile python logs -f frontend-python

# ==================== Python Stack ====================

build-python:
	docker compose --profile python build backend-python frontend-python

start-python:
	docker compose --profile python up -d backend-python frontend-python

stop-python:
	docker compose --profile python down

restart-python:
	docker compose --profile python down
	docker compose --profile python up -d --build backend-python frontend-python

logs-python:
	docker compose --profile python logs -f backend-python

shell-python:
	docker exec -it wiratek-ai-backend-python sh

# ==================== Shell Access ====================

shell-backend:
	docker exec -it wiratek-ai-backend sh

shell-frontend:
	docker exec -it wiratek-ai-frontend sh

# ==================== Cleanup ====================

clean:
	docker compose down -v
	docker compose --profile python down -v
	rm -rf apps/backend/data/*.db
	rm -rf apps/backend/uploads/*
	rm -rf apps/backend-python/data/*.db
	rm -rf apps/backend-python/uploads/*

prune:
	docker system prune -f
	docker image prune -f

# ==================== Nginx ====================

nginx-setup:
	sudo bash nginx/setup-ssl.sh

nginx-reload:
	sudo nginx -t && sudo systemctl reload nginx

# ==================== Database (Docker) ====================

# Clear all data from database tables
db-clear:
	@echo "Clearing all data from database..."
	docker exec -it wiratek-ai-backend node -e "\
		const Database = require('better-sqlite3');\
		const db = new Database('/app/apps/backend/data/webui.db');\
		const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__%'\").all();\
		tables.forEach(t => { try { db.exec('DELETE FROM ' + t.name); console.log('Cleared:', t.name); } catch(e) {} });\
		db.close();\
		console.log('Done!');\
	"

# Reset database completely (delete file)
db-reset:
	@echo "Resetting database..."
	docker exec -it wiratek-ai-backend rm -f /app/apps/backend/data/webui.db
	docker compose restart backend
	@echo "Database reset complete. Please run setup again."

# Reset Python backend database + ChromaDB (Docker)
db-reset-python:
	@echo "Resetting Python backend database and ChromaDB..."
	docker exec -it wiratek-ai-backend-python rm -f /app/data/webui.db
	docker exec -it wiratek-ai-backend-python rm -rf /app/data/chroma
	docker exec -it wiratek-ai-backend-python mkdir -p /app/data/chroma
	docker compose --profile python restart backend-python
	@echo "Python backend reset complete."

# List all users
db-users:
	@docker exec -it wiratek-ai-backend node -e "\
		const Database = require('better-sqlite3');\
		const db = new Database('/app/apps/backend/data/webui.db');\
		const users = db.prepare('SELECT id, email, name, role FROM users').all();\
		console.table(users);\
		db.close();\
	"

# Update user email: make db-update-email EMAIL_OLD=old@email.com EMAIL_NEW=new@email.com
db-update-email:
	@docker exec -it wiratek-ai-backend node -e "\
		const Database = require('better-sqlite3');\
		const db = new Database('/app/apps/backend/data/webui.db');\
		const result = db.prepare(\"UPDATE users SET email = '$(EMAIL_NEW)' WHERE email = '$(EMAIL_OLD)'\").run();\
		console.log('Updated', result.changes, 'row(s)');\
		db.close();\
	"
