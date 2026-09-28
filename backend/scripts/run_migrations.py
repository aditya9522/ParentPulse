# backend/scripts/run_migrations.py
import asyncio
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import get_settings  # noqa: E402

LEGACY_BASELINE = (
    "202609260001_initial_schema.sql",
    "202609260002_row_level_security.sql",
    "202609260003_storage_policies.sql",
)


async def apply_sql_file(conn: AsyncConnection, file_path: Path) -> None:
    print(f"Applying migration: {file_path.name} ...")
    content = file_path.read_text(encoding="utf-8")

    # asyncpg can execute a complete migration script, including function bodies.
    raw_conn = await conn.get_raw_connection()
    await raw_conn.driver_connection.execute(content)
    await conn.execute(
        text("INSERT INTO schema_migrations (filename) VALUES (:filename)"),
        {"filename": file_path.name},
    )
    print(f"Successfully applied: {file_path.name}")


async def main():
    settings = get_settings()
    engine = create_async_engine(settings.supabase_db_url.get_secret_value())

    migrations_dir = backend_dir / "supabase" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    print(f"Found {len(migration_files)} migration files.")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    filename TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        tracked_count = await conn.scalar(text("SELECT COUNT(*) FROM schema_migrations"))
        legacy_schema_exists = await conn.scalar(
            text("SELECT to_regclass('public.families') IS NOT NULL")
        )
        if tracked_count == 0 and legacy_schema_exists:
            for filename in LEGACY_BASELINE:
                await conn.execute(
                    text(
                        "INSERT INTO schema_migrations (filename) VALUES (:filename) "
                        "ON CONFLICT DO NOTHING"
                    ),
                    {"filename": filename},
                )
            print("Recorded the existing pre-tracking schema baseline.")

    for migration_file in migration_files:
        async with engine.begin() as conn:
            already_applied = await conn.scalar(
                text("SELECT 1 FROM schema_migrations WHERE filename = :filename"),
                {"filename": migration_file.name},
            )
            if already_applied:
                print(f"Skipping applied migration: {migration_file.name}")
                continue
            await apply_sql_file(conn, migration_file)

    # Verify tables
    async with engine.connect() as conn:
        res = await conn.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            )
        )
        tables = [r[0] for r in res.fetchall()]
        print(f"\nMigration Complete! Verified {len(tables)} tables in database:")
        for t in tables:
            print(f"  - {t}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
