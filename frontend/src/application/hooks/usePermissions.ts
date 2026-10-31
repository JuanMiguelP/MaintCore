import { useMemo } from 'react'

// Permisos globales para el cliente (sync, sin API)
const GLOBAL_PERMISSIONS: Record<string, string[]> = {
  Admin: ['*'],
  Supervisor: [
    'assets.read', 'assets.update',
    'categories.read',
    'locations.read',
    'work_orders.create', 'work_orders.read', 'work_orders.update',
    'inventory.read', 'inventory.update',
    'suppliers.read', 'suppliers.update',
    'preventive.read', 'preventive.update',
    'notifications.read',
    'reports.read',
  ],
  Technician: [
    'assets.read',
    'work_orders.read', 'work_orders.update',
    'inventory.read', 'inventory.update',
    'preventive.read',
  ],
  Viewer: [
    'assets.read',
    'work_orders.read',
    'inventory.read',
    'reports.read',
  ],
}

interface UsePermissionsOptions {
  role?: string | null
  customPermissions?: string[]
}

export function usePermissions({ role, customPermissions }: UsePermissionsOptions = {}) {
  const userPermissions = useMemo(() => {
    if (customPermissions) return customPermissions
    if (!role) return []
    return GLOBAL_PERMISSIONS[role] || []
  }, [role, customPermissions])

  const hasPermission = (permission: string): boolean => {
    if (userPermissions.includes('*')) return true
    return userPermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (userPermissions.includes('*')) return true
    return permissions.some(p => userPermissions.includes(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (userPermissions.includes('*')) return true
    return permissions.every(p => userPermissions.includes(p))
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, userPermissions }
}
