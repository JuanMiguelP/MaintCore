"""Use Case: Listar usuarios con paginaci\u00f3n."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.auth.repositories.user_repo import UserRepository


async def list_users(db: AsyncSession, page: int = 1, page_size: int = 20, search: str | None = None) -> dict:
    """Lista usuarios con paginaci\u00f3n y b\u00fasqueda opcional.

    Args:
        db: Sesi\u00f3n de base de datos async.
        page: N\u00famero de p\u00e1gina (1-based).
        page_size: Elementos por p\u00e1gina.
        search: T\u00e9rmino de b\u00fasqueda por username o email.

    Returns:
        Dict con items, total, page, page_size y total_pages.
    """
    skip = (page - 1) * page_size
    repo = UserRepository(db)
    users, total = await repo.list(skip=skip, limit=page_size, search=search)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": [
            {
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role_name": u.role.name if u.role else None,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
