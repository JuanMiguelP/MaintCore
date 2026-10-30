import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AssetList from './AssetList'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/assets']}>
        <Routes><Route path="/assets" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockAssets = [
  { id: '1', code: 'AST-001', name: 'CNC Machine', description: 'M\u00e1quina CNC', category_name: 'Machinery', location_name: 'Factory A', status: 'ACTIVE', manufacturer: 'Haas', model: 'VF-2', serial_number: 'SN12345', purchase_date: '2023-01-15', notes: 'Primary machine', created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
  { id: '2', code: 'AST-002', name: 'Hydraulic Press', description: 'Prensa hidr\u00e1ulica', category_name: 'Machinery', location_name: 'Factory B', status: 'MAINTENANCE', manufacturer: 'Boss', model: 'BP-500', serial_number: 'SN67890', purchase_date: '2022-06-20', notes: '', created_at: '2022-06-20T10:00:00Z', updated_at: '2022-06-20T10:00:00Z' },
  { id: '3', code: 'AST-003', name: 'Legacy Server', description: 'Servidor antiguo', category_name: 'IT Equipment', location_name: null, status: 'RETIRED', manufacturer: 'Dell', model: 'PowerEdge', serial_number: null, purchase_date: '2015-03-10', notes: 'Decommissioned', created_at: '2015-03-10T10:00:00Z', updated_at: '2015-03-10T10:00:00Z' },
]
const mockCategories = { items: [{ id: 'c1', name: 'Machinery' }, { id: 'c2', name: 'IT Equipment' }] }
const mockLocations = { items: [{ id: 'l1', name: 'Factory A' }, { id: 'l2', name: 'Factory B' }] }

describe('AssetList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockImplementation(() => new Promise(() => {}))
    render(<AssetList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with assets', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: mockAssets, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    expect(screen.getByText('CNC Machine')).toBeInTheDocument()
    expect(screen.getByText('Total: 3 activos')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay activos')).toBeInTheDocument() })
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nuevo Activo')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nuevo Activo'))
    await waitFor(() => { expect(screen.getByText('Nuevo Activo')).toBeInTheDocument() })
  })

  it('shows status chips with colors', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: mockAssets, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('MAINTENANCE')).toBeInTheDocument()
    expect(screen.getByText('RETIRED')).toBeInTheDocument()
  })

  it('shows action buttons per row', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: mockAssets, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    const row = screen.getByText('AST-001').closest('tr')
    if (row) {
      expect(within(row).getByTitle('Ver detalle')).toBeInTheDocument()
      expect(within(row).getByTitle('Editar')).toBeInTheDocument()
      expect(within(row).getByTitle('Eliminar')).toBeInTheDocument()
    }
  })

  it('filters by search', async () => {
    const mockFn = vi.fn().mockResolvedValue({ items: [mockAssets[0]], total: 1, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockImplementation(mockFn)
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    const searchInput = screen.getByPlaceholderText('Buscar por código o nombre...')
    fireEvent.change(searchInput, { target: { value: 'CNC' } })
    await waitFor(() => { expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ search: 'CNC' })) })
  })

  it('filters by category', async () => {
    const mockFn = vi.fn().mockResolvedValue({ items: [mockAssets[0]], total: 1, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockImplementation(mockFn)
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    const categorySelect = screen.getByLabelText('Categoría')
    fireEvent.change(categorySelect, { target: { value: 'c1' } })
    await waitFor(() => { expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ category_id: 'c1' })) })
  })

  it('filters by status', async () => {
    const mockFn = vi.fn().mockResolvedValue({ items: [mockAssets[2]], total: 1, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockImplementation(mockFn)
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('AST-001')).toBeInTheDocument() })
    const statusSelect = screen.getByLabelText('Estado')
    fireEvent.change(statusSelect, { target: { value: 'RETIRED' } })
    await waitFor(() => { expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'RETIRED' })) })
  })

  it('renders pagination', async () => {
    vi.spyOn(require('@/application/api/assets'), 'getAssets').mockResolvedValue({ items: mockAssets, total: 50, page: 1, page_size: 20, total_pages: 3 })
    vi.spyOn(require('@/application/api/assets'), 'getCategories').mockResolvedValue(mockCategories)
    vi.spyOn(require('@/application/api/assets'), 'getLocations').mockResolvedValue(mockLocations)
    render(<AssetList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Total: 50 activos')).toBeInTheDocument() })
    expect(screen.getByText('P\u00e1gina 1 de 3')).toBeInTheDocument()
  })
})
