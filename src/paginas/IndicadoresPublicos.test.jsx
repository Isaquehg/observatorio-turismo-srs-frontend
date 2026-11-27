import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessaoProvider } from '../contexto/Sessao'
import IndicadoresPublicos from './IndicadoresPublicos'

const DASHBOARD_2025 = {
  reference_date: '2025-10-01',
  last_updated: '2026-09-12T10:00:00.000Z',
  available_years: [2025, 2024],
  summary: { companies: 60, jobs: 420, beds: 450, visitors: 86000 },
  annual_summary: {
    accommodations: 42,
    occupancy_rate: 61,
    companies: 60,
    jobs: 420,
    beds: 450,
    visitors: 86000,
  },
  occupancy_monthly: [
    { reference_date: '2025-08-01', occupancy_rate: 78, previous_year_occupancy_rate: 71 },
    { reference_date: '2025-10-01', occupancy_rate: 62, previous_year_occupancy_rate: 58 },
  ],
  origin_distribution: [
    { origin: 'sul_de_minas', value: 38 },
    { origin: 'sao_paulo', value: 27 },
  ],
  highlights: [
    { reference_date: '2025-08-01', visitors: 40000, jobs: 410, companies: 58, beds: 440 },
    { reference_date: '2025-10-01', visitors: 46000, jobs: 420, companies: 60, beds: 450 },
  ],
}

const DASHBOARD_2024 = {
  ...DASHBOARD_2025,
  reference_date: '2024-10-01',
  annual_summary: {
    accommodations: 39,
    occupancy_rate: 55,
    companies: 54,
    jobs: 390,
    beds: 420,
    visitors: 79000,
  },
  occupancy_monthly: [
    { reference_date: '2024-08-01', occupancy_rate: 71, previous_year_occupancy_rate: null },
  ],
}

function renderPublicos() {
  return render(
    <MemoryRouter>
      <SessaoProvider>
        <IndicadoresPublicos />
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('IndicadoresPublicos API integration tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('loads and renders public dashboard KPIs, charts, and facts from GET /api/dashboard', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('year=2024')) {
        return { ok: true, status: 200, json: async () => ({ data: DASHBOARD_2024 }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: DASHBOARD_2025 }) }
    })

    renderPublicos()

    expect(screen.getByText('Carregando indicadores públicos…')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Atualizado em 12 set. 2026')).toBeInTheDocument()
    })

    expect(screen.getByText('Visitantes estimados')).toBeInTheDocument()
    expect(screen.getAllByText('78%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/o mês mais movimentado de 2025/i)).toBeInTheDocument()
    expect(screen.getByText('Sul de Minas')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('renders empty state when backend has no published years yet', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          reference_date: null,
          last_updated: null,
          available_years: [],
          summary: { companies: 0, jobs: 0, beds: 0, visitors: 0 },
        },
      }),
    })

    renderPublicos()

    await waitFor(() => {
      expect(screen.getByText('Nenhum indicador publicado ainda')).toBeInTheDocument()
    })
  })

  it('displays network error message and retries when clicking Tentar novamente', async () => {
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { ...DASHBOARD_2025, available_years: [2025] } }),
      })

    renderPublicos()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => {
      expect(screen.getByText('Visitantes estimados')).toBeInTheDocument()
    })
  })
})
