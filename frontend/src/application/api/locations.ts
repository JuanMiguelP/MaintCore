import api from './client'

export interface LocationCreatePayload {
  name: string
  code?: string
  parent_id?: string
  address?: string
}

export interface LocationUpdatePayload {
  name?: string
  code?: string
  parent_id?: string
  address?: string
  is_active?: boolean
}

export interface LocationResponse {
  id: string
  name: string
  code: string | null
  parent_id: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

export async function createLocation(payload: LocationCreatePayload): Promise<LocationResponse> {
  const { data } = await api.post('/locations', payload)
  return data
}

export async function getLocations(params?: { page?: number; page_size?: number; search?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  const { data } = await api.get('/locations', { params: Object.fromEntries(query) })
  return data
}

export async function updateLocation(id: string, payload: LocationUpdatePayload): Promise<LocationResponse> {
  const { data } = await api.put(`/locations/${id}`, payload)
  return data
}

export async function deleteLocation(id: string): Promise<void> {
  await api.delete(`/locations/${id}`)
}
