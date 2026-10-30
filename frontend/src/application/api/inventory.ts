import api from './client'

export interface PartCreatePayload {
  part_number: string
  name: string
  description?: string
  manufacturer?: string
  supplier_id?: string
  unit_cost?: number
  minimum_stock?: number
  current_stock?: number
  location?: string
  notes?: string
}

export interface PartUpdatePayload {
  part_number?: string
  name?: string
  description?: string
  manufacturer?: string
  supplier_id?: string
  unit_cost?: number
  minimum_stock?: number
  current_stock?: number
  location?: string
  notes?: string
}

export interface PartResponse {
  id: string
  part_number: string
  name: string
  description: string | null
  manufacturer: string | null
  supplier_name: string | null
  unit_cost: number
  minimum_stock: number
  current_stock: number
  location: string | null
  notes: string | null
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface StockMovementCreatePayload {
  part_id: string
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason?: string
}

export interface StockMovementResponse {
  id: string
  part_number: string
  part_name: string
  movement_type: string
  quantity: number
  reason: string | null
  performed_by: string | null
  performed_at: string
}

export async function createPart(payload: PartCreatePayload): Promise<PartResponse> {
  const { data } = await api.post('/inventory/parts', payload)
  return data
}

export async function getParts(params?: { page?: number; page_size?: number; search?: string; supplier_id?: string; low_stock?: boolean }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  if (params?.supplier_id) query.set('supplier_id', params.supplier_id)
  if (params?.low_stock) query.set('low_stock', 'true')
  const { data } = await api.get('/inventory/parts', { params: Object.fromEntries(query) })
  return data
}

export async function getLowStockParts() {
  const { data } = await api.get('/inventory/parts/low-stock')
  return data
}

export async function getInventoryValuation() {
  const { data } = await api.get('/inventory/valuation')
  return data
}

export async function updatePart(id: string, payload: PartUpdatePayload): Promise<PartResponse> {
  const { data } = await api.put(`/inventory/parts/${id}`, payload)
  return data
}

export async function deletePart(id: string): Promise<void> {
  await api.delete(`/inventory/parts/${id}`)
}

export async function createStockMovement(payload: StockMovementCreatePayload): Promise<StockMovementResponse> {
  const { data } = await api.post('/inventory/movements', payload)
  return data
}

export async function getStockMovements(params?: { page?: number; page_size?: number; part_id?: string; movement_type?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.part_id) query.set('part_id', params.part_id)
  if (params?.movement_type) query.set('movement_type', params.movement_type)
  const { data } = await api.get('/inventory/movements', { params: Object.fromEntries(query) })
  return data
}

export interface PartChangeLogEntry {
  id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  performed_by: string | null
  created_at: string
}

export interface PartChangeHistoryResponse {
  items: PartChangeLogEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function getPartChangeHistory(partId: string, params?: { page?: number; page_size?: number }): Promise<PartChangeHistoryResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  const { data } = await api.get(`/inventory/parts/${partId}/change-history`, { params: Object.fromEntries(query) })
  return data
}
