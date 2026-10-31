import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LocationList from './LocationList'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/locations']}>
        <Routes><Route path="/locations" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockLocations = [
  { id: '1', name: 'Almacén Central', code: 'ALM-001', parent_id: null, address: 'Calle Principal 1, Madrid', is_active: true, created_at: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Nave Norte', code: 'NAV-001', parent_id: '1', address: 'Polígono Industrial Norte', is_active: true, created_at: '2024-03-20T10:00:00Z' },
]

describe('LocationList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockImplementation(() => new Promise(() => {}))
    render(<LocationList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with locations', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
    expect(screen.getByText('Total: 2 ubicaciones')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay ubicaciones')).toBeInTheDocument() })
  })

  it('renders search filter', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('renders action buttons for each location', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(2)
  })

  it('renders error alert on API error', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockRejectedValue(new Error('API Error'))
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Error al cargar las ubicaciones.')).toBeInTheDocument() })
  })

  it('displays location details correctly', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
    const viewButtons = screen.getAllByTitle('Ver detalle')
    fireEvent.click(viewButtons[0])
    await waitFor(() => { expect(screen.getByText('Detalle Ubicación — Almacén Central')).toBeInTheDocument() })
    expect(screen.getByText('ALM-001')).toBeInTheDocument()
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Ubicación'))
    await waitFor(() => { expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument() })
  })

  it('opens delete confirmation dialog', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
    }
  })

  it('calls create mutation when form is submitted', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    const createSpy = vi.spyOn(require('@/application/api/locations'), 'createLocation')
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Ubicación'))
    const nameInput = screen.getByLabelText('Nombre')
    fireEvent.change(nameInput, { target: { value: 'New Location' } })
    const submitButton = screen.getByText('Crear ubicación')
    fireEvent.click(submitButton)
    await waitFor(() => { expect(createSpy).toHaveBeenCalled() })
  })

  it('calls update mutation when editing', async () => {
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    const updateSpy = vi.spyOn(require('@/application/api/locations'), 'updateLocation')
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
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
    vi.spyOn(require('@/application/api/locations'), 'getLocations').mockResolvedValue({ items: mockLocations, total: 2, page: 1, page_size: 20, total_pages: 1 })
    const deleteSpy = vi.spyOn(require('@/application/api/locations'), 'deleteLocation')
    render(<LocationList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Almacén Central')).toBeInTheDocument() })
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
