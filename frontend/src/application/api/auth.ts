import api from './client'

export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await api.post('/auth/login', payload)
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  return data
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  return data
}

export async function createUser(payload: { username: string; email: string; password: string; full_name?: string }): Promise<void> {
  await api.post('/auth/users', payload)
}

export async function getUsers(page = 1, pageSize = 20, search?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (search) params.set('search', search)
  const { data } = await api.get('/auth/users', { params })
  return data
}
