import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EnviosProvider, useEnvios } from './Envios'
import { SessaoProvider } from './Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../util/api'
import { gravar } from '../util/armazenamento'

function PainelTeste() {
  const ctx = useEnvios()
  return (
    <div>
      <span data-testid="carregando">{String(ctx.carregando)}</span>
      <span data-testid="total-envios">{ctx.envios.length}</span>
      <span data-testid="total-pendentes">{ctx.totalPendentes}</span>
      <span data-testid="total-faltantes">{ctx.faltantes.length}</span>
      <span data-testid="estabelecimento">{ctx.estabelecimento?.trade_name || ''}</span>
      <span data-testid="erro">{ctx.erro}</span>
      <button
        type="button"
        onClick={() =>
          ctx.salvarEnvio({
            ano: 2026,
            mes: 9,
            roomsAvailable: 18,
            bedsAvailable: 46,
            roomNightsSold: 360,
            employeesCount: 8,
            guestsCount: 450,
            mainTravelReason: 'negocios_trabalho',
            mainOrigin: 'sul_de_minas',
            notes: '',
            submit: true,
          })
        }
      >
        Criar envio
      </button>
      <button
        type="button"
        onClick={() =>
          ctx.salvarEnvio({
            idExistente: 5,
            ano: 2026,
            mes: 8,
            roomsAvailable: 18,
            bedsAvailable: 46,
            roomNightsSold: 340,
            employeesCount: 8,
            guestsCount: 410,
            mainTravelReason: 'lazer_ferias',
            mainOrigin: 'sao_paulo',
            notes: 'Corrigido',
            submit: true,
          })
        }
      >
        Corrigir devolvido
      </button>
      <button type="button" onClick={() => ctx.aprovarEnvio(21)}>
        Aprovar
      </button>
      <button type="button" onClick={() => ctx.devolverEnvio(21, 'Valor de diárias inválido.')}>
        Devolver
      </button>
      <button type="button" onClick={() => ctx.reabrirEnvio(21)}>
        Reabrir
      </button>
      <button type="button" onClick={() => ctx.enviarLembrete([9])}>
        Lembrar
      </button>
    </div>
  )
}

function renderComContexto() {
  return render(
    <SessaoProvider>
      <EnviosProvider>
        <PainelTeste />
      </EnviosProvider>
    </SessaoProvider>,
  )
}

describe('EnviosProvider API synchronization', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    definirTokenSessao(null)
  })

  it('makes zero HTTP requests on unauthenticated or tourist sessions', () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { unmount } = renderComContexto()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByTestId('total-envios').textContent).toBe('0')
    unmount()

    gravar(CHAVE_SESSAO, { perfil: 'turista', nome: 'Visitante' })
    renderComContexto()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('loads merchant submissions and uses POST for new submissions vs PATCH + POST /submit for returned ones', async () => {
    gravar(CHAVE_SESSAO, {
      perfil: 'comerciante',
      nome: 'Hotel Central SRS',
      token: 'jwt-merchant',
    })

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'

      if (destino.includes('/api/submissions/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 5,
                reference_month: '2026-08-01',
                rooms_available: 18,
                beds_available: 46,
                room_nights_sold: 500,
                status: 'returned',
                return_reason: 'Confira as diárias.',
                occupancy_rate: 89.6,
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/establishments/me/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              establishment: { id: 1, trade_name: 'Hotel Central SRS', rooms_count: 18, beds_count: 46 },
              current_period: '2026-09',
              submission_deadline: '2026-10-10',
              cadastur_active: true,
            },
          }),
        }
      }
      if (destino.endsWith('/api/submissions') && metodo === 'POST') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 6,
              ...body,
              occupancy_rate: 66.7,
              status: 'submitted',
            },
          }),
        }
      }
      if (destino.endsWith('/api/submissions/5') && metodo === 'PATCH') {
        const body = JSON.parse(options.body)
        // Ensures submit is never sent to PATCH
        expect(body.submit).toBeUndefined()
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: { id: 5, ...body, status: 'returned' } }),
        }
      }
      if (destino.endsWith('/api/submissions/5/submit') && metodo === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { id: 5, reference_month: '2026-08-01', status: 'submitted', occupancy_rate: 60.9 },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderComContexto()

    await waitFor(() => {
      expect(screen.getByTestId('total-envios').textContent).toBe('1')
      expect(screen.getByTestId('estabelecimento').textContent).toBe('Hotel Central SRS')
    })

    // Creates a brand-new submission via POST /api/submissions
    fireEvent.click(screen.getByRole('button', { name: 'Criar envio' }))
    await waitFor(() => {
      expect(screen.getByTestId('total-envios').textContent).toBe('2')
    })

    // Updates a returned submission via PATCH followed by POST /submit
    fireEvent.click(screen.getByRole('button', { name: 'Corrigir devolvido' }))
    await waitFor(() => {
      const chamadoSubmit = fetchSpy.mock.calls.some(([url]) =>
        String(url).endsWith('/api/submissions/5/submit'),
      )
      expect(chamadoSubmit).toBe(true)
    })
  })

  it('loads city hall submissions, missing establishments, and updates pending count on review actions', async () => {
    gravar(CHAVE_SESSAO, {
      perfil: 'prefeitura',
      nome: 'Admin SMCELT',
      token: 'jwt-admin',
    })

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/admin/submissions/missing')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 9, trade_name: 'Pousada Sol', tax_id: '99999999000199', last_reminder: null }],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/reminders')) {
        return {
          ok: true,
          status: 202,
          json: async () => ({
            data: { period: '2026-09', reminders: [{ establishment_id: 9, status: 'queued' }] },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/21/approve')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { id: 21, reference_month: '2026-09-01', status: 'approved', occupancy_rate: 70 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/21/reopen')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { id: 21, reference_month: '2026-09-01', status: 'submitted', occupancy_rate: 70 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/21/return')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: 21,
              reference_month: '2026-09-01',
              status: 'returned',
              return_reason: 'Valor de diárias inválido.',
            },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 21,
                reference_month: '2026-09-01',
                status: 'submitted',
                occupancy_rate: 70,
                establishment: { id: 1, trade_name: 'Hotel Central SRS', type: 'Hotel' },
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { pending_validation: 1, response_rate: 50, establishments_submitted: 1, establishments_expected: 2 },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderComContexto()

    await waitFor(() => {
      expect(screen.getByTestId('total-pendentes').textContent).toBe('1')
      expect(screen.getByTestId('total-faltantes').textContent).toBe('1')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    await waitFor(() => {
      expect(screen.getByTestId('total-pendentes').textContent).toBe('0')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reabrir' }))
    await waitFor(() => {
      expect(screen.getByTestId('total-pendentes').textContent).toBe('1')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Devolver' }))
    await waitFor(() => {
      expect(screen.getByTestId('total-pendentes').textContent).toBe('0')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Lembrar' }))
    await waitFor(() => {
      const chamadoLembrete = fetchSpy.mock.calls.some(([url]) =>
        String(url).includes('/api/admin/submissions/reminders'),
      )
      expect(chamadoLembrete).toBe(true)
    })
  })
})
