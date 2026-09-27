# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import EmailPasswordLoginRequest, GoogleLoginRequest, AuthTokenResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

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
