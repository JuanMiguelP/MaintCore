import api from './client'

export interface MaintenancePlanCreatePayload {
  name: string
  description?: string
  asset_id: string
  frequency_type: string
  frequency_value?: number
  estimated_hours?: number
  priority?: string
}

export interface MaintenancePlanUpdatePayload {
  name?: string
  description?: string
  asset_id?: string
  frequency_type?: string
  frequency_value?: number
  estimated_hours?: number
  priority?: string
  is_active?: boolean
}

export interface GenerateFromPlanPayload {
  scheduled_date: string
}

export interface MaintenancePlanResponse {
  id: string
  code: string
  name: string
  description: string | null
  asset_name: string | null
  frequency_type: string
  frequency_value: number
  estimated_hours: number | null
  priority: string
  is_active: boolean
  last_generated_at: string | null
  next_due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExecutionResponse {
  id: string
  plan_id: string
  work_order_id: string | null
  scheduled_date: string
  generated_by: string
  status: string
  created_at: string
}

export interface AutoGenerateResponse {
  generated_count: number
  plans: Array<{ plan_id: string; plan_code: string; scheduled_date: string }>
}

export async function createMaintenancePlan(payload: MaintenancePlanCreatePayload): Promise<MaintenancePlanResponse> {
  const { data } = await api.post('/preventive-maintenance', payload)
  return data
}

export async function getMaintenancePlans(params?: {
  page?: number
  page_size?: number
  search?: string
  asset_id?: string
  is_active?: boolean
  frequency_type?: string
}): Promise<PaginatedResponse<MaintenancePlanResponse>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  if (params?.asset_id) query.set('asset_id', params.asset_id)
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active))
  if (params?.frequency_type) query.set('frequency_type', params.frequency_type)
  const { data } = await api.get('/preventive-maintenance', { params: Object.fromEntries(query) })
  return data
}

export async function getMaintenancePlan(id: string): Promise<MaintenancePlanResponse> {
  const { data } = await api.get(`/preventive-maintenance/${id}`)
  return data
}

export async function updateMaintenancePlan(id: string, payload: MaintenancePlanUpdatePayload): Promise<MaintenancePlanResponse> {
  const { data } = await api.put(`/preventive-maintenance/${id}`, payload)
  return data
}

export async function deleteMaintenancePlan(id: string): Promise<void> {
  await api.delete(`/preventive-maintenance/${id}`)
}

export async function generateFromPlan(id: string, payload: GenerateFromPlanPayload): Promise<ExecutionResponse> {
  const { data } = await api.post(`/preventive-maintenance/${id}/generate`, payload)
  return data
}

export async function autoGenerateOverdue(): Promise<AutoGenerateResponse> {
  const { data } = await api.post('/preventive-maintenance/auto-generate-overdue')
  return data
}

export async function getOverduePlans(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenancePlanResponse>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  const { data } = await api.get('/preventive-maintenance/overdue', { params: Object.fromEntries(query) })
  return data
}

export async function getUpcomingPlans(params?: { days_ahead?: number; page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenancePlanResponse>> {
  const query = new URLSearchParams()
  if (params?.days_ahead) query.set('days_ahead', String(params.days_ahead))
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  const { data } = await api.get('/preventive-maintenance/upcoming', { params: Object.fromEntries(query) })
  return data
}
