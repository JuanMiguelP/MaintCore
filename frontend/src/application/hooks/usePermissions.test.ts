import { renderHook } from '@testing-library/react'
import { usePermissions } from '@/application/hooks/usePermissions'

describe('usePermissions', () => {
  it('returns all permissions for Admin role', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Admin' }))
    expect(result.current.hasPermission('assets.create')).toBe(true)
    expect(result.current.hasPermission('work_orders.delete')).toBe(true)
    expect(result.current.hasPermission('anything')).toBe(true)
  })

  it('returns correct permissions for Supervisor', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Supervisor' }))
    expect(result.current.hasPermission('assets.read')).toBe(true)
    expect(result.current.hasPermission('assets.create')).toBe(false)
    expect(result.current.hasPermission('work_orders.create')).toBe(true)
    expect(result.current.hasPermission('users.delete')).toBe(false)
  })

  it('returns correct permissions for Technician', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Technician' }))
    expect(result.current.hasPermission('assets.read')).toBe(true)
    expect(result.current.hasPermission('work_orders.update')).toBe(true)
    expect(result.current.hasPermission('assets.create')).toBe(false)
    expect(result.current.hasPermission('reports.read')).toBe(false)
  })

  it('returns correct permissions for Viewer', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Viewer' }))
    expect(result.current.hasPermission('assets.read')).toBe(true)
    expect(result.current.hasPermission('work_orders.read')).toBe(true)
    expect(result.current.hasPermission('assets.create')).toBe(false)
    expect(result.current.hasPermission('inventory.update')).toBe(false)
  })

  it('hasAnyPermission returns true if any permission matches', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Technician' }))
    expect(result.current.hasAnyPermission(['assets.create', 'work_orders.read'])).toBe(true)
    expect(result.current.hasAnyPermission(['assets.create', 'users.delete'])).toBe(false)
  })

  it('hasAllPermissions returns true only if all permissions match', () => {
    const { result } = renderHook(() => usePermissions({ role: 'Technician' }))
    expect(result.current.hasAllPermissions(['assets.read', 'work_orders.read'])).toBe(true)
    expect(result.current.hasAllPermissions(['assets.read', 'assets.create'])).toBe(false)
  })

  it('customPermissions override role permissions', () => {
    const { result } = renderHook(() => usePermissions({
      role: 'Viewer',
      customPermissions: ['assets.create', 'work_orders.update'],
    }))
    expect(result.current.hasPermission('assets.create')).toBe(true)
    expect(result.current.hasPermission('assets.read')).toBe(false)
  })

  it('empty role returns no permissions', () => {
    const { result } = renderHook(() => usePermissions({}))
    expect(result.current.hasPermission('assets.read')).toBe(false)
  })
})
