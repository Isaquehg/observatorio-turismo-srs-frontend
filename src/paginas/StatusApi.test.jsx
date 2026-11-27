import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StatusApi from './StatusApi'

function renderStatusApi() {
  return render(
    <MemoryRouter>
      <StatusApi />
    </MemoryRouter>,
  )
}

describe('StatusApi health diagnostic page tests', () => {
  let fetchSpy

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('calls both /api/health and /api/health/database and displays healthy API and PostgreSQL status', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/health/database')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            message: 'Database connection is healthy',
            database: 'connected',
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'SRS Tourism API is running',
        }),
      }
    })

    renderStatusApi()

    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument()
      expect(screen.getByText('Conectado')).toBeInTheDocument()
      expect(screen.getByText('SRS Tourism API is running')).toBeInTheDocument()
      expect(screen.getByText(/Database connection is healthy/i)).toBeInTheDocument()
    })

    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/health'), expect.any(Object))
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/health/database'),
      expect.any(Object),
    )
  })

  it('reports disconnected database when /api/health/database returns 503 and supports re-checking', async () => {
    let bancoOk = false
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/health/database')) {
        if (!bancoOk) {
          return {
            ok: false,
            status: 503,
            json: async () => ({
              status: 'error',
              message: 'Database connection is unavailable',
              database: 'disconnected',
            }),
          }
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            message: 'Database connection is healthy',
            database: 'connected',
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'SRS Tourism API is running',
        }),
      }
    })

    renderStatusApi()

    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument()
      expect(screen.getByText('Desconectado')).toBeInTheDocument()
      expect(screen.getByText('Database connection is unavailable')).toBeInTheDocument()
    })

    bancoOk = true
    fireEvent.click(screen.getByRole('button', { name: /verificar novamente/i }))

    await waitFor(() => {
      expect(screen.getByText('Conectado')).toBeInTheDocument()
    })
  })
})
