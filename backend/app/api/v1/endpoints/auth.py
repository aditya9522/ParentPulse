# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.helpers.response_builder import build_response
from app.schemas.auth import (
    AuthActionResponse,
    AuthTokenResponse,
    EmailPasswordLoginRequest,
    GoogleLoginRequest,
    PasswordResetRequest,
    RefreshTokenRequest,
    SignUpRequest,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=ApiResponse[AuthTokenResponse])
async def login_email_password(
    data: EmailPasswordLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    service = AuthService(session)
    result = await service.login_with_email_password(data.email, data.password)
    return build_response(result)


@router.post("/google", response_model=ApiResponse[AuthTokenResponse])
async def login_google(
    data: GoogleLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    service = AuthService(session)
    result = await service.login_with_google(data.id_token)
    return build_response(result)


@router.post("/signup", response_model=ApiResponse[AuthTokenResponse])
async def sign_up(data: SignUpRequest, session: AsyncSession = Depends(get_db)):
    result = await AuthService(session).sign_up(data.email, data.password, data.full_name)
    return build_response(result)


@router.post("/refresh", response_model=ApiResponse[AuthTokenResponse])
async def refresh_session(data: RefreshTokenRequest, session: AsyncSession = Depends(get_db)):
    result = await AuthService(session).refresh(data.refresh_token)
    return build_response(result)


@router.post("/password-reset", response_model=ApiResponse[AuthActionResponse])
async def request_password_reset(data: PasswordResetRequest, session: AsyncSession = Depends(get_db)):
    await AuthService(session).request_password_reset(data.email)
    return build_response(AuthActionResponse(status="accepted"))
