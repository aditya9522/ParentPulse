import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check():
    async with engine.connect() as conn:
        for t in ["users", "families", "family_members", "parent_profiles", "medicines", "documents", "appointments", "measurements", "timeline_events", "location_visits"]:
            try:
                res = await conn.execute(text(f"SELECT count(*) FROM {t}"))
                print(f"{t}: {res.scalar()}")
            except Exception as e:
                print(f"{t} error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
