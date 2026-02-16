import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  // Get a fresh reference to localStorage mock from setup
  const localStorageMock = window.localStorage

  beforeEach(() => {
    // Clear localStorage and reset store state before each test
    localStorageMock.clear()
    // Reset the store to initial state by calling logout
    useAuthStore.getState().logout()
    // Clear any mock call history
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should have isAuthenticated as false by default', () => {
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should have username as null by default', () => {
      const { username } = useAuthStore.getState()
      expect(username).toBeNull()
    })
  })

  describe('login', () => {
    it('should set isAuthenticated to true when login is called', () => {
      const { login } = useAuthStore.getState()

      const result = login('testuser', 'testpassword')

      expect(result).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should set username when login is called', () => {
      const { login } = useAuthStore.getState()

      login('testuser', 'testpassword')

      expect(useAuthStore.getState().username).toBe('testuser')
    })

    it('should store base64 encoded credentials in localStorage', () => {
      const { login } = useAuthStore.getState()

      login('testuser', 'testpassword')

      const expectedEncoded = btoa('testuser:testpassword')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pulp_auth', expectedEncoded)
      expect(localStorageMock.getItem('pulp_auth')).toBe(expectedEncoded)
    })

    it('should encode credentials correctly with special characters', () => {
      const { login } = useAuthStore.getState()

      login('user@domain.com', 'p@ss:word')

      const expectedEncoded = btoa('user@domain.com:p@ss:word')
      expect(localStorageMock.getItem('pulp_auth')).toBe(expectedEncoded)
    })

    it('should return true on successful login', () => {
      const { login } = useAuthStore.getState()

      const result = login('anyuser', 'anypassword')

      expect(result).toBe(true)
    })

    it('should update state from unauthenticated to authenticated', () => {
      // Initial state should be unauthenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().username).toBeNull()

      const { login } = useAuthStore.getState()
      login('newuser', 'password')

      // State should now be authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().username).toBe('newuser')
    })
  })

  describe('logout', () => {
    it('should set isAuthenticated to false when logout is called', () => {
      // First login
      useAuthStore.getState().login('testuser', 'testpassword')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Then logout
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should set username to null when logout is called', () => {
      // First login
      useAuthStore.getState().login('testuser', 'testpassword')
      expect(useAuthStore.getState().username).toBe('testuser')

      // Then logout
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().username).toBeNull()
    })

    it('should remove credentials from localStorage', () => {
      // First login to set credentials
      useAuthStore.getState().login('testuser', 'testpassword')
      expect(localStorageMock.getItem('pulp_auth')).not.toBeNull()

      // Clear mock call history
      vi.clearAllMocks()

      // Then logout
      useAuthStore.getState().logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pulp_auth')
    })

    it('should be safe to call logout when already logged out', () => {
      // Ensure starting from logged out state
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // Calling logout should not throw
      expect(() => useAuthStore.getState().logout()).not.toThrow()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should return false when no credentials in localStorage', () => {
      localStorageMock.clear()

      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(false)
    })

    it('should return true when credentials exist in localStorage', () => {
      // Set credentials directly in localStorage
      const encoded = btoa('testuser:testpassword')
      localStorageMock.setItem('pulp_auth', encoded)

      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
    })

    it('should set isAuthenticated to true if credentials exist but state is unauthenticated', () => {
      // Set credentials directly in localStorage (simulating page reload)
      const encoded = btoa('testuser:testpassword')
      localStorageMock.setItem('pulp_auth', encoded)

      // State should be unauthenticated initially
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().checkAuth()

      // State should now be authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should not change isAuthenticated if already authenticated', () => {
      // Login first
      useAuthStore.getState().login('testuser', 'testpassword')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Clear mock call history
      vi.clearAllMocks()

      // checkAuth should keep authenticated state
      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should return false after logout', () => {
      // Login first
      useAuthStore.getState().login('testuser', 'testpassword')

      // Logout
      useAuthStore.getState().logout()

      // checkAuth should return false
      const result = useAuthStore.getState().checkAuth()
      expect(result).toBe(false)
    })
  })

  describe('Zustand persist middleware', () => {
    it('should persist isAuthenticated state to localStorage under pulp-auth key', () => {
      const { login } = useAuthStore.getState()
      login('persistuser', 'password')

      // The persist middleware stores state as JSON
      const storedValue = localStorageMock.getItem('pulp-auth')
      expect(storedValue).not.toBeNull()

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        expect(parsed.state.isAuthenticated).toBe(true)
        expect(parsed.state.username).toBe('persistuser')
      }
    })

    it('should only persist isAuthenticated and username (not functions)', () => {
      const { login } = useAuthStore.getState()
      login('persistuser', 'password')

      const storedValue = localStorageMock.getItem('pulp-auth')
      expect(storedValue).not.toBeNull()

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        // Should only have state properties, not functions
        expect(parsed.state).toHaveProperty('isAuthenticated')
        expect(parsed.state).toHaveProperty('username')
        expect(parsed.state).not.toHaveProperty('login')
        expect(parsed.state).not.toHaveProperty('logout')
        expect(parsed.state).not.toHaveProperty('checkAuth')
      }
    })

    it('should persist version number for migration support', () => {
      const { login } = useAuthStore.getState()
      login('testuser', 'password')

      const storedValue = localStorageMock.getItem('pulp-auth')
      expect(storedValue).not.toBeNull()

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        expect(parsed).toHaveProperty('version')
      }
    })

    it('should clear persisted state on logout', () => {
      const { login, logout } = useAuthStore.getState()
      login('testuser', 'password')

      // Verify state is persisted
      let storedValue = localStorageMock.getItem('pulp-auth')
      expect(storedValue).not.toBeNull()

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        expect(parsed.state.isAuthenticated).toBe(true)
      }

      // Logout
      logout()

      // Verify persisted state is updated
      storedValue = localStorageMock.getItem('pulp-auth')
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        expect(parsed.state.isAuthenticated).toBe(false)
        expect(parsed.state.username).toBeNull()
      }
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete login-logout cycle', () => {
      const store = useAuthStore.getState()

      // Start unauthenticated
      expect(store.isAuthenticated).toBe(false)
      expect(store.username).toBeNull()

      // Login
      store.login('cycleuser', 'cyclepass')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().username).toBe('cycleuser')
      expect(localStorageMock.getItem('pulp_auth')).toBe(btoa('cycleuser:cyclepass'))

      // Logout
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().username).toBeNull()
    })

    it('should handle multiple logins with different users', () => {
      // First user login
      useAuthStore.getState().login('user1', 'pass1')
      expect(useAuthStore.getState().username).toBe('user1')

      // Second user login (without logout)
      useAuthStore.getState().login('user2', 'pass2')
      expect(useAuthStore.getState().username).toBe('user2')
      expect(localStorageMock.getItem('pulp_auth')).toBe(btoa('user2:pass2'))
    })

    it('should restore authentication state from localStorage via checkAuth', () => {
      // Simulate a fresh page load by setting localStorage directly
      const encoded = btoa('restoreduser:restoredpass')
      localStorageMock.setItem('pulp_auth', encoded)

      // State starts as unauthenticated (simulating fresh load)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // checkAuth should restore authentication
      const result = useAuthStore.getState().checkAuth()
      expect(result).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })
})
