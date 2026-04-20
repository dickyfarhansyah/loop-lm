import os
from dotenv import load_dotenv

load_dotenv()


class Env:
    PORT: int = int(os.getenv("PORT", "8080"))
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "./data/webui.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-secret-in-production")
    JWT_EXPIRES_IN: str = os.getenv("JWT_EXPIRES_IN", "7d")
    CORS_ALLOW_ORIGIN: str = os.getenv("CORS_ALLOW_ORIGIN", "*")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))
    WEBUI_NAME: str = os.getenv("WEBUI_NAME", "Wiratek AI")
    # ChromaDB
    CHROMA_MODE: str = os.getenv("CHROMA_MODE", "embedded")  # embedded | http
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
    CHROMA_URL: str = os.getenv("CHROMA_URL", "http://localhost:8000")
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))


env = Env()
