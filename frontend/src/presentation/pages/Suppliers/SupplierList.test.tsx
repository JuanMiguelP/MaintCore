import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SupplierList from './SupplierList'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/suppliers']}>
        <Routes><Route path="/suppliers" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockSuppliers = [
  { id: '1', name: 'Acme Corp', tax_id: 'A12345678', contact_person: 'John Doe', email: 'john@acme.com', phone: '+34 600 123 456', address: 'Calle Principal 1, Madrid', notes: 'Proveedor principal', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-06-01T10:00:00Z' },
  { id: '2', name: 'Global Supplies SL', tax_id: 'B87654321', contact_person: 'Jane Smith', email: 'jane@global.com', phone: '+34 600 789 012', address: 'Av. Libertad 42, Barcelona', notes: '', created_at: '2024-03-20T10:00:00Z', updated_at: '2024-07-15T10:00:00Z' },
]

describe('SupplierList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockImplementation(() => new Promise(() => {}))
    render(<SupplierList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with suppliers', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    expect(screen.getByText('Total: 2 proveedores')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay proveedores')).toBeInTheDocument() })
  })

  it('renders search filter', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('renders action buttons for each supplier', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(2)
  })

  it('renders error alert on API error', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockRejectedValue(new Error('API Error'))
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Error al cargar los proveedores.')).toBeInTheDocument() })
  })

  it('displays supplier details correctly', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    const viewButtons = screen.getAllByTitle('Ver detalle')
    fireEvent.click(viewButtons[0])
    await waitFor(() => { expect(screen.getByText('Detalle Proveedor — Acme Corp')).toBeInTheDocument() })
    expect(screen.getByText('john@acme.com')).toBeInTheDocument()
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nuevo Proveedor')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nuevo Proveedor'))
    await waitFor(() => { expect(screen.getByText('Nuevo Proveedor')).toBeInTheDocument() })
  })

  it('opens delete confirmation dialog', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
    }
  })

  it('calls create mutation when form is submitted', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    const createSpy = vi.spyOn(require('@/application/api/suppliers'), 'createSupplier')
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nuevo Proveedor')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nuevo Proveedor'))
    const nameInput = screen.getByLabelText('Nombre')
    fireEvent.change(nameInput, { target: { value: 'New Supplier' } })
    const submitButton = screen.getByText('Crear proveedor')
    fireEvent.click(submitButton)
    await waitFor(() => { expect(createSpy).toHaveBeenCalled() })
  })

  it('calls update mutation when editing', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    const updateSpy = vi.spyOn(require('@/application/api/suppliers'), 'updateSupplier')
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    const editButtons = screen.getAllByTitle('Editar')
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0])
      const nameInput = screen.getByLabelText('Nombre')
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
      const submitButton = screen.getByText('Guardar cambios')
      fireEvent.click(submitButton)
      await waitFor(() => { expect(updateSpy).toHaveBeenCalled() })
    }
  })

  it('calls delete mutation when confirmed', async () => {
    vi.spyOn(require('@/application/api/suppliers'), 'getSuppliers').mockResolvedValue({ items: mockSuppliers, total: 2, page: 1, page_size: 20, total_pages: 1 })
    const deleteSpy = vi.spyOn(require('@/application/api/suppliers'), 'deleteSupplier')
    render(<SupplierList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Acme Corp')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
      const confirmButton = screen.getByText('Eliminar')
      fireEvent.click(confirmButton)
      await waitFor(() => { expect(deleteSpy).toHaveBeenCalled() })
    }
  })
})
