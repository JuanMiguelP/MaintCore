import api from './client'

export interface WorkOrderCreatePayload {
  title: string
  description?: string
  asset_id?: string
  priority?: string
  assigned_to?: string
  scheduled_date?: string
  estimated_hours?: number
  notes?: string
}

export interface WorkOrderUpdatePayload {
  title?: string
  description?: string
  asset_id?: string
  priority?: string
  assigned_to?: string
  scheduled_date?: string
  estimated_hours?: number
  notes?: string
}

export interface ChangeStatusPayload {
  new_status: string
}

export interface AssignTechnicianPayload {
  technician_id: string
}

export interface AddPartPayload {
  part_id: string
  quantity: number
}

export interface WorkOrderResponse {
  id: string
  wo_number: string
  title: string
  description: string | null
  asset_name: string | null
  priority: string
  status: string
  technician_name: string | null
  requester_name: string | null
  estimated_hours: number | null
  actual_hours: number
  scheduled_date: string | null
  start_date: string | null
  completed_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderPartResponse {
  id: string
  work_order_id: string
  part_id: string
  part_number: string | null
  part_name: string | null
  quantity: number
  unit_cost: number
  total_cost: number
}

export interface StatusHistoryEntry {
  id: string
  work_order_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  changer_name: string | null
  changed_at: string
}

export async function createWorkOrder(payload: WorkOrderCreatePayload): Promise<WorkOrderResponse> {
  const { data } = await api.post('/work-orders', payload)
  return data
}

export async function getWorkOrders(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  priority?: string
  asset_id?: string
  assigned_to?: string
}): Promise<PaginatedResponse<WorkOrderResponse>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  if (params?.priority) query.set('priority', params.priority)
  if (params?.asset_id) query.set('asset_id', params.asset_id)
  if (params?.assigned_to) query.set('assigned_to', params.assigned_to)
  const { data } = await api.get('/work-orders', { params: Object.fromEntries(query) })
  return data
}

export async function getWorkOrder(id: string): Promise<WorkOrderResponse> {
  const { data } = await api.get(`/work-orders/${id}`)
  return data
}

export async function updateWorkOrder(id: string, payload: WorkOrderUpdatePayload): Promise<WorkOrderResponse> {
  const { data } = await api.put(`/work-orders/${id}`, payload)
  return data
}

export async function deleteWorkOrder(id: string): Promise<void> {
  await api.delete(`/work-orders/${id}`)
}

export async function changeStatus(id: string, payload: ChangeStatusPayload): Promise<WorkOrderResponse> {
  const { data } = await api.post(`/work-orders/${id}/status`, payload)
  return data
}

export async function assignTechnician(id: string, payload: AssignTechnicianPayload): Promise<WorkOrderResponse> {
  const { data } = await api.post(`/work-orders/${id}/assign`, payload)
  return data
}

export async function addPart(id: string, payload: AddPartPayload): Promise<WorkOrderPartResponse> {
  const { data } = await api.post(`/work-orders/${id}/parts`, payload)
  return data
}

export async function removePart(woId: string, woPartId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/work-orders/${woId}/parts/${woPartId}`)
  return data
}

export async function getStatusHistory(id: string): Promise<StatusHistoryEntry[]> {
  const { data } = await api.get(`/work-orders/${id}/status-history`)
  return data
}

export async function getWorkOrderParts(id: string): Promise<WorkOrderPartResponse[]> {
  const { data } = await api.get(`/work-orders/${id}/parts`)
  return data
}
