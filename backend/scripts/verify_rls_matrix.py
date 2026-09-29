"""Run a rollback-only multi-user security matrix against the configured database."""

import asyncio
import sys
import uuid
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import get_settings


async def assume_user(conn: AsyncConnection, user_id: uuid.UUID) -> None:
    await conn.exec_driver_sql("RESET ROLE")
    await conn.exec_driver_sql("SET LOCAL ROLE authenticated")
    await conn.execute(
        text("SELECT set_config('request.jwt.claim.sub', :user_id, true)"),
        {"user_id": str(user_id)},
    )
    await conn.execute(
        text("SELECT set_config('request.jwt.claim.role', 'authenticated', true)")
    )


async def expect_denied(conn: AsyncConnection, statement: str, params: dict) -> None:
    savepoint = await conn.begin_nested()
    try:
        result = await conn.execute(text(statement), params)
    except DBAPIError:
        await savepoint.rollback()
        return
    await savepoint.rollback()
    if result.rowcount not in {0, -1}:
        raise AssertionError("A forbidden mutation unexpectedly affected a row.")


async def expect_database_rejection(
    conn: AsyncConnection, statement: str, params: dict
) -> None:
    savepoint = await conn.begin_nested()
    try:
        await conn.execute(text(statement), params)
    except DBAPIError:
        await savepoint.rollback()
        return
    await savepoint.rollback()
    raise AssertionError("The database unexpectedly accepted a forbidden operation.")


async def expect_count(
    conn: AsyncConnection, statement: str, params: dict, expected: int
) -> None:
    count = await conn.scalar(text(statement), params)
    if count != expected:
        raise AssertionError(f"Expected {expected} visible row(s), found {count}.")


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.supabase_db_url.get_secret_value())
    ids = {name: uuid.uuid4() for name in (
        "owner_a", "member_a", "owner_b", "family_a", "family_b",
        "parent_a", "parent_b", "member_owner_a", "member_a_row",
        "member_owner_b", "task_a", "task_b", "tombstone",
    )}
    checks: list[str] = []

    async with engine.connect() as conn:
        transaction = await conn.begin()
        try:
            await conn.execute(
                text(
                    "INSERT INTO users (id, email, full_name) VALUES "
                    "(:owner_a, :email_a, 'RLS Owner A'), "
                    "(:member_a, :email_member, 'RLS Member A'), "
                    "(:owner_b, :email_b, 'RLS Owner B')"
                ),
                {
                    **ids,
                    "email_a": f"rls-owner-a-{ids['owner_a']}@test.invalid",
                    "email_member": f"rls-member-a-{ids['member_a']}@test.invalid",
                    "email_b": f"rls-owner-b-{ids['owner_b']}@test.invalid",
                },
            )
            await conn.execute(
                text(
                    "INSERT INTO families (id, name, created_by) VALUES "
                    "(:family_a, 'RLS Family A', :owner_a), "
                    "(:family_b, 'RLS Family B', :owner_b)"
                ),
                ids,
            )
            await conn.execute(
                text(
                    "INSERT INTO family_members "
                    "(id, family_id, user_id, role, relationship, "
                    "can_manage_medicines, can_manage_appointments, "
                    "can_upload_documents, can_share_doctor_brief, "
                    "can_view_location_history) VALUES "
                    "(:member_owner_a, :family_a, :owner_a, 'owner', 'self', true, true, true, true, true), "
                    "(:member_a_row, :family_a, :member_a, 'family_member', 'child', false, false, false, false, false), "
                    "(:member_owner_b, :family_b, :owner_b, 'owner', 'self', true, true, true, true, true)"
                ),
                ids,
            )
            parent_values = {
                **ids,
                "dob": date(1950, 1, 1),
            }
            await conn.execute(
                text(
                    "INSERT INTO parent_profiles "
                    "(id, family_id, full_name, date_of_birth, gender, blood_group, address, phone_number) VALUES "
                    "(:parent_a, :family_a, 'RLS Parent A', :dob, 'other', 'O+', 'Test A', '0000000001'), "
                    "(:parent_b, :family_b, 'RLS Parent B', :dob, 'other', 'O+', 'Test B', '0000000002')"
                ),
                parent_values,
            )
            await conn.execute(
                text(
                    "INSERT INTO tasks (id, parent_id, family_id, title, created_by) VALUES "
                    "(:task_a, :parent_a, :family_a, 'RLS Task A', :owner_a), "
                    "(:task_b, :parent_b, :family_b, 'RLS Task B', :owner_b)"
                ),
                ids,
            )
            await conn.execute(
                text("INSERT INTO deleted_identities (id) VALUES (:tombstone)"), ids
            )

            await assume_user(conn, ids["member_a"])
            await expect_count(conn, "SELECT count(*) FROM families", {}, 1)
            await expect_count(conn, "SELECT count(*) FROM tasks", {}, 1)
            await expect_count(
                conn,
                "SELECT count(*) FROM parent_profiles WHERE id = :parent_b",
                ids,
                0,
            )
            checks.append("member reads are isolated to one family")

            await expect_denied(
                conn,
                "UPDATE family_members SET can_upload_documents = true "
                "WHERE id = :member_a_row",
                ids,
            )
            capability = await conn.scalar(
                text("SELECT public.has_family_capability(:family_a, 'documents')"), ids
            )
            if capability:
                raise AssertionError("Restricted member unexpectedly gained document capability.")
            checks.append("non-owner permission escalation is denied")

            await conn.execute(
                text(
                    "INSERT INTO consent_events "
                    "(user_id, consent_type, granted, policy_version) "
                    "VALUES (:member_a, 'voice_input', true, 'matrix-v1')"
                ),
                ids,
            )
            await expect_count(
                conn,
                "SELECT count(*) FROM consent_events "
                "WHERE user_id = :member_a AND consent_type = 'voice_input'",
                ids,
                1,
            )
            await expect_denied(
                conn,
                "INSERT INTO consent_events "
                "(user_id, consent_type, granted, policy_version) "
                "VALUES (:owner_b, 'voice_input', true, 'matrix-v1')",
                ids,
            )
            await expect_database_rejection(
                conn,
                "UPDATE consent_events SET granted = false "
                "WHERE user_id = :member_a AND consent_type = 'voice_input'",
                ids,
            )
            checks.append("voice consent is owner-scoped and append-only")

            await expect_database_rejection(
                conn,
                "INSERT INTO tasks "
                "(id, parent_id, family_id, title, created_by) VALUES "
                "(:new_task, :parent_b, :family_a, 'Cross-family task', :member_a)",
                {**ids, "new_task": uuid.uuid4()},
            )
            checks.append("cross-family parent references are rejected")

            await expect_database_rejection(conn, "SELECT * FROM deleted_identities", {})
            checks.append("deleted-identity tombstones are private")

            await expect_denied(
                conn,
                "DELETE FROM parent_profiles WHERE id = :parent_a",
                ids,
            )
            await assume_user(conn, ids["owner_a"])
            owner_delete = await conn.begin_nested()
            result = await conn.execute(
                text("DELETE FROM parent_profiles WHERE id = :parent_a"), ids
            )
            if result.rowcount != 1:
                raise AssertionError("Family owner could not delete their parent profile.")
            await owner_delete.rollback()
            checks.append("parent deletion is restricted to the family owner")
        finally:
            await conn.exec_driver_sql("RESET ROLE")
            await transaction.rollback()
            await engine.dispose()

    print(f"Live RLS matrix passed ({len(checks)} checks; all fixtures rolled back):")
    for check in checks:
        print(f"  - {check}")


if __name__ == "__main__":
    asyncio.run(main())
