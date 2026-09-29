from pathlib import Path

MIGRATIONS = Path(__file__).resolve().parents[2] / "supabase" / "migrations"


def test_development_seed_cleanup_removes_owned_families_before_restricted_users():
    sql = (
        MIGRATIONS / "202609270007_remove_development_seed.sql"
    ).read_text(encoding="utf-8").lower()
    family_delete = sql.index("delete from families")
    user_delete = sql.index("delete from users")
    assert family_delete < user_delete
    assert "where created_by in" in sql
    assert "where (id, email) in" in sql


def test_family_health_rls_migration_covers_sensitive_tables():
    sql = (MIGRATIONS / "202609280009_harden_family_rls.sql").read_text(encoding="utf-8").lower()
    for table in (
        "caregivers",
        "documents",
        "appointments",
        "timeline_events",
        "location_visits",
        "tasks",
        "measurements",
        "medicine_dose_logs",
        "shares",
        "audit_logs",
    ):
        assert f" on {table}" in sql or f"table {table} enable row level security" in sql
    assert "security definer\nset search_path = public" in sql
    assert "has_family_capability" in sql


def test_idempotency_table_is_private_and_expiring():
    sql = (MIGRATIONS / "202609280008_idempotency_records.sql").read_text(encoding="utf-8").lower()
    assert "primary key (user_id, request_key)" in sql
    assert "expires_at timestamptz not null" in sql
    assert "enable row level security" in sql
    assert "revoke all" in sql


def test_account_controls_are_append_only_and_tombstones_are_private():
    sql = (MIGRATIONS / "202609280010_account_controls.sql").read_text(encoding="utf-8").lower()
    assert "create table if not exists consent_events" in sql
    assert "revoke update, delete on consent_events from authenticated" in sql
    assert "create table if not exists deleted_identities" in sql
    assert "revoke all on deleted_identities from authenticated, anon" in sql
    assert "consent_type in ('location_history', 'sos_location_sharing', 'ai_assistant')" in sql


def test_parent_family_integrity_is_enforced_for_every_dual_scoped_table():
    sql = (
        MIGRATIONS / "202609290011_enforce_parent_family_integrity.sql"
    ).read_text(encoding="utf-8").lower()
    assert "unique (id, family_id)" in sql
    assert "foreign key (parent_id, family_id)" in sql
    assert "references public.parent_profiles (id, family_id)" in sql
    assert "cross-family parent reference" in sql
    for table in (
        "documents",
        "medicines",
        "appointments",
        "timeline_events",
        "saved_places",
        "location_visits",
        "tasks",
        "sos_events",
        "healthcare_expenses",
        "insurance_policies",
    ):
        assert f"'{table}'" in sql


def test_voice_input_has_distinct_append_only_consent_type():
    sql = (
        MIGRATIONS / "202609290012_voice_input_consent.sql"
    ).read_text(encoding="utf-8").lower()
    assert "drop constraint if exists consent_events_consent_type_check" in sql
    assert "'voice_input'" in sql
    assert "add constraint consent_events_consent_type_check" in sql
