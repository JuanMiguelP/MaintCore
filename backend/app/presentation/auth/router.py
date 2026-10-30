"""Router de Autenticaci\u00f3n — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth.use_cases.login import login
from app.application.auth.use_cases.refresh_token import refresh_token
from app.application.auth.use_cases.create_user import create_user
from app.application.auth.use_cases.list_users import list_users
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, UnauthorizedError, ConflictError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
async def auth_login(credentials: dict, db: AsyncSession = Depends(get_db)):
    """Login de usuario y obtenci\u00f3n de tokens JWT."""
    try:
        result = await login(db, credentials["username"], credentials["password"])
        return result
    except (NotFoundError, UnauthorizedError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/refresh")
async def auth_refresh(body: dict, db: AsyncSession = Depends(get_db)):
    """Renueva tokens JWT usando refresh token."""
    try:
        result = await refresh_token(body["refresh_token"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_new_user(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Crea un nuevo usuario (requiere autenticaci\u00f3n)."""
    try:
        result = await create_user(
            db,
            username=body["username"],
            email=body["email"],
            password=body["password"],
            full_name=body.get("full_name"),
            role_id=body.get("role_id"),
        )
        return result
    except ConflictError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/users")
async def get_users(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Lista usuarios con paginaci\u00f3n (requiere autenticaci\u00f3n)."""
    return await list_users(db, page=page, page_size=page_size, search=search)
