import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth'

interface AuthState {
  access_token: string | null
  refresh_token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (access_token: string, refresh_token: string, user?: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      user: null,
      isAuthenticated: false,

      login: (access_token, refresh_token, user) =>
        set({ access_token, refresh_token, user: user ?? null, isAuthenticated: true }),

      logout: () =>
        set({ access_token: null, refresh_token: null, user: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
