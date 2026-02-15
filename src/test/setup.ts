/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Set up jsdom environment with proper location
if (typeof window !== 'undefined') {
  // Ensure window.location.origin is set for API URL building
  if (!window.location.origin) {
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        origin: 'http://localhost',
        href: 'http://localhost/',
        host: 'localhost',
        hostname: 'localhost',
        protocol: 'http:',
        port: '',
      },
      writable: true,
    })
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Setup MSW for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock ResizeObserver
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
