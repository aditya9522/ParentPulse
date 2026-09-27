# backend/scripts/run_migrations.py
import asyncio
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings


async def apply_sql_file(conn, file_path: Path):
    print(f"Applying migration: {file_path.name} ...")
    content = file_path.read_text(encoding="utf-8")
    
    # Split statements by semicolon or execute directly if safe
    # In asyncpg/Postgres, we can execute the script using raw connection
    raw_conn = await conn.get_raw_connection()
    # Execute through asyncpg underlying connection
    await raw_conn.driver_connection.execute(content)
    print(f"Successfully applied: {file_path.name}")


async def main():
    settings = get_settings()
    engine = create_async_engine(settings.supabase_db_url.get_secret_value())
    
    migrations_dir = backend_dir / "supabase" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))
    seed_file = backend_dir / "supabase" / "seed.sql"
    
    print(f"Found {len(migration_files)} migration files.")
    
    async with engine.begin() as conn:
        for m_file in migration_files:
            await apply_sql_file(conn, m_file)
            
        if seed_file.exists():
            print(f"Applying seed data: {seed_file.name} ...")
            await apply_sql_file(conn, seed_file)
            
    # Verify tables
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"))
        tables = [r[0] for r in res.fetchall()]
        print(f"\nMigration Complete! Verified {len(tables)} tables in database:")
        for t in tables:
            print(f"  - {t}")
            
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
