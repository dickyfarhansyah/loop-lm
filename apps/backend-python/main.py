import os
import sys
import logging

# Add project root to path so `src` package is importable
sys.path.insert(0, os.path.dirname(__file__))

# ---------------------------------------------------------------------------
# Logging — configure before any module import so all loggers inherit this
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d %(levelname)-8s %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
# Suppress noisy SQLAlchemy query logs (set to WARNING to see only errors)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
# Keep stream logs always visible
logging.getLogger("src.routes.api.v1.proxy").setLevel(logging.DEBUG)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config.env import env
from src.db.migrate import run_migrations
from src.routes.api.v1.router import api_v1
from src.utils.errors import AppError

# Run DB migrations on startup
run_migrations()

app = FastAPI(
    title=env.WEBUI_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Routes
app.include_router(api_v1, prefix="/api/v1")


# Health check
@app.get("/health")
def health():
    from datetime import datetime
    return {
        "status": "ok",
        "name": env.WEBUI_NAME,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Root
@app.get("/")
def root():
    return {
        "message": f"{env.WEBUI_NAME} API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "api": "/api/v1",
            "docs": "/docs",
        },
    }


# Global error handler
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting {env.WEBUI_NAME} Python backend on port {env.PORT}")
    print(f"📚 API: http://localhost:{env.PORT}/api/v1")
    print(f"💚 Health: http://localhost:{env.PORT}/health")
    print(f"📖 Docs: http://localhost:{env.PORT}/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=env.PORT, reload=env.NODE_ENV == "development")
