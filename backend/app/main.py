# backend/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.exceptions import ParentPulseException
from app.core.logging import logger, setup_logging
from app.middleware.correlation_id import CorrelationIdMiddleware
from app.middleware.error_handler import (
    global_exception_handler,
    parentpulse_exception_handler,
)
from app.middleware.idempotency import IdempotencyMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

settings = get_settings()
setup_logging(debug=settings.debug)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ParentPulse application lifespan...")
    yield
    logger.info("Shutting down ParentPulse application lifespan...")


app = FastAPI(
    title=settings.app_name,
    description="ParentPulse Remote-Care Family Health Coordination Platform API",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Exception handlers
app.add_exception_handler(ParentPulseException, parentpulse_exception_handler)  # type: ignore
app.add_exception_handler(Exception, global_exception_handler)

# Custom Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(CorrelationIdMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"])
async def root_health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.environment,
    }
