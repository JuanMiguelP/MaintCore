"""Entry point de la aplicaci\u00f3n FastAPI."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.shared.logging_config import setup_logging
from app.shared.exception_handlers import register_exception_handlers
from app.shared.middleware.audit_middleware import AuditMiddleware
from app.presentation.auth.router import router as auth_router
from app.presentation.assets.router import router as assets_router
from app.presentation.categories.router import router as categories_router
from app.presentation.locations.router import router as locations_router
from app.presentation.suppliers.router import router as suppliers_router
from app.presentation.inventory.router import router as inventory_router
from app.presentation.work_orders.router import router as work_orders_router
from app.presentation.preventive_maintenance.router import router as preventive_maintenance_router
from app.presentation.dashboard.router import router as dashboard_router
from app.presentation.notifications.router import router as notifications_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicaci\u00f3n."""
    setup_logging("INFO")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MaintCore CMMS — API REST para gesti\u00f3n de mantenimiento",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audit middleware
app.add_middleware(AuditMiddleware)

# Exception handlers
register_exception_handlers(app)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(assets_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(locations_router, prefix="/api/v1")
app.include_router(suppliers_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(work_orders_router, prefix="/api/v1")
app.include_router(preventive_maintenance_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")


@app.get("/api/health")
async def health_check():
    """Health check con verificaci\u00f3n de base de datos."""
    from app.database import async_session_factory
    from sqlalchemy import text
    import datetime

    db_status = "unknown"
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": settings.app_name,
        "database": db_status,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
