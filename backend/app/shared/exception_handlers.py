"""Global exception handler — estandariza respuestas de error."""

import logging
from datetime import datetime, timezone

from fastapi import Request, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.shared.exceptions import AppException, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError as AppValidationError

logger = logging.getLogger("maintcore.errors")


def register_exception_handlers(app: FastAPI) -> None:
    """Registra todos los handlers de excepciones globales."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(f"App exception: {exc.message} on {request.method} {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "timestamp": datetime.now(timezone.utc).isoformat()},
        )

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"error": exc.message, "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"error": exc.message, "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(status_code=403, content={"error": exc.message, "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"error": exc.message, "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.exception_handler(AppValidationError)
    async def validation_handler(request: Request, exc: AppValidationError) -> JSONResponse:
        return JSONResponse(status_code=422, content={"error": exc.message, "details": exc.details, "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
        errors = exc.errors()
        field_errors = {}
        for err in errors:
            field = ".".join(str(p) for p in err.get("loc", []))
            field_errors[field] = err.get("msg", str(err))
        return JSONResponse(
            status_code=422,
            content={"error": "Validation error", "details": {"field_errors": field_errors}, "timestamp": datetime.now(timezone.utc).isoformat()},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "timestamp": datetime.now(timezone.utc).isoformat()},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "timestamp": datetime.now(timezone.utc).isoformat()},
        )
