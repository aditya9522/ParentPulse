import asyncio
import hashlib
import uuid
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi.encoders import jsonable_encoder
from sqlalchemy import delete, inspect, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.supabase import get_supabase_client
from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    ProviderError,
    RateLimitExceededError,
)
from app.models.account_control import ConsentEvent, DeletedIdentity
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.caregiver import Caregiver
from app.models.document import Document
from app.models.expense import HealthcareExpense, InsurancePolicy
from app.models.family import Family
from app.models.family_member import FamilyMember
from app.models.location_visit import LocationVisit
from app.models.measurement import Measurement
from app.models.medicine import Medicine, MedicineDoseLog
from app.models.notification import Notification
from app.models.parent_profile import ParentProfile
from app.models.push_device import PushDevice
from app.models.saved_place import SavedPlace
from app.models.share import Share
from app.models.sos_event import SosAcknowledgement, SosEvent
from app.models.task import Task
from app.models.timeline_event import TimelineEvent
from app.models.user import User
from app.services.storage_service import StorageService
from supabase import create_client

CONSENT_TYPES = {
    "location_history",
    "sos_location_sharing",
    "ai_assistant",
    "voice_input",
}
DELETION_PHRASE = "DELETE MY PARENTPULSE ACCOUNT"


def _serialize(row: Any, *, exclude: set[str] | None = None) -> dict[str, Any]:
    excluded = exclude or set()
    values = {
        column.key: getattr(row, column.key)
        for column in inspect(row).mapper.column_attrs
        if column.key not in excluded
    }
    return jsonable_encoder(values)


async def current_consents(session: AsyncSession, user_id: uuid.UUID) -> list[ConsentEvent]:
    rows = (
        await session.scalars(
            select(ConsentEvent)
            .where(ConsentEvent.user_id == user_id)
            .order_by(ConsentEvent.consent_type, ConsentEvent.occurred_at.desc())
        )
    ).all()
    latest: dict[str, ConsentEvent] = {}
    for row in rows:
        latest.setdefault(row.consent_type, row)
    return [latest[key] for key in sorted(latest)]


async def has_consent(session: AsyncSession, user_id: uuid.UUID, consent_type: str) -> bool:
    event = await session.scalar(
        select(ConsentEvent)
        .where(
            ConsentEvent.user_id == user_id,
            ConsentEvent.consent_type == consent_type,
        )
        .order_by(ConsentEvent.occurred_at.desc())
        .limit(1)
    )
    return bool(event and event.granted)


async def append_consent(
    session: AsyncSession,
    user_id: uuid.UUID,
    consent_type: str,
    granted: bool,
    policy_version: str,
) -> ConsentEvent:
    if consent_type not in CONSENT_TYPES:
        raise ConflictError("Unsupported consent preference.")
    event = ConsentEvent(
        user_id=user_id,
        consent_type=consent_type,
        granted=granted,
        policy_version=policy_version,
        source="mobile_settings",
        context={"platform": "mobile"},
    )
    session.add(event)
    await session.flush()
    return event


async def build_account_export(session: AsyncSession, user: User) -> dict[str, Any]:
    memberships = (
        await session.scalars(select(FamilyMember).where(FamilyMember.user_id == user.id))
    ).all()
    family_ids = [membership.family_id for membership in memberships]
    families = (
        await session.scalars(select(Family).where(Family.id.in_(family_ids)))
    ).all() if family_ids else []
    parents = (
        await session.scalars(select(ParentProfile).where(ParentProfile.family_id.in_(family_ids)))
    ).all() if family_ids else []
    parent_ids = [parent.id for parent in parents]

    async def by_family(model: Any) -> list[Any]:
        if not family_ids:
            return []
        return list((await session.scalars(select(model).where(model.family_id.in_(family_ids)))).all())

    async def by_parent(model: Any) -> list[Any]:
        if not parent_ids:
            return []
        return list((await session.scalars(select(model).where(model.parent_id.in_(parent_ids)))).all())

    medicines = await by_family(Medicine)
    medicine_ids = [medicine.id for medicine in medicines]
    dose_logs = list((await session.scalars(
        select(MedicineDoseLog).where(MedicineDoseLog.medicine_id.in_(medicine_ids))
    )).all()) if medicine_ids else []
    sos_events = await by_family(SosEvent)
    sos_ids = [event.id for event in sos_events]
    acknowledgements = list((await session.scalars(
        select(SosAcknowledgement).where(SosAcknowledgement.sos_event_id.in_(sos_ids))
    )).all()) if sos_ids else []
    consents = await current_consents(session, user.id)

    record_sets: dict[str, tuple[list[Any], set[str]]] = {
        "parent_profiles": (parents, set()),
        "caregivers": (await by_parent(Caregiver), set()),
        "documents": (await by_family(Document), {"storage_path", "file_url"}),
        "medicines": (medicines, set()),
        "medicine_dose_logs": (dose_logs, set()),
        "appointments": (await by_family(Appointment), set()),
        "measurements": (await by_parent(Measurement), set()),
        "timeline_events": (await by_family(TimelineEvent), set()),
        "saved_places": (await by_family(SavedPlace), set()),
        "location_visits": (await by_family(LocationVisit), set()),
        "tasks": (await by_family(Task), set()),
        "healthcare_expenses": (await by_family(HealthcareExpense), set()),
        "insurance_policies": (await by_family(InsurancePolicy), set()),
        "doctor_shares": (await by_parent(Share), {"token"}),
        "sos_events": (sos_events, set()),
        "sos_acknowledgements": (acknowledgements, set()),
        "notifications": (list((await session.scalars(
            select(Notification).where(Notification.user_id == user.id)
        )).all()), set()),
    }
    return {
        "format_version": "1.0",
        "generated_at": datetime.now(UTC),
        "account": _serialize(user),
        "consents": [_serialize(event, exclude={"user_id"}) for event in consents],
        "care_circles": [
            {
                **_serialize(family),
                "membership": _serialize(next(m for m in memberships if m.family_id == family.id)),
            }
            for family in families
        ],
        "records": {
            name: [_serialize(row, exclude=excluded) for row in rows]
            for name, (rows, excluded) in record_sets.items()
        },
        "notes": [
            "This archive contains structured records available to your account at generation time.",
            "Private storage paths, share tokens, and document binaries are intentionally excluded.",
            "Original medical files remain available through authenticated document downloads.",
        ],
    }


async def deletion_impact(session: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
    owned_ids = list((await session.scalars(select(Family.id).where(Family.created_by == user_id))).all())
    memberships = list((await session.scalars(
        select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)
    )).all())
    parent_count = 0
    document_count = 0
    if owned_ids:
        parent_ids = list((await session.scalars(
            select(ParentProfile.id).where(ParentProfile.family_id.in_(owned_ids))
        )).all())
        parent_count = len(parent_ids)
        if parent_ids:
            document_count = len(list((await session.scalars(
                select(Document.id).where(Document.parent_id.in_(parent_ids))
            )).all()))
    return {
        "owned_care_circles": len(owned_ids),
        "shared_care_circles": len(set(memberships) - set(owned_ids)),
        "parent_profiles_removed": parent_count,
        "medical_documents_removed": document_count,
        "confirmation_phrase": DELETION_PHRASE,
    }


async def verify_password(email: str, password: str) -> None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    headers = {"apikey": settings.supabase_publishable_key.get_secret_value()}
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json={"email": email, "password": password})
    except httpx.HTTPError as exc:
        raise ProviderError("Supabase Auth", "Could not verify your password.") from exc
    if response.status_code == 429:
        raise RateLimitExceededError("Too many password checks. Please wait and try again.")
    if response.status_code >= 500:
        raise ProviderError("Supabase Auth", "Password verification is temporarily unavailable.")
    if response.status_code >= 400:
        raise AuthenticationError("Your current password is incorrect.")


async def get_auth_methods(user_id: uuid.UUID) -> list[str]:
    client = get_supabase_client()
    try:
        response = await asyncio.to_thread(client.auth.admin.get_user_by_id, str(user_id))
    except Exception as exc:
        raise ProviderError("Supabase Auth", "Could not inspect account sign-in methods.") from exc
    if not response.user:
        raise AuthenticationError("The authentication identity no longer exists.")
    identities = getattr(response.user, "identities", None) or []
    providers = {
        identity.get("provider") if isinstance(identity, dict) else getattr(identity, "provider", None)
        for identity in identities
    }
    methods: list[str] = []
    if "email" in providers:
        methods.append("password")
    if "google" in providers:
        methods.append("google")
    if not methods:
        raise ConflictError("This account has no supported reauthentication method.")
    return methods


async def verify_google_identity(user: User, id_token: str) -> None:
    settings = get_settings()
    client = create_client(
        settings.supabase_url,
        settings.supabase_publishable_key.get_secret_value(),
    )
    try:
        result = await asyncio.to_thread(
            client.auth.sign_in_with_id_token,
            {"provider": "google", "token": id_token},
        )
    except Exception as exc:
        raise AuthenticationError("Google could not verify this account.") from exc
    verified_user = result.user
    if not verified_user or str(verified_user.id) != str(user.id):
        raise AuthenticationError("Choose the Google account currently signed in to ParentPulse.")


async def delete_account(
    session: AsyncSession,
    user: User,
    credential_type: str,
    confirmation: str,
    password: str | None = None,
    google_id_token: str | None = None,
) -> str:
    if confirmation != DELETION_PHRASE:
        raise ConflictError("The account deletion confirmation phrase does not match.")
    methods = await get_auth_methods(user.id)
    if credential_type not in methods:
        raise AuthenticationError("That sign-in method is not linked to this account.")
    if credential_type == "password" and password:
        await verify_password(user.email, password)
    elif credential_type == "google" and google_id_token:
        await verify_google_identity(user, google_id_token)
    else:
        raise AuthenticationError("Fresh account verification is required.")

    owned_family_ids = list((await session.scalars(
        select(Family.id).where(Family.created_by == user.id)
    )).all())
    storage_paths: list[str] = []
    if owned_family_ids:
        storage_paths = list((await session.scalars(
            select(Document.storage_path).where(Document.family_id.in_(owned_family_ids))
        )).all())
        await session.execute(delete(Family).where(Family.id.in_(owned_family_ids)))

    await session.execute(delete(FamilyMember).where(FamilyMember.user_id == user.id))
    await session.execute(delete(Caregiver).where(Caregiver.user_id == user.id))
    await session.execute(delete(Notification).where(Notification.user_id == user.id))
    await session.execute(delete(PushDevice).where(PushDevice.user_id == user.id))
    await session.execute(delete(ConsentEvent).where(ConsentEvent.user_id == user.id))

    identity_hash = hashlib.sha256(str(user.id).encode()).hexdigest()[:24]
    user.email = f"deleted+{identity_hash}@deleted.invalid"
    user.full_name = "Former ParentPulse member"
    user.phone_number = None
    user.avatar_url = None
    user.is_active = False
    tombstone = DeletedIdentity(
        id=user.id,
        auth_cleanup_status="pending",
        cleanup_context={"owned_care_circles_removed": len(owned_family_ids)},
    )
    session.add(tombstone)
    session.add(
        AuditLog(
            user_id=user.id,
            action="account_deleted",
            resource_type="user",
            resource_id=user.id,
            metadata_json={
                "owned_care_circles_removed": len(owned_family_ids),
                "shared_memberships_removed": True,
                "identity_pseudonymized": True,
            },
        )
    )
    await session.commit()

    storage_cleanup_pending = False
    if storage_paths:
        try:
            await StorageService.delete_documents(storage_paths)
        except Exception:  # noqa: BLE001 - provider SDK exposes multiple transport error types
            storage_cleanup_pending = True

    status = "pending"
    try:
        client = get_supabase_client()
        await asyncio.to_thread(client.auth.admin.delete_user, str(user.id))
        status = "completed"
    except Exception:  # noqa: BLE001 - provider SDK exposes multiple transport error types
        # The tombstone blocks this identity immediately even if provider cleanup needs retrying.
        status = "pending"
    tombstone.auth_cleanup_status = status
    tombstone.cleanup_context = {
        **tombstone.cleanup_context,
        "storage_cleanup_pending": storage_cleanup_pending,
    }
    await session.commit()
    return status
