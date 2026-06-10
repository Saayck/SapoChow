import api from './api'
import type { LoginRequest, TokenResponse, User } from '../types/auth'

export const authService = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const res = await api.post<TokenResponse>('/auth/login', data)
    return res.data
  },

  register: async (data: { full_name: string; email: string; password: string }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data)
    return res.data
  },

  refresh: async (refresh_token: string): Promise<TokenResponse> => {
    const res = await api.post<TokenResponse>('/auth/refresh', { refresh_token })
    return res.data
  },
}
