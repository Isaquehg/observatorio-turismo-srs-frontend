import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../../contexto/Avisos'
import { EnviosProvider } from '../../contexto/Envios'
import { SessaoProvider } from '../../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../../util/api'
import { gravar } from '../../util/armazenamento'
import Envios from './Envios'
import Estabelecimentos from './Estabelecimentos'

const ENVIOS_LISTA = [
  {
    id: 31,
    establishment_id: 1,
    reference_month: '2026-09-01',
    rooms_available: 22,
    beds_available: 48,
    room_nights_sold: 640,
    employees_count: 10,
    guests_count: 890,
    notes: 'Congresso de tecnologia na cidade',
    occupancy_rate: 97,
    status: 'submitted',
    overdue: true,
    submitted_at: '2026-10-01T14:00:00.000Z',
    establishment: {
      id: 1,
      trade_name: 'Hotel Central SRS',
      tax_id: '12345678000190',
      type: 'Hotel',
      rooms_count: 18,
      beds_count: 46,
    },
  },
  {
    id: 32,
    establishment_id: 2,
    reference_month: '2026-09-01',
    rooms_available: 12,
    beds_available: 28,
    room_nights_sold: 220,
    employees_count: 5,
    guests_count: 300,
    occupancy_rate: 61,
    status: 'submitted',
    overdue: false,
    submitted_at: '2026-10-04T11:00:00.000Z',
    establishment: {
      id: 2,
      trade_name: 'Pousada da Serra',
      tax_id: '22345678000190',
      type: 'Pousada',
      rooms_count: 12,
      beds_count: 28,
    },
  },
]

const FALTANTES_LISTA = [
  {
    id: 4,
    trade_name: 'Chalés do Vale',
    tax_id: '44345678000190',
    sector: { id: 1, name: 'Hospedagem' },
    last_reminder: null,
  },
]

function renderRotaPrefeitura(rotaInicial) {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <SessaoProvider>
        <EnviosProvider>
          <AvisosProvider>
            <Routes>
              <Route path="/prefeitura/envios" element={<Envios />} />
              <Route path="/prefeitura/estabelecimentos" element={<Estabelecimentos />} />
            </Routes>
          </AvisosProvider>
        </EnviosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('City hall submissions review, reminders, and establishments tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    gravar(CHAVE_SESSAO, {
      perfil: 'prefeitura',
      nome: 'Admin SMCELT',
      role: 'admin_smcelt',
      token: 'jwt-admin',
    })

    // Polyfill dialog modal methods for jsdom when opening RevisarEnvio
    if (typeof HTMLDialogElement !== 'undefined') {
      HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
        this.open = true
      })
      HTMLDialogElement.prototype.close = vi.fn(function close() {
        this.open = false
      })
    }
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    definirTokenSessao(null)
  })

  it('loads real consistency alerts when reviewing, returns with reason, approves, and triggers reminders', async () => {
    let motivoDevolvido = null
    let lembretePayload = null

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'

      if (destino.includes('/api/admin/submissions/missing')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: FALTANTES_LISTA,
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/reminders') && metodo === 'POST') {
        lembretePayload = JSON.parse(options.body)
        return {
          ok: true,
          status: 202,
          json: async () => ({
            data: {
              period: lembretePayload.period,
              reminders: [{ establishment_id: 4, status: 'queued' }],
            },
          }),
        }
      }
      if (destino.endsWith('/api/admin/submissions/31') && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...ENVIOS_LISTA[0],
              alerts: [
                {
                  code: 'ROOMS_ABOVE_CAPACITY',
                  severity: 'blocking',
                  field: 'rooms_available',
                  message: 'Quartos disponíveis acima da capacidade cadastrada.',
                },
                {
                  code: 'HIGH_OCCUPANCY',
                  severity: 'warning',
                  field: 'room_nights_sold',
                  message: 'Taxa de ocupação acima de 95%.',
                },
              ],
              has_blocking_alerts: true,
            },
          }),
        }
      }
      if (destino.endsWith('/api/admin/submissions/31/return') && metodo === 'POST') {
        const body = JSON.parse(options.body)
        motivoDevolvido = body.reason
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...ENVIOS_LISTA[0],
              status: 'returned',
              return_reason: body.reason,
            },
          }),
        }
      }
      if (destino.endsWith('/api/admin/submissions/32/approve') && metodo === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { ...ENVIOS_LISTA[1], status: 'approved' },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions') && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: ENVIOS_LISTA,
            meta: { page: 1, limit: 100, total: 2, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              pending_validation: 2,
              overdue_validation: 1,
              response_rate: 67,
              establishments_submitted: 2,
              establishments_expected: 3,
            },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderRotaPrefeitura('/prefeitura/envios')

    await waitFor(() => {
      expect(screen.getByText('Hotel Central SRS')).toBeInTheDocument()
      expect(screen.getByText('Pousada da Serra')).toBeInTheDocument()
    })

    // Opens review dialog for Hotel Central SRS (id=31) and verifies backend consistency alerts
    const linhaHotel = screen.getByText('Hotel Central SRS').closest('tr')
    fireEvent.click(within(linhaHotel).getByRole('button', { name: 'Revisar' }))

    await waitFor(() => {
      expect(screen.getByText('Alertas de consistência (2)')).toBeInTheDocument()
      expect(
        screen.getByText(/Quartos disponíveis acima da capacidade cadastrada\./i),
      ).toBeInTheDocument()
      expect(screen.getByText('Taxa de ocupação acima de 95%.')).toBeInTheDocument()
    })

    // Switches to return mode and submits a valid reason
    fireEvent.click(screen.getByRole('button', { name: /^devolver$/i }))
    fireEvent.change(screen.getByLabelText('Motivo da devolução'), {
      target: { value: 'Quartos informados superam o cadastro.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /devolver envio/i }))

    await waitFor(() => {
      expect(motivoDevolvido).toBe('Quartos informados superam o cadastro.')
      expect(screen.getByText('Envio devolvido para Hotel Central SRS')).toBeInTheDocument()
    })

    // Approves the second pending submission directly from the table
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar envio de Pousada da Serra' }))
    await waitFor(() => {
      expect(screen.getByText('Pousada da Serra aprovado')).toBeInTheDocument()
    })

    // Switches to missing establishments tab and sends a reminder
    fireEvent.click(screen.getByRole('tab', { name: /não enviaram/i }))
    await waitFor(() => {
      expect(screen.getByText('Chalés do Vale')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^lembrar$/i }))
    await waitFor(() => {
      expect(lembretePayload?.establishment_ids).toEqual([4])
      expect(screen.getByText('Lembrete enviado')).toBeInTheDocument()
    })
  })

  it('loads registered establishments from GET /api/admin/establishments and filters by status and search', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/admin/establishments')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 1,
                trade_name: 'Hotel Central SRS',
                tax_id: '12345678000190',
                type: 'Hotel',
                beds_count: 46,
                sector: { id: 1, name: 'Hospedagem' },
                latest_submission: {
                  reference_month: '2026-09-01',
                  status: 'approved',
                  occupancy_rate: 72,
                  beds_available: 46,
                },
              },
              {
                id: 2,
                trade_name: 'Pousada da Serra',
                tax_id: '22345678000190',
                type: 'Pousada',
                beds_count: 28,
                sector: { id: 1, name: 'Hospedagem' },
                latest_submission: null,
              },
            ],
            meta: { page: 1, limit: 100, total: 2, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/missing')) {
        return { ok: true, status: 200, json: async () => ({ data: [], meta: {} }) }
      }
      if (destino.includes('/api/admin/submissions')) {
        return { ok: true, status: 200, json: async () => ({ data: [], meta: {} }) }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: null }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderRotaPrefeitura('/prefeitura/estabelecimentos')

    await waitFor(() => {
      expect(screen.getAllByText('Hotel Central SRS').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Pousada da Serra')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    // Filters table to show only establishments that have not submitted yet
    fireEvent.change(screen.getByLabelText('Filtrar por situação'), {
      target: { value: 'pendente' },
    })

    await waitFor(() => {
      const tabela = screen.getByRole('table')
      expect(within(tabela).getByText('Pousada da Serra')).toBeInTheDocument()
      expect(within(tabela).queryByText('Hotel Central SRS')).not.toBeInTheDocument()
    })
  })
})
