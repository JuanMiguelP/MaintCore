import api from './client'

export interface SupplierCreatePayload {
  name: string
  tax_id?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface SupplierUpdatePayload {
  name?: string
  tax_id?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface SupplierResponse {
  id: string
  name: string
  tax_id: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function createSupplier(payload: SupplierCreatePayload): Promise<SupplierResponse> {
  const { data } = await api.post('/suppliers', payload)
  return data
}

export async function getSuppliers(params?: { page?: number; page_size?: number; search?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  const { data } = await api.get('/suppliers', { params: Object.fromEntries(query) })
  return data
}

export async function updateSupplier(id: string, payload: SupplierUpdatePayload): Promise<SupplierResponse> {
  const { data } = await api.put(`/suppliers/${id}`, payload)
  return data
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`)
}
