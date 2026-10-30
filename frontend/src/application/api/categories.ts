import api from './client'

export interface CategoryCreatePayload {
  name: string
  description?: string
}

export interface CategoryUpdatePayload {
  name?: string
  description?: string
}

export interface CategoryResponse {
  id: string
  name: string
  description: string | null
  created_at: string
}

export async function createCategory(payload: CategoryCreatePayload): Promise<CategoryResponse> {
  const { data } = await api.post('/categories', payload)
  return data
}

export async function getCategories(params?: { page?: number; page_size?: number; search?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  const { data } = await api.get('/categories', { params: Object.fromEntries(query) })
  return data
}

export async function updateCategory(id: string, payload: CategoryUpdatePayload): Promise<CategoryResponse> {
  const { data } = await api.put(`/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`)
}
