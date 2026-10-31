import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NotificationSettings from './NotificationSettings'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/notification-settings']}>
        <Routes><Route path="/notification-settings" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockRules = [
  { id: '1', name: 'Alerta stock bajo', event_type: 'LOW_STOCK', enabled: true, recipients: ['admin@example.com'], frequency: 'HOURLY' },
  { id: '2', name: 'OT completada', event_type: 'WORK_ORDER_COMPLETED', enabled: false, recipients: ['tech@example.com'], frequency: null },
]

describe('NotificationSettings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders loading state', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockImplementation(() => new Promise(() => {}))
    render(<NotificationSettings />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders list with rules', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: mockRules, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Alerta stock bajo')).toBeInTheDocument() })
    expect(screen.getByText('Total: 2 reglas')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('No hay reglas de notificación')).toBeInTheDocument() })
  })

  it('opens create form on button click', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Regla')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Regla'))
    await waitFor(() => { expect(screen.getByText('Nueva Regla de Notificación')).toBeInTheDocument() })
  })

  it('opens delete confirmation dialog', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: mockRules, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Alerta stock bajo')).toBeInTheDocument() })
    const deleteButtons = screen.getAllByTitle('Eliminar')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => { expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument() })
    }
  })

  it('displays rule details correctly', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: mockRules, total: 2, page: 1, page_size: 20, total_pages: 1 })
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Alerta stock bajo')).toBeInTheDocument() })
    const viewButtons = screen.getAllByTitle('Ver detalle')
    fireEvent.click(viewButtons[0])
    await waitFor(() => { expect(screen.getByText('Detalle Regla — Alerta stock bajo')).toBeInTheDocument() })
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('calls create mutation when form is submitted', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
    const createSpy = vi.spyOn(require('@/application/api/notifications'), 'createNotificationRule')
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Nueva Regla')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('Nueva Regla'))
    const nameInput = screen.getByLabelText('Nombre')
    fireEvent.change(nameInput, { target: { value: 'New Rule' } })
    const submitButton = screen.getByText('Crear regla')
    fireEvent.click(submitButton)
    await waitFor(() => { expect(createSpy).toHaveBeenCalled() })
  })

  it('calls delete mutation when confirmed', async () => {
    vi.spyOn(require('@/application/api/notifications'), 'getNotificationRules').mockResolvedValue({ items: mockRules, total: 2, page: 1, page_size: 20, total_pages: 1 })
    const deleteSpy = vi.spyOn(require('@/application/api/notifications'), 'deleteNotificationRule')
    render(<NotificationSettings />, { wrapper: createWrapper() })
    await waitFor(() => { expect(screen.getByText('Alerta stock bajo')).toBeInTheDocument() })
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
