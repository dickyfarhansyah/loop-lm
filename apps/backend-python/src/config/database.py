from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.config.env import env
import os

# Ensure data directory exists
os.makedirs(os.path.dirname(env.DATABASE_URL) if os.path.dirname(env.DATABASE_URL) else ".", exist_ok=True)

DATABASE_URL = f"sqlite:///{env.DATABASE_URL}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=env.NODE_ENV == "development",
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
