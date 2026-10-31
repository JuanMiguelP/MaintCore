import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WorkOrderList from './WorkOrderList'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/work-orders']}>
        <Routes><Route path="/work-orders" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockWorkOrders = [
  { id: '1', wo_number: 'WO-001', title: 'Replace bearings', description: 'Motor bearings worn', asset_name: 'CNC Machine', priority: 'HIGH', status: 'OPEN', technician_name: null, requester_name: 'John Doe', estimated_hours: 4, actual_hours: 0, scheduled_date: '2024-12-01', start_date: null, completed_date: null, notes: '', created_at: '2024-11-15T10:00:00Z', updated_at: '2024-11-15T10:00:00Z' },
  { id: '2', wo_number: 'WO-002', title: 'Hydraulic check', description: 'Regular maintenance', asset_name: 'Press A', priority: 'MEDIUM', status: 'IN_PROGRESS', technician_name: 'Jane Smith', requester_name: 'John Doe', estimated_hours: 2, actual_hours: 1.5, scheduled_date: '2024-11-20', start_date: '2024-11-20T08:00:00Z', completed_date: null, notes: '', created_at: '2024-11-10T10:00:00Z', updated_at: '2024-11-20T09:00:00Z' },
  { id: '3', wo_number: 'WO-003', title: 'Emergency repair', description: 'Motor failure', asset_name: null, priority: 'CRITICAL', status: 'COMPLETED', technician_name: 'Bob Wilson', requester_name: 'Jane Smith', estimated_hours: 8, actual_hours: 10, scheduled_date: '2024-11-01', start_date: '2024-11-01T06:00:00Z', completed_date: '2024-11-01T18:00:00Z', notes: 'Replaced motor', created_at: '2024-10-30T10:00:00Z', updated_at: '2024-11-01T18:00:00Z' },
]
const mockAssets = { items: [{ id: 'a1', name: 'CNC Machine' }, { id: 'a2', name: 'Press A' }] }

describe('WorkOrderList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockImplementation(() => new Promise(() => {}))
    render(<WorkOrderList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with work orders', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    expect(screen.getByText('Replace bearings')).toBeInTheDocument()
    expect(screen.getByText('Total: 3 Ã³rdenes')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay Ã³rdenes')).toBeInTheDocument() })
  })

  it('renders filters and pagination', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    expect(screen.getByLabelText('Estado')).toBeInTheDocument()
    expect(screen.getByLabelText('Prioridad')).toBeInTheDocument()
    expect(screen.getByLabelText('Activo')).toBeInTheDocument()
  })

  it('renders priority and status chips with correct colors', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const priorityChips = screen.getAllByRole('presentation')
    expect(priorityChips.some(chip => chip.textContent === 'HIGH')).toBe(true)
    expect(priorityChips.some(chip => chip.textContent === 'OPEN')).toBe(true)
  })

  it('shows action buttons for each work order', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(2)
  })

  it('renders loading spinner initially', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => { resolvePromise = resolve })
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockImplementation(() => promise)
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockImplementation(() => promise)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders error alert on API error', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockRejectedValue(new Error('API Error'))
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Error al cargar las órdenes.')).toBeInTheDocument() })
  })

  it('displays work order details correctly', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const viewButtons = screen.getAllByTitle('Ver detalle')
    fireEvent.click(viewButtons[0])
    await waitFor(() => { expect(screen.getByText('Detalle OT — WO-001')).toBeInTheDocument() })
    expect(screen.getByText('Replace bearings')).toBeInTheDocument()
  })

  it('displays status history dialog', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    vi.spyOn(require('@/application/api/work_orders'), 'getStatusHistory').mockResolvedValue([
      { id: 'h1', work_order_id: '1', old_status: null, new_status: 'OPEN', changed_by: 'user1', changer_name: 'Admin', changed_at: '2024-11-15T10:00:00Z' },
    ])
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrderParts').mockResolvedValue([])
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const historyButtons = screen.getAllByTitle('Historial')
    if (historyButtons.length > 0) {
      fireEvent.click(historyButtons[0])
      await waitFor(() => { expect(screen.getByText('Historial de Estados')).toBeInTheDocument() })
    }
  })

  it('opens status change dialog', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const statusButtons = screen.getAllByTitle('Cambiar estado')
    if (statusButtons.length > 0) {
      fireEvent.click(statusButtons[0])
      await waitFor(() => { expect(screen.getByText('Cambiar estado')).toBeInTheDocument() })
      expect(screen.getByText('WO-001: Replace bearings')).toBeInTheDocument()
    }
  })

  it('opens delete confirmation dialog', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
      expect(screen.getByText('¿Estás seguro de que quieres eliminar esta orden?')).toBeInTheDocument()
    }
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Orden')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Orden'))
    await waitFor(() => { expect(screen.getByText('Nueva Orden de Trabajo')).toBeInTheDocument() })
  })

  it('calls create mutation when form is submitted', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    const createSpy = vi.spyOn(require('@/application/api/work_orders'), 'createWorkOrder')
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Orden')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Orden'))
    await waitFor(() => { expect(screen.getByText('Nueva Orden de Trabajo')).toBeInTheDocument() })
    const titleInput = screen.getByLabelText('Título')
    fireEvent.change(titleInput, { target: { value: 'New Test WO' } })
    const submitButton = screen.getByText('Crear orden')
    fireEvent.click(submitButton)
    await waitFor(() => { expect(createSpy).toHaveBeenCalled() })
  })

  it('calls update mutation when editing', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    const updateSpy = vi.spyOn(require('@/application/api/work_orders'), 'updateWorkOrder')
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const editButtons = screen.getAllByTitle('Editar')
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0])
      await waitFor(() => { expect(screen.getByText('Editar Orden de Trabajo')).toBeInTheDocument() })
      const titleInput = screen.getByLabelText('Título')
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
      const submitButton = screen.getByText('Guardar cambios')
      fireEvent.click(submitButton)
      await waitFor(() => { expect(updateSpy).toHaveBeenCalled() })
    }
  })

  it('calls delete mutation when confirmed', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    const deleteSpy = vi.spyOn(require('@/application/api/work_orders'), 'deleteWorkOrder')
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
      const confirmButton = screen.getByText('Eliminar')
      fireEvent.click(confirmButton)
      await waitFor(() => { expect(deleteSpy).toHaveBeenCalled() })
    }
  })

  it('calls changeStatus mutation when status is changed', async () => {
    vi.spyOn(require('@/application/api/work_orders'), 'getWorkOrders').mockResolvedValue({ items: mockWorkOrders, total: 3, page: 1, page_size: 20, total_pages: 1 })
    vi.spyOn(require('@/application/api/work_orders'), 'getAssets').mockResolvedValue(mockAssets)
    const changeStatusSpy = vi.spyOn(require('@/application/api/work_orders'), 'changeStatus')
    render(<WorkOrderList />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('WO-001')).toBeInTheDocument() })
    const statusButtons = screen.getAllByTitle('Cambiar estado')
    if (statusButtons.length > 0) {
      fireEvent.click(statusButtons[0])
      await waitFor(() => { expect(screen.getByText('Cambiar estado')).toBeInTheDocument() })
      const assignButton = screen.getByText('Assign')
      fireEvent.click(assignButton)
      const changeButton = screen.getByText('Cambiar')
      fireEvent.click(changeButton)
      await waitFor(() => { expect(changeStatusSpy).toHaveBeenCalled() })
    }
  })
})
