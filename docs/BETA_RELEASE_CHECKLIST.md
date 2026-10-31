# MaintCore v1.0.0-beta — Checklist de Release

> **Fecha:** 31 de octubre de 2026
> **Versión:** 1.0.0-beta
> **Estado:** PENDIENTE DE VALIDACION

---

## Backend

- [ ] Servidor FastAPI inicia sin errores
- [ ] Conexión a PostgreSQL funciona
- [ ] Todas las migraciones alembic aplicadas
- [ ] Endpoints documentados en `/api/docs`
- [ ] Health check `GET /api/health` responde correctamente
- [ ] CORS configurado para dominio de producción
- [ ] Audit middleware activo
- [ ] Exception handlers registrados
- [ ] Seed data ejecutable (`seed.py`)
- [ ] Rate limiting evaluado (no implementado en v1.0)

**APIs verificadas:**

| Endpoint | Método | Estado |
|----------|--------|--------|
| `/api/v1/auth/login` | POST | ✅ |
| `/api/v1/auth/refresh` | POST | ✅ |
| `/api/v1/assets` | GET, POST | ✅ |
| `/api/v1/assets/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/inventory/parts` | GET, POST | ✅ |
| `/api/v1/inventory/parts/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/inventory/movements` | GET, POST | ✅ |
| `/api/v1/inventory/parts/{id}/change-history` | GET | ✅ |
| `/api/v1/work-orders` | GET, POST | ✅ |
| `/api/v1/work-orders/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/work-orders/{id}/status` | POST | ✅ |
| `/api/v1/work-orders/{id}/assign` | POST | ✅ |
| `/api/v1/work-orders/{id}/parts` | GET, POST | ✅ |
| `/api/v1/work-orders/{id}/status-history` | GET | ✅ |
| `/api/v1/suppliers` | GET, POST | ✅ |
| `/api/v1/suppliers/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/locations` | GET, POST | ✅ |
| `/api/v1/locations/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/preventive-maintenance` | GET, POST | ✅ |
| `/api/v1/preventive-maintenance/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/notifications/rules` | GET, POST | ✅ |
| `/api/v1/notifications/rules/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/categories` | GET, POST | ✅ |
| `/api/v1/categories/{id}` | GET, PUT, DELETE | ✅ |
| `/api/v1/dashboard` | GET | ✅ |
| `/api/v1/search?q=` | GET | ✅ (nuevo) |

---

## Frontend

- [ ] `npm install` ejecutado sin errores
- [ ] `npm run build` compila sin errores
- [ ] `npm run dev` inicia en localhost:5173
- [ ] Login funciona con credenciales válidas
- [ ] Token JWT se almacena en localStorage
- [ ] Refresh token funciona al expirar access token
- [ ] MainLayout renderiza correctamente
- [ ] Drawer de navegación funciona
- [ ] GlobalSearch bar visible en AppBar
- [ ] Navegación entre módulos funciona
- [ ] CRUD de cada módulo funciona (crear, leer, actualizar, eliminar)
- [ ] Detail dialogs abren y cierran
- [ ] Forms validan campos requeridos
- [ ] Paginación funciona en listas
- [ ] Filtros de búsqueda funcionan por módulo

**Páginas verificadas:**

| Página | Ruta | Estado |
|--------|------|--------|
| Login | `/login` | ✅ |
| Dashboard | `/` | ✅ |
| Assets | `/assets` | ✅ |
| Inventory | `/inventory` | ✅ |
| Work Orders | `/work-orders` | ✅ |
| Suppliers | `/suppliers` | ✅ |
| Locations | `/locations` | ✅ |
| Preventive Maintenance | `/preventive-maintenance` | ✅ |
| Notification Settings | `/notification-settings` | ✅ |
| Categories | `/categories` | ✅ |
| Users | `/users` | ✅ |
| Reports | `/reports` | ✅ |

---

## Seguridad

- [ ] JWT tokens con expiración configurada
- [ ] Refresh token rotativo (nuevo refresh al usar)
- [ ] Passwords hasheados con bcrypt
- [ ] Endpoints protegidos con `get_current_user`
- [ ] CORS restringido a orígenes permitidos
- [ ] No hay credenciales hardcodeadas en código
- [ ] Headers de seguridad configurados
- [ ] SQL injection protegido (SQLAlchemy ORM)
- [ ] XSS protegido (React sanitization)
- [ ] No se exponen datos sensibles en respuestas

**Credenciales por defecto:**

| Usuario | Rol | Estado |
|---------|-----|--------|
| admin@maintcore.local | Admin | ✅ Configurar password |
| supervisor@maintcore.local | Supervisor | ✅ Configurar password |
| technician@maintcore.local | Technician | ✅ Configurar password |
| viewer@maintcore.local | Viewer | ✅ Configurar password |

---

## RBAC (Control de Acceso)

- [ ] Role Admin tiene acceso total (`*`)
- [ ] Role Supervisor tiene permisos de lectura/escritura en la mayoría de módulos
- [ ] Role Technician puede leer y actualizar work orders e inventory
- [ ] Role Viewer solo lectura en assets, work orders, inventory, reports
- [ ] `PermissionGate` component filtra UI según permisos
- [ ] `usePermissions` hook funciona correctamente
- [ ] Backend rechaza 403 cuando usuario no tiene permiso
- [ ] Búsqueda global respeta RBAC (solo módulos accesibles)

**Matriz de permisos:**

| Permiso | Admin | Supervisor | Technician | Viewer |
|---------|-------|-----------|------------|--------|
| assets.read | ✅ | ✅ | ✅ | ✅ |
| assets.update | ✅ | ✅ | ❌ | ❌ |
| work_orders.create | ✅ | ✅ | ❌ | ❌ |
| work_orders.read | ✅ | ✅ | ✅ | ✅ |
| work_orders.update | ✅ | ✅ | ✅ | ❌ |
| inventory.read | ✅ | ✅ | ✅ | ✅ |
| inventory.update | ✅ | ✅ | ✅ | ❌ |
| suppliers.read | ✅ | ✅ | ❌ | ❌ |
| locations.read | ✅ | ✅ | ❌ | ❌ |
| preventive.read | ✅ | ✅ | ✅ | ❌ |
| notifications.read | ✅ | ✅ | ❌ | ❌ |
| reports.read | ✅ | ✅ | ❌ | ✅ |

---

## Tests

### Backend (pytest)

- [ ] `pytest tests/` ejecuta sin errores
- [ ] test_assets.py — CRUD de assets
- [ ] test_auth.py — Login, refresh token
- [ ] test_categories.py — CRUD de categorías
- [ ] test_part_change_history.py — Historial de cambios
- [ ] test_locations.py — CRUD de ubicaciones
- [ ] test_notification_service.py — Servicio de notificaciones
- [ ] test_preventive_maintenance.py — Planificación preventiva
- [ ] test_work_orders.py — CRUD y transiciones de estado

### Frontend (Vitest)

- [ ] `npm install` (vitest, testing-library, jsdom)
- [ ] `npm run test` ejecuta sin errores
- [ ] AssetList.test.tsx — Listado, filtros, paginación
- [ ] PartList.test.tsx — Listado de repuestos
- [ ] LocationList.test.tsx — Listado de ubicaciones
- [ ] SupplierList.test.tsx — Listado de proveedores
- [ ] WorkOrderList.test.tsx — Listado de órdenes
- [ ] NotificationSettings.test.tsx — Configuración de notificaciones
- [ ] ReportsPage.test.tsx — Página de reportes
- [ ] usePermissions.test.ts — Permisos por rol
- [ ] GlobalSearch.test.tsx — Búsqueda global

---

## Docker

- [ ] Docker instalado y funcionando
- [ ] Docker Compose instalado
- [ ] Dockerfile para backend creado
- [ ] Dockerfile para frontend creado
- [ ] docker-compose.yml con:
  - [ ] Servicio backend (FastAPI + uvicorn)
  - [ ] Servicio frontend (nginx)
  - [ ] Servicio postgres
  - [ ] Variables de entorno configurables
  - [ ] Volumes para datos persistentes
  - [ ] Health checks
  - [ ] Network aislado

---

## Documentación

- [ ] README.md con instrucciones de instalación
- [ ] README.md con variables de entorno
- [ ] README.md con comandos de desarrollo
- [ ] API documentada en Swagger (`/api/docs`)
- [ ] ROADMAP_COMPLETION_REPORT.md creado
- [ ] BETA_RELEASE_CHECKLIST.md creado
- [ ] CHANGELOG.md actualizado
- [ ] Guía de despliegue disponible
- [ ] Schema de base de datos documentado

---

## Despliegue

### Staging

- [ ] Entorno staging provisionado
- [ ] Base de datos staging configurada
- [ ] Variables de entorno de staging definidas
- [ ] Dominio/subdominio asignado
- [ ] SSL/TLS configurado
- [ ] Backend desplegado en staging
- [ ] Frontend desplegado en staging
- [ ] CORS configurado para dominio de staging
- [ ] Seed data cargado en staging
- [ ] Usuarios de prueba creados en staging

### Production (preparación)

- [ ] Entorno production provisionado
- [ ] Base de datos production configurada
- [ ] Backup strategy definida
- [ ] Monitoring configurado
- [ ] Logging centralizado
- [ ] Rate limiting activado
- [ ] Health checks configurados
- [ ] Dominio production asignado
- [ ] SSL/TLS configurado
- [ ] Plan de rollback definido

---

## Firmas de Aprobación

| Rol | Nombre | Fecha | Estado |
|-----|--------|-------|--------|
| Tech Lead | _________________ | ___/___/____ | Pendiente |
| QA Lead | _________________ | ___/___/____ | Pendiente |
| Product Owner | _________________ | ___/___/____ | Pendiente |
| DevOps | _________________ | ___/___/____ | Pendiente |

---

*Checklist generado el 31 de octubre de 2026.*
*Proyecto: MaintCore CMMS v1.0.0-beta*
