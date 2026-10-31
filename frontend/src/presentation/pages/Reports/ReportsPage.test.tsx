import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ReportsPage from './ReportsPage'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockParts = { items: [{ id: '1', name: 'Part A', current_stock: 10, unit_cost: 5 }], total: 1, page: 1, page_size: 500, total_pages: 1 }
const mockValuation = { total_value: 50, by_supplier: [{ supplier: 'Supplier A', total_value: 50 }] }
const mockWorkOrders = { items: [{ id: '1', status: 'OPEN', priority: 'HIGH' }], total: 1, page: 1, page_size: 500, total_pages: 1 }
const mockPlans = { items: [{ id: '1', is_active: true, frequency_type: 'MONTHLY' }], total: 1, page: 1, page_size: 500, total_pages: 1 }

describe('ReportsPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/inventory'), 'getLowStockParts').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/inventory'), 'getInventoryValuation').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getOverduePlans').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getUpcomingPlans').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getMaintenancePlans').mockImplementation(() => new Promise(() => {}))
    render(<ReportsPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders inventory tab with KPIs', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue(mockParts)
    vi.spyOn(require('@/application/api/inventory'), 'getLowStockParts').mockResolvedValue([{ id: '1' }])
    vi.spyOn(require('@/application/api/inventory'), 'getInventoryValuation').mockResolvedValue(mockValuation)
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue(mockWorkOrders)
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getOverduePlans').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 500, total_pages: 0 })
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getUpcomingPlans').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 500, total_pages: 0 })
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getMaintenancePlans').mockResolvedValue(mockPlans)
    render(<ReportsPage />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Reportes y Exportaciones')).toBeInTheDocument() })
    expect(screen.getByText('Total Repuestos')).toBeInTheDocument()
  })

  it('renders export button', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue(mockParts)
    vi.spyOn(require('@/application/api/inventory'), 'getLowStockParts').mockResolvedValue([])
    vi.spyOn(require('@/application/api/inventory'), 'getInventoryValuation').mockResolvedValue(mockValuation)
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue(mockWorkOrders)
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getOverduePlans').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 500, total_pages: 0 })
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getUpcomingPlans').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 500, total_pages: 0 })
    vi.spyOn(require('@/application/api/preventive_maintenance'), 'getMaintenancePlans').mockResolvedValue(mockPlans)
    render(<ReportsPage />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Reportes y Exportaciones')).toBeInTheDocument() })
    expect(screen.getByText('Exportar CSV')).toBeInTheDocument()
  })
})
