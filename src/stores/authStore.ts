import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
  checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: null,

      login: (username: string, password: string) => {
        // Store credentials in localStorage for API calls
        const encoded = btoa(`${username}:${password}`)
        localStorage.setItem('pulp_auth', encoded)
        set({ isAuthenticated: true, username })
        return true
      },

      logout: () => {
        localStorage.removeItem('pulp_auth')
        set({ isAuthenticated: false, username: null })
      },

      checkAuth: () => {
        const hasAuth = localStorage.getItem('pulp_auth') !== null
        if (hasAuth && !get().isAuthenticated) {
          set({ isAuthenticated: true })
        }
        return hasAuth
      },
    }),
    {
      name: 'pulp-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, username: state.username }),
    }
  )
)
