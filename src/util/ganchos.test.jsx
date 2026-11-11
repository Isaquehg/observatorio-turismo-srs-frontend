import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  comportamentoRolagem,
  useFecharFora,
  useRevelar,
  useRolou,
  useTitulo,
  useTravarRolagem,
} from './ganchos'

describe('ganchos utility hooks unit tests', () => {
  beforeEach(() => {
    document.title = ''
    document.body.style.overflow = ''
    delete document.documentElement.dataset.movimento
    vi.restoreAllMocks()
  })

  describe('useTitulo', () => {
    it('should update document.title with custom page title or default title', () => {
      const { rerender } = renderHook(({ titulo }) => useTitulo(titulo), {
        initialProps: { titulo: 'Indicadores' },
      })

      expect(document.title).toBe('Indicadores · Observatório do Turismo SRS')

      rerender({ titulo: '' })
      expect(document.title).toBe('Observatório do Turismo · Santa Rita do Sapucaí')
    })
  })

  describe('useFecharFora', () => {
    it('should call fechar when clicking outside ref element or pressing Escape', () => {
      const fechar = vi.fn()
      const container = document.createElement('div')
      const botaoInterno = document.createElement('button')
      container.appendChild(botaoInterno)
      document.body.appendChild(container)

      const ref = { current: container }

      // Should not attach listeners when aberto is false
      const { rerender, unmount } = renderHook(
        ({ aberto }) => useFecharFora(ref, aberto, fechar),
        { initialProps: { aberto: false } },
      )

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(fechar).not.toHaveBeenCalled()

      // Activate hook with aberto = true
      rerender({ aberto: true })

      // Clicking inside ref should not close
      botaoInterno.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      expect(fechar).not.toHaveBeenCalled()

      // Clicking outside ref should close
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      expect(fechar).toHaveBeenCalledTimes(1)

      // Pressing a key other than Escape should not close
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(fechar).toHaveBeenCalledTimes(1)

      // Pressing Escape should close
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(fechar).toHaveBeenCalledTimes(2)

      unmount()
      document.body.removeChild(container)
    })
  })

  describe('useTravarRolagem', () => {
    it('should lock body scroll when active and restore previous overflow on cleanup', () => {
      document.body.style.overflow = 'auto'

      const { rerender, unmount } = renderHook(({ ativo }) => useTravarRolagem(ativo), {
        initialProps: { ativo: false },
      })
      expect(document.body.style.overflow).toBe('auto')

      rerender({ ativo: true })
      expect(document.body.style.overflow).toBe('hidden')

      unmount()
      expect(document.body.style.overflow).toBe('auto')
    })
  })

  describe('useRolou', () => {
    it('should return true when window.scrollY exceeds threshold', () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })

      const { result } = renderHook(() => useRolou(10))
      expect(result.current).toBe(false)

      act(() => {
        window.scrollY = 25
        window.dispatchEvent(new Event('scroll'))
      })

      expect(result.current).toBe(true)
    })
  })

  describe('comportamentoRolagem', () => {
    it('should return smooth by default and auto when reduced motion is enabled', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })
      expect(comportamentoRolagem()).toBe('smooth')

      document.documentElement.dataset.movimento = 'reduzido'
      expect(comportamentoRolagem()).toBe('auto')
    })
  })

  describe('useRevelar', () => {
    it('should handle null ref, IntersectionObserver fallback, and intersection callbacks', () => {
      // 1. Null ref should exit safely
      renderHook(() => useRevelar({ current: null }))

      const raiz = document.createElement('div')
      const item = document.createElement('div')
      item.className = 'revelar'
      raiz.appendChild(item)

      // 2. Fallback when IntersectionObserver is undefined
      const originalIO = globalThis.IntersectionObserver
      delete globalThis.IntersectionObserver

      renderHook(() => useRevelar({ current: raiz }))
      expect(item.dataset.visivel).toBe('true')

      // 3. When IntersectionObserver is available
      delete item.dataset.visivel
      let observerCallback
      const unobserveMock = vi.fn()
      const disconnectMock = vi.fn()

      globalThis.IntersectionObserver = vi.fn((cb) => {
        observerCallback = cb
        return {
          observe: vi.fn(),
          unobserve: unobserveMock,
          disconnect: disconnectMock,
        }
      })

      const { unmount } = renderHook(() => useRevelar({ current: raiz }))

      // Simulate element entering viewport
      observerCallback([{ isIntersecting: false, target: item }])
      expect(item.dataset.visivel).toBeUndefined()

      observerCallback([{ isIntersecting: true, target: item }])
      expect(item.dataset.visivel).toBe('true')
      expect(unobserveMock).toHaveBeenCalledWith(item)

      unmount()
      expect(disconnectMock).toHaveBeenCalledOnce()
      globalThis.IntersectionObserver = originalIO
    })
  })
})
