# backend/app/services/auth_service.py
import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.clients.supabase import get_supabase_client
from app.crud.users import UserRepository
from app.schemas.auth import AuthTokenResponse
from app.core.exceptions import AuthenticationError


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def login_with_email_password(self, email: str, password: str) -> AuthTokenResponse:
        client = get_supabase_client()
        try:
            result = await asyncio.to_thread(
                client.auth.sign_in_with_password,
                {"email": email, "password": password},
            )
        except Exception as exc:
            raise AuthenticationError("Invalid email or password") from exc
        return await self._build_response(result, email)

    async def sign_up(self, email: str, password: str, full_name: str) -> AuthTokenResponse:
        client = get_supabase_client()
        try:
            result = await asyncio.to_thread(
                client.auth.sign_up,
                {
                    "email": email,
                    "password": password,
                    "options": {"data": {"full_name": full_name}},
                },
            )
        except Exception as exc:
            raise AuthenticationError("Unable to create account") from exc
        if not result.session:
            raise AuthenticationError("Check your email to confirm the account before signing in")
        return await self._build_response(result, email, full_name)

    async def login_with_google(self, id_token: str) -> AuthTokenResponse:
        client = get_supabase_client()
        try:
            result = await asyncio.to_thread(
                client.auth.sign_in_with_id_token,
                {"provider": "google", "token": id_token},
            )
        except Exception as exc:
            raise AuthenticationError("Google identity could not be verified") from exc
        email = result.user.email if result.user else None
        if not email:
            raise AuthenticationError("Google account did not provide an email address")
        return await self._build_response(result, email)

    async def refresh(self, refresh_token: str) -> AuthTokenResponse:
        client = get_supabase_client()
        try:
            result = await asyncio.to_thread(client.auth.refresh_session, refresh_token)
        except Exception as exc:
            raise AuthenticationError("Session expired. Sign in again.") from exc
        email = result.user.email if result.user else None
        if not email:
            raise AuthenticationError("Unable to refresh session")
        return await self._build_response(result, email)

    async def request_password_reset(self, email: str) -> None:
        client = get_supabase_client()
        try:
            await asyncio.to_thread(client.auth.reset_password_email, email)
        except Exception as exc:
            raise AuthenticationError("Unable to send password reset email") from exc

    async def _build_response(self, result, email: str, full_name: str | None = None) -> AuthTokenResponse:
        if not result.session or not result.user:
            raise AuthenticationError("Authentication did not return an active session")
        user_id = uuid.UUID(str(result.user.id))
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            metadata = result.user.user_metadata or {}
            user = await self.user_repo.create(
                id=user_id,
                email=email,
                full_name=full_name or metadata.get("full_name") or email.split("@")[0],
                preferred_language="en",
            )
        return AuthTokenResponse(
            access_token=result.session.access_token,
            expires_in=result.session.expires_in or 3600,
            refresh_token=result.session.refresh_token,
            user_id=str(user.id),
        )
