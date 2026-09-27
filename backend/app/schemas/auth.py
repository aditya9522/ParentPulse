# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class EmailPasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


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
