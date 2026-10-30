import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PartList from './PartList'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes><Route path="/inventory" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockParts = [
  { id: '1', part_number: 'PART-001', name: 'Bearing SKF 6205', description: 'Rodamiento de bolas', supplier_name: 'SKF', unit_cost: 15.5, minimum_stock: 10, current_stock: 25, is_low_stock: false, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
  { id: '2', part_number: 'PART-002', name: 'Oil Filter', description: 'Filtro de aceite', supplier_name: 'Mann', unit_cost: 8.0, minimum_stock: 20, current_stock: 5, is_low_stock: true, created_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' },
  { id: '3', part_number: 'PART-003', name: 'Hydraulic Pump', description: 'Bomba hidr\u00e1ulica', supplier_name: null, unit_cost: 250.0, minimum_stock: 2, current_stock: 0, is_low_stock: true, created_at: '2024-01-17T10:00:00Z', updated_at: '2024-01-17T10:00:00Z' },
]
const mockSuppliers = { items: [{ id: 's1', name: 'SKF' }, { id: 's2', name: 'Mann' }] }

describe('PartList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockImplementation(() => new Promise(() => {}))
    render(<PartList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with parts', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: mockParts, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('PART-001')).toBeInTheDocument() })
    expect(screen.getByText('Bearing SKF 6205')).toBeInTheDocument()
    expect(screen.getByText('Total: 3 repuestos')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay repuestos')).toBeInTheDocument() })
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nuevo Repuesto')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nuevo Repuesto'))
    await waitFor(() => { expect(screen.getByText('Nuevo Repuesto')).toBeInTheDocument() })
  })

  it('shows stock status chips', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: mockParts, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('PART-001')).toBeInTheDocument() })
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Stock bajo')).toBeInTheDocument()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })

  it('shows action buttons per row', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: mockParts, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('PART-001')).toBeInTheDocument() })
    const row = screen.getByText('PART-001').closest('tr')
    if (row) {
      expect(within(row).getByTitle('Editar')).toBeInTheDocument()
      expect(within(row).getByTitle('Historial')).toBeInTheDocument()
      expect(within(row).getByTitle('Eliminar')).toBeInTheDocument()
    }
  })

  it('filters by search', async () => {
    const mockFn = vi.fn().mockResolvedValue({ items: [mockParts[0]], total: 1, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockImplementation(mockFn)
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('PART-001')).toBeInTheDocument() })
    const searchInput = screen.getByPlaceholderText('Buscar por part number o nombre...')
    fireEvent.change(searchInput, { target: { value: 'Bearing' } })
    await waitFor(() => { expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ search: 'Bearing' })) })
  })

  it('toggles low stock filter', async () => {
    const mockFn = vi.fn().mockResolvedValue({ items: [mockParts[1]], total: 1, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockImplementation(mockFn)
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('PART-001')).toBeInTheDocument() })
    const lowStockBtn = screen.getByText('Solo low stock')
    fireEvent.click(lowStockBtn)
    await waitFor(() => { expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ low_stock: true })) })
  })

  it('renders pagination', async () => {
    vi.spyOn(require('@/application/api/inventory'), 'getParts').mockResolvedValue({ items: mockParts, total: 50, page: 1, page_size: 20, total_pages: 3 })
    vi.spyOn(require('@/application/api/inventory'), 'getSuppliers').mockResolvedValue(mockSuppliers)
    render(<PartList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Total: 50 repuestos')).toBeInTheDocument() })
    expect(screen.getByText('P\u00e1gina 1 de 3')).toBeInTheDocument()
  })
})
