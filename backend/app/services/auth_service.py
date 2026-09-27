# backend/app/services/auth_service.py
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.users import UserRepository
from app.models.user import User
from app.schemas.auth import AuthTokenResponse
from app.core.exceptions import AuthenticationError


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def login_with_email_password(self, email: str, password: str) -> AuthTokenResponse:
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Create user on first login for seamless developer experience
            user = await self.user_repo.create(
                email=email,
                full_name=email.split("@")[0].capitalize(),
                preferred_language="en",
            )

        token = f"dev-token-{user.id}"
        return AuthTokenResponse(
            access_token=token,
            expires_in=3600,
            refresh_token=f"refresh-{user.id}",
            user_id=str(user.id),
        )

    async def login_with_google(self, id_token: str) -> AuthTokenResponse:
        # In mock/local: resolve to demo user
        email = "google.user@example.com"
        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create(
                email=email,
                full_name="Google Family Member",
                preferred_language="en",
            )
        token = f"dev-token-{user.id}"
        return AuthTokenResponse(
            access_token=token,
            expires_in=3600,
            refresh_token=f"refresh-{user.id}",
            user_id=str(user.id),
        )
