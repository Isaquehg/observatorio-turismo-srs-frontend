import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Clean up the DOM after each test execution
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.scrollTo used by GerenciarRolagem in App.jsx
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// Mock Element.scrollIntoView used for hash anchor navigation
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock window.matchMedia used by accessibility hooks and reduced-motion checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock ResizeObserver used by responsive charts in Graficos.jsx
globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver used by chart animations in Graficos.jsx
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
