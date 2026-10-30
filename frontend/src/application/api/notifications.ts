import api from './client'

export interface NotificationRuleCreatePayload {
  name: string
  event_type: string
  enabled?: boolean
  recipients: string[]
  frequency?: string
}

export interface NotificationRuleUpdatePayload {
  name?: string
  event_type?: string
  enabled?: boolean
  recipients?: string[]
  frequency?: string
}

export interface NotificationRuleResponse {
  id: string
  name: string
  event_type: string
  enabled: boolean
  recipients: string[]
  frequency: string
}

export async function createNotificationRule(payload: NotificationRuleCreatePayload): Promise<NotificationRuleResponse> {
  const { data } = await api.post('/notifications', payload)
  return data
}

export async function getNotificationRules(params?: { page?: number; page_size?: number; event_type?: string }): Promise<PaginatedResponse<NotificationRuleResponse>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.event_type) query.set('event_type', params.event_type)
  const { data } = await api.get('/notifications', { params: Object.fromEntries(query) })
  return data
}

export async function getNotificationRule(id: string): Promise<NotificationRuleResponse> {
  const { data } = await api.get(`/notifications/${id}`)
  return data
}

export async function updateNotificationRule(id: string, payload: NotificationRuleUpdatePayload): Promise<NotificationRuleResponse> {
  const { data } = await api.put(`/notifications/${id}`, payload)
  return data
}

export async function deleteNotificationRule(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}
