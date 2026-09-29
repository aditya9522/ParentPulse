# backend/app/core/exceptions.py
from typing import Any

from fastapi import status


class ParentPulseException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(ParentPulseException):
    def __init__(self, message: str = "Invalid or expired authentication credentials."):
        super().__init__(
            code="AUTHENTICATION_FAILED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(ParentPulseException):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(
            code="FORBIDDEN_ACCESS",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ResourceNotFoundError(ParentPulseException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(ParentPulseException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code="RESOURCE_CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class ProviderError(ParentPulseException):
    def __init__(self, provider: str, message: str):
        super().__init__(
            code="EXTERNAL_PROVIDER_ERROR",
            message=f"External provider '{provider}' failed: {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
        )


class RateLimitExceededError(ParentPulseException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )
