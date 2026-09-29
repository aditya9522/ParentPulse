# backend/scripts/run_migrations.py
import asyncio
import hashlib
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import get_settings

LEGACY_BASELINE = (
    "202609260001_initial_schema.sql",
    "202609260002_row_level_security.sql",
    "202609260003_storage_policies.sql",
)
MIGRATION_LOCK_ID = 7_251_807_853_177_011


def migration_checksum(file_path: Path) -> str:
    return hashlib.sha256(file_path.read_bytes()).hexdigest()


async def apply_sql_file(conn: AsyncConnection, file_path: Path) -> None:
    print(f"Applying migration: {file_path.name} ...")
    content = file_path.read_text(encoding="utf-8")

    # asyncpg can execute a complete migration script, including function bodies.
    raw_conn = await conn.get_raw_connection()
    await raw_conn.driver_connection.execute(content)
    await conn.execute(
        text(
            "INSERT INTO schema_migrations (filename, checksum) "
            "VALUES (:filename, :checksum)"
        ),
        {"filename": file_path.name, "checksum": migration_checksum(file_path)},
    )
    print(f"Successfully applied: {file_path.name}")


async def main():
    settings = get_settings()
    engine = create_async_engine(settings.supabase_db_url.get_secret_value())

    migrations_dir = backend_dir / "supabase" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    print(f"Found {len(migration_files)} migration files.")

    # A session-level lock serializes runners from overlapping deployments.
    async with engine.connect() as lock_conn:
        await lock_conn.execute(
            text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": MIGRATION_LOCK_ID}
        )
        await lock_conn.commit()
        try:
            async with engine.begin() as conn:
                await conn.execute(
                    text(
                        """
                        CREATE TABLE IF NOT EXISTS schema_migrations (
                            filename TEXT PRIMARY KEY,
                            checksum CHAR(64),
                            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                )
                await conn.execute(
                    text("ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum CHAR(64)")
                )
                tracked_count = await conn.scalar(text("SELECT COUNT(*) FROM schema_migrations"))
                legacy_schema_exists = await conn.scalar(
                    text("SELECT to_regclass('public.families') IS NOT NULL")
                )
                if tracked_count == 0 and legacy_schema_exists:
                    files_by_name = {path.name: path for path in migration_files}
                    for filename in LEGACY_BASELINE:
                        await conn.execute(
                            text(
                                "INSERT INTO schema_migrations (filename, checksum) "
                                "VALUES (:filename, :checksum) ON CONFLICT DO NOTHING"
                            ),
                            {
                                "filename": filename,
                                "checksum": migration_checksum(files_by_name[filename]),
                            },
                        )
                    print("Recorded the existing pre-tracking schema baseline.")

            for migration_file in migration_files:
                checksum = migration_checksum(migration_file)
                async with engine.begin() as conn:
                    recorded_checksum = await conn.scalar(
                        text(
                            "SELECT checksum FROM schema_migrations "
                            "WHERE filename = :filename"
                        ),
                        {"filename": migration_file.name},
                    )
                    if recorded_checksum is not None:
                        if recorded_checksum.strip() != checksum:
                            raise RuntimeError(
                                f"Migration drift detected for {migration_file.name}; "
                                "an applied migration must never be edited."
                            )
                        print(f"Skipping applied migration: {migration_file.name}")
                        continue

                    tracked_without_checksum = await conn.scalar(
                        text(
                            "SELECT EXISTS (SELECT 1 FROM schema_migrations "
                            "WHERE filename = :filename)"
                        ),
                        {"filename": migration_file.name},
                    )
                    if tracked_without_checksum:
                        await conn.execute(
                            text(
                                "UPDATE schema_migrations SET checksum = :checksum "
                                "WHERE filename = :filename AND checksum IS NULL"
                            ),
                            {"filename": migration_file.name, "checksum": checksum},
                        )
                        print(f"Recorded checksum for legacy migration: {migration_file.name}")
                        continue
                    await apply_sql_file(conn, migration_file)

            async with engine.connect() as conn:
                res = await conn.execute(
                    text(
                        "SELECT table_name FROM information_schema.tables "
                        "WHERE table_schema = 'public' ORDER BY table_name"
                    )
                )
                tables = [r[0] for r in res.fetchall()]
                print(f"\nMigration Complete! Verified {len(tables)} tables in database:")
                for table in tables:
                    print(f"  - {table}")
        finally:
            await lock_conn.execute(
                text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": MIGRATION_LOCK_ID}
            )
            await lock_conn.commit()
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
