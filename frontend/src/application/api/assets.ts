import api from './client'

export interface AssetCreatePayload {
  code: string
  name: string
  description?: string
  category_id: string
  location_id?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  status?: string
  notes?: string
}

export interface AssetUpdatePayload {
  name?: string
  description?: string
  category_id?: string
  location_id?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  status?: string
  notes?: string
}

export interface AssetResponse {
  id: string
  code: string
  name: string
  description: string | null
  category_name: string | null
  location_name: string | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function createAsset(payload: AssetCreatePayload): Promise<AssetResponse> {
  const { data } = await api.post('/assets', payload)
  return data
}

export async function getAssets(params?: { page?: number; page_size?: number; search?: string; category_id?: string; location_id?: string; status?: string }): Promise<PaginatedResponse<AssetResponse>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  if (params?.category_id) query.set('category_id', params.category_id)
  if (params?.location_id) query.set('location_id', params.location_id)
  if (params?.status) query.set('status', params.status)
  const { data } = await api.get('/assets', { params: Object.fromEntries(query) })
  return data
}

export async function getAsset(id: string): Promise<AssetResponse> {
  const { data } = await api.get(`/assets/${id}`)
  return data
}

export async function updateAsset(id: string, payload: AssetUpdatePayload): Promise<AssetResponse> {
  const { data } = await api.put(`/assets/${id}`, payload)
  return data
}

export async function deleteAsset(id: string): Promise<void> {
  await api.delete(`/assets/${id}`)
}
