from sqlalchemy import text, inspect
from src.config.database import engine
from src.db.models import Base


def _add_column_if_missing(conn, table: str, column: str, col_def: str):
    inspector = inspect(conn)
    existing = [c["name"] for c in inspector.get_columns(table)]
    if column not in existing:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))
        print(f"  + Added column {table}.{column}")


def run_migrations():
    """Create all tables if they don't exist, then apply column additions."""
    Base.metadata.create_all(bind=engine)

    # Add new columns that may not exist in older DBs
    with engine.begin() as conn:
        _add_column_if_missing(conn, "model_prompt", "name", "TEXT")
        _add_column_if_missing(conn, "model_prompt", "prompt", "TEXT")
        _add_column_if_missing(conn, "model_prompt", "enabled", "INTEGER NOT NULL DEFAULT 1")
        _add_column_if_missing(conn, "model_prompt", "is_default", "INTEGER NOT NULL DEFAULT 0")

        # Model default/pinned flags (added later — safe to run on old DBs)
        _add_column_if_missing(conn, "model", "is_default", "INTEGER NOT NULL DEFAULT 0")
        _add_column_if_missing(conn, "model", "is_pinned", "INTEGER NOT NULL DEFAULT 0")

        # Knowledge (added later — safe to run on old DBs)
        _add_column_if_missing(conn, "knowledge", "description", "TEXT")
        _add_column_if_missing(conn, "knowledge", "data", "TEXT")
        _add_column_if_missing(conn, "knowledge", "chunking_strategy", "TEXT NOT NULL DEFAULT 'default'")

        # KnowledgeFile — embedding pipeline status
        _add_column_if_missing(conn, "knowledge_file", "embed_status", "TEXT NOT NULL DEFAULT 'pending'")
        _add_column_if_missing(conn, "knowledge_file", "embed_error", "TEXT")
        _add_column_if_missing(conn, "knowledge_file", "chunk_count", "INTEGER NOT NULL DEFAULT 0")

    print("✅ Database migrations complete")


if __name__ == "__main__":
    run_migrations()
