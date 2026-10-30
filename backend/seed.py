"""Seed script: crea roles por defecto y usuario admin."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import select
from app.database import async_session_factory
from app.domain.auth.role import Role, Permission
from app.domain.auth.user import User
from app.infrastructure.auth.services.password_service import PasswordService


ROLES = [
    {"name": "Admin", "description": "Administrador completo del sistema"},
    {"name": "Supervisor", "description": "Supervisor de mantenimiento"},
    {"name": "Technician", "description": "T\u00e9cnico de campo"},
    {"name": "Viewer", "description": "Solo lectura"},
]

PERMISSIONS = {
    "Admin": [
        ("assets", "create"), ("assets", "read"), ("assets", "update"), ("assets", "delete"),
        ("categories", "create"), ("categories", "read"), ("categories", "update"), ("categories", "delete"),
        ("locations", "create"), ("locations", "read"), ("locations", "update"), ("locations", "delete"),
        ("users", "create"), ("users", "read"), ("users", "update"), ("users", "delete"),
        ("work_orders", "create"), ("work_orders", "read"), ("work_orders", "update"), ("work_orders", "delete"),
        ("inventory", "create"), ("inventory", "read"), ("inventory", "update"), ("inventory", "delete"),
        ("reports", "read"), ("settings", "read"), ("settings", "update"),
    ],
    "Supervisor": [
        ("assets", "read"), ("assets", "update"),
        ("categories", "read"),
        ("locations", "read"),
        ("work_orders", "create"), ("work_orders", "read"), ("work_orders", "update"),
        ("inventory", "read"), ("inventory", "update"),
        ("reports", "read"),
    ],
    "Technician": [
        ("assets", "read"),
        ("work_orders", "read"), ("work_orders", "update"),
        ("inventory", "read"), ("inventory", "update"),
    ],
    "Viewer": [
        ("assets", "read"),
        ("work_orders", "read"),
        ("inventory", "read"),
        ("reports", "read"),
    ],
}

ADMIN_USER = {
    "username": "admin",
    "email": "admin@maintcore.local",
    "password": "Admin123!",
    "full_name": "Administrador",
    "role_name": "Admin",
}


async def seed():
    """Ejecuta el seed de roles, permisos y usuario admin."""
    async with async_session_factory() as session:
        # Crear roles
        for role_data in ROLES:
            existing = await session.execute(select(Role).where(Role.name == role_data["name"]))
            if existing.scalar_one_or_none():
                print(f"  [skip] Role: {role_data['name']}")
                continue

            role = Role(name=role_data["name"], description=role_data["description"], is_system=True)
            session.add(role)
            print(f"  [create] Role: {role_data['name']}")

        await session.commit()

        # Crear permisos
        result = await session.execute(select(Role))
        roles = {r.name: r for r in result.scalars().all()}

        for role_name, perms in PERMISSIONS.items():
            role = roles.get(role_name)
            if not role:
                continue
            for resource, action in perms:
                existing = await session.execute(
                    select(Permission).where(Permission.role_id == role.id, Permission.resource == resource, Permission.action == action)
                )
                if existing.scalar_one_or_none():
                    continue
                perm = Permission(role_id=role.id, resource=resource, action=action)
                session.add(perm)
            print(f"  [create] Permissions: {role_name} ({len(PERMISSIONS[role_name])} perms)")

        await session.commit()

        # Crear usuario admin
        existing = await session.execute(select(User).where(User.username == ADMIN_USER["username"]))
        if existing.scalar_one_or_none():
            print(f"  [skip] Admin user already exists")
        else:
            role = roles[ADMIN_USER["role_name"]]
            user = User(
                username=ADMIN_USER["username"],
                email=ADMIN_USER["email"],
                hashed_password=PasswordService.hash_password(ADMIN_USER["password"]),
                full_name=ADMIN_USER["full_name"],
                role_id=role.id,
            )
            session.add(user)
            print(f"  [create] Admin user: {ADMIN_USER['username']} / {ADMIN_USER['password']}")

        await session.commit()
        print("\nSeed completado correctamente.")


if __name__ == "__main__":
    asyncio.run(seed())
