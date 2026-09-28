# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class EmailPasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class SignUpRequest(EmailPasswordLoginRequest):
    full_name: str = Field(..., min_length=2, max_length=255)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class GoogleLoginRequest(BaseModel):
    id_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str
    user_id: str


class AuthActionResponse(BaseModel):
    status: str
