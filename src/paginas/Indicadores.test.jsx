import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../contexto/Avisos'
import { SessaoProvider } from '../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../util/api'
import { gravar } from '../util/armazenamento'
import Indicadores from './Indicadores'

const SETORES_MOCK = [
  { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
  { id: 2, slug: 'alimentacao', name: 'Alimentação' },
]

const DASHBOARD_2025 = {
  reference_date: '2025-10-01',
  last_updated: '2026-09-12T10:00:00.000Z',
  available_years: [2025, 2024],
  summary: { companies: 60, jobs: 420, beds: 450, visitors: 11700 },
  annual_summary: {
    accommodations: 15,
    occupancy_rate: 61,
    companies: 60,
    jobs: 420,
    beds: 450,
    visitors: 11700,
  },
  occupancy_monthly: [
    { reference_date: '2025-10-01', occupancy_rate: 61, previous_year_occupancy_rate: 56 },
  ],
  origin_distribution: [{ origin: 'sul_de_minas', value: 80 }],
  beds_by_accommodation_type: [{ type: 'hotel', beds: 450 }],
  jobs_by_sector: [
    { sector_id: 1, sector: 'Hospedagem', value: 120 },
    { sector_id: 2, sector: 'Alimentação', value: 300 },
  ],
  companies_by_sector: [
    { sector_id: 1, sector: 'Hospedagem', value: 15 },
    { sector_id: 2, sector: 'Alimentação', value: 45 },
  ],
  accommodation_categories: [
    { type: 'hotel', establishments: 15, beds: 450, occupancy_rate: 61 },
  ],
  highlights: [
    { reference_date: '2025-10-01', visitors: 11700, jobs: 420, companies: 60, beds: 450 },
  ],
}

const DASHBOARD_SETOR_1 = {
  ...DASHBOARD_2025,
  annual_summary: {
    accommodations: 15,
    occupancy_rate: 61,
    companies: 15,
    jobs: 120,
    beds: 450,
    visitors: 3200,
  },
}

function renderIndicadores() {
  return render(
    <MemoryRouter>
      <SessaoProvider>
        <AvisosProvider>
          <Indicadores />
        </AvisosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('Indicadores page API integration tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('loads sectors and dashboard from API, filters by sector, and never requests drafts for non-prefeitura users', async () => {
    gravar(CHAVE_SESSAO, { perfil: 'turista', nome: 'Visitante' })

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/sectors')) {
        return { ok: true, status: 200, json: async () => ({ data: SETORES_MOCK }) }
      }
      if (destino.includes('sector_id=1')) {
        return { ok: true, status: 200, json: async () => ({ data: DASHBOARD_SETOR_1 }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: DASHBOARD_2025 }) }
    })

    renderIndicadores()

    await waitFor(() => {
      expect(screen.getByText('Atualizado em 12 set. 2026')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Hospedagem' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alimentação' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hospedagem' }))

    await waitFor(() => {
      expect(screen.getByText('Empresas · Hospedagem')).toBeInTheDocument()
    })

    // Verifies no draft indicator query was sent for a tourist session
    const urls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(urls.some((u) => u.includes('/api/indicators'))).toBe(false)
    expect(screen.queryByText(/em rascunho/i)).not.toBeInTheDocument()
  })

  it('shows draft indicators notice only for prefeitura profile', async () => {
    gravar(CHAVE_SESSAO, { perfil: 'prefeitura', nome: 'Admin SMCELT', role: 'admin_smcelt' })

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/sectors')) {
        return { ok: true, status: 200, json: async () => ({ data: SETORES_MOCK }) }
      }
      if (destino.includes('/api/indicators')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 99, reference_date: '2025-11-01', published: false }],
            meta: { page: 1, limit: 50, total: 1, total_pages: 1 },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: DASHBOARD_2025 }) }
    })

    renderIndicadores()

    await waitFor(() => {
      expect(screen.getByText('1 indicador em rascunho em 2025')).toBeInTheDocument()
    })

    const urls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(urls.some((u) => u.includes('/api/indicators') && u.includes('published=false'))).toBe(true)
  })

  it('shows network error state cleanly when sectors or dashboard fail to load', async () => {
    gravar(CHAVE_SESSAO, { perfil: 'comerciante', nome: 'Hotel Central' })
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    renderIndicadores()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor')
    })
  })
})
