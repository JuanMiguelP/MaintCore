# MaintCore — CMMS / GMAO

Sistema de gesti\u00f3n de mantenimiento asistido por ordenador.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL + Alembic
- **Frontend**: React 19 + TypeScript + Material UI v6 + TanStack Query
- **Infraestructura**: Docker + Docker Compose + Nginx

## Setup R\u00e1pido

```bash
# Clonar repositorio
git clone <repo>
cd MaintCore

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Levantar infraestructura
docker compose up -d postgres pgadmin

# Backend
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
```

## Arquitectura

Clean Architecture + Hexagonal. Dominios autónomos con subcapas domain/application/infrastructure/presentation.

Ver ARCHITECTURE.md para detalles completos.
