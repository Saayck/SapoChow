import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/api'
import type { LoginRequest } from '../types/auth'

export function useAuth() {
  const { login, logout, isAuthenticated, user, access_token } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return { handleLogout, isAuthenticated, user, access_token }
}

export function useLogin() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data: LoginRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const tokens = await authService.login(data)
      login(tokens.access_token, tokens.refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return { handleLogin, isLoading, error }
}
