// src/test/setup.ts
import { server } from './mocks/server'
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    getAll: vi.fn(() => {
      return store
    }),
  }
})()


Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location for URL building
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:5174',
    href: 'http://localhost:5174',
  },
  writable: true,
})

// Mock TextEncoder/TextDecoder (needed for some libraries)
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Mock matchMedia (needed for responsive features)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock confirm dialog
window.confirm = vi.fn().mockReturnValue(true)

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
})

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset MSW handlers and clear mocks after each test
afterEach(() => {
  server.resetHandlers()
  localStorageMock.clear()
  vi.clearAllMocks()
})

// Stop MSW server after all tests
afterAll(() => server.close())