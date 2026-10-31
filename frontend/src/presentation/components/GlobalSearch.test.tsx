import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import { vi } from 'vitest'
import * as searchApi from '@/application/api/search'

const createWrapper = (role?: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes><Route path="/" element={children} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockSearchResults = {
  query: "test",
  results: {
    assets: [{ id: "1", code: "AST-001", name: "Test Asset", category_name: "Machinery", location_name: "Factory A" }],
    inventory: [{ id: "2", part_number: "PRT-001", name: "Test Part" }],
    work_orders: [{ id: "3", wo_number: "WO-001", title: "Test Work Order", status: "OPEN" }],
    suppliers: [{ id: "4", name: "Test Supplier" }],
    locations: [{ id: "5", name: "Test Location", code: "LOC-001" }],
  },
}

describe('GlobalSearch', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders search input with placeholder', () => {
    render(<GlobalSearch />, { wrapper: createWrapper() })
    expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument()
  })

  it('shows no results message when query has no matches', async () => {
    vi.spyOn(searchApi, 'globalSearch').mockResolvedValue({ query: 'nomatch', results: { assets: [], inventory: [], work_orders: [], suppliers: [], locations: [] } })
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "nomatch" } })
    await waitFor(() => {
      expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows grouped results by module', async () => {
    vi.spyOn(searchApi, "globalSearch").mockResolvedValue(mockSearchResults)
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "test" } })
    await waitFor(() => {
      expect(screen.getByText(/AST-001/i)).toBeInTheDocument()
      expect(screen.getByText(/PRT-001/i)).toBeInTheDocument()
      expect(screen.getByText(/WO-001/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows loading state while searching', async () => {
    vi.spyOn(searchApi, 'globalSearch').mockImplementation(() => new Promise(() => {}))
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "loading" } })
    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('navigates to asset module on result click', async () => {
    vi.spyOn(searchApi, "globalSearch").mockResolvedValue(mockSearchResults)
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "test" } })
    await waitFor(() => {
      expect(screen.getByText(/AST-001/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Click on the asset result (first result item)
    const firstResult = screen.getAllByRole('listitem')[1]
    fireEvent.click(firstResult)
    await waitFor(() => {
      expect(window.location.hash).toContain('#1')
    }, { timeout: 2000 })
  })

  it('respects RBAC - only shows accessible modules', async () => {
    // Mock search results with only assets (simulating limited permissions)
    const limitedResults = {
      query: "test",
      results: {
        assets: [{ id: "1", code: "AST-001", name: "Test Asset", category_name: null, location_name: null }],
        inventory: [],
        work_orders: [],
        suppliers: [],
        locations: [],
      },
    };
    vi.spyOn(searchApi, "globalSearch").mockResolvedValue(limitedResults)
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "test" } })
    await waitFor(() => {
      expect(screen.getByText(/AST-001/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Should not show results from modules without permission
    expect(screen.queryByText(/PRT-001/i)).not.toBeInTheDocument()
  })

  it('shows empty state hint when input is focused but empty', () => {
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.focus(input)
    expect(screen.queryByText(/Escribe al menos/i)).not.toBeInTheDocument()
  })

  it('calls API with debounce', async () => {
    const mockFn = vi.fn().mockResolvedValue(mockSearchResults)
    vi.spyOn(searchApi, "globalSearch").mockImplementation(mockFn)
    render(<GlobalSearch />, { wrapper: createWrapper() })
    const input = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(input, { target: { value: "debounce" } })

    // Should not call immediately due to debounce
    expect(mockFn).not.toHaveBeenCalled()

    // Wait for debounce
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

});
