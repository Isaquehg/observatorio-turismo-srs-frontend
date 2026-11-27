import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../../contexto/Avisos'
import { EnviosProvider } from '../../contexto/Envios'
import { SessaoProvider } from '../../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../../util/api'
import { gravar } from '../../util/armazenamento'
import InicioComerciante from './InicioComerciante'
import Enviar from './Enviar'
import Historico from './Historico'

const PAINEL_ESTABELECIMENTO = {
  establishment: {
    id: 1,
    trade_name: 'Hotel Central SRS',
    tax_id: '12345678000190',
    type: 'Hotel',
    rooms_count: 18,
    beds_count: 46,
    link_status: 'confirmed',
    cadastur_status: 'active',
    cadastur_expires_at: '2027-03-31',
    sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
  },
  current_period: '2026-09',
  submission_deadline: '2026-10-10',
  latest_submission: null,
  cadastur_active: true,
}

const MEUS_ENVIOS = [
  {
    id: 10,
    establishment_id: 1,
    reference_month: '2026-08-01',
    rooms_available: 18,
    beds_available: 46,
    room_nights_sold: 380,
    employees_count: 8,
    guests_count: 510,
    main_travel_reason: 'negocios_trabalho',
    main_origin: 'sul_de_minas',
    notes: null,
    occupancy_rate: 68.1,
    status: 'approved',
    return_reason: null,
    submitted_at: '2026-09-04T14:00:00.000Z',
    reviewed_at: '2026-09-06T10:00:00.000Z',
    comparisons: {
      city_average_occupancy_rate: 61,
      sector_average_occupancy_rate: 63,
    },
  },
  {
    id: 9,
    establishment_id: 1,
    reference_month: '2026-07-01',
    rooms_available: 18,
    beds_available: 46,
    room_nights_sold: 420,
    employees_count: 8,
    guests_count: 520,
    main_travel_reason: 'lazer_ferias',
    main_origin: 'sao_paulo',
    notes: 'Festival de inverno',
    occupancy_rate: 75.3,
    status: 'returned',
    return_reason: 'Confira o total de diárias vendidas no relatório.',
    submitted_at: '2026-08-03T12:00:00.000Z',
    reviewed_at: '2026-08-05T11:00:00.000Z',
    comparisons: {
      city_average_occupancy_rate: null,
      sector_average_occupancy_rate: null,
    },
  },
]

function renderRotaComerciante(rotaInicial) {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <SessaoProvider>
        <EnviosProvider>
          <AvisosProvider>
            <Routes>
              <Route path="/comerciante" element={<InicioComerciante />} />
              <Route path="/comerciante/enviar" element={<Enviar />} />
              <Route path="/comerciante/historico" element={<Historico />} />
            </Routes>
          </AvisosProvider>
        </EnviosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('Merchant submission screens integration tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    gravar(CHAVE_SESSAO, {
      perfil: 'comerciante',
      nome: 'Hotel Central SRS',
      identificador: '12345678000190',
      token: 'jwt-merchant',
    })
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    definirTokenSessao(null)
  })

  it('renders /comerciante with real occupancy comparison, Cadastur validity, and returned submission notice', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/submissions/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: MEUS_ENVIOS, meta: { page: 1, limit: 100, total: 2, total_pages: 1 } }),
        }
      }
      if (destino.includes('/api/establishments/me/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: PAINEL_ESTABELECIMENTO }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderRotaComerciante('/comerciante')

    await waitFor(() => {
      expect(screen.getByText('Olá, Hotel Central SRS')).toBeInTheDocument()
      expect(screen.getByText('Cidade: 61%')).toBeInTheDocument()
      expect(screen.getByText('5 pontos acima da média do setor')).toBeInTheDocument()
      expect(screen.getByText('Válido até 31 mar. 2027')).toBeInTheDocument()
      expect(screen.getByText(/Confira o total de diárias vendidas no relatório\./i)).toBeInTheDocument()
    })
  })

  it('submits a new monthly report through the 4-step wizard with backend snake_case codes', async () => {
    let payloadEnviado = null
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'
      if (destino.includes('/api/submissions/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [], meta: { page: 1, limit: 100, total: 0, total_pages: 0 } }),
        }
      }
      if (destino.includes('/api/establishments/me/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: PAINEL_ESTABELECIMENTO }) }
      }
      if (destino.endsWith('/api/submissions') && metodo === 'POST') {
        payloadEnviado = JSON.parse(options.body)
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 77,
              ...payloadEnviado,
              occupancy_rate: 65.2,
              status: payloadEnviado.submit ? 'submitted' : 'draft',
              submitted_at: '2026-10-02T12:00:00.000Z',
            },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderRotaComerciante('/comerciante/enviar')

    // Step 1: Period
    await waitFor(() => {
      expect(screen.getByText('De qual mês são os dados?')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    // Step 2: Occupancy (rooms and beds pre-filled from establishment capacity)
    await waitFor(() => {
      expect(screen.getByLabelText(/quartos disponíveis/i)).toHaveValue('18')
      expect(screen.getByLabelText(/leitos/i)).toHaveValue('46')
    })
    fireEvent.change(screen.getByLabelText(/diárias vendidas/i), { target: { value: '352' } })
    fireEvent.change(screen.getByLabelText(/funcionários no mês/i), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    // Step 3: Guests
    await waitFor(() => {
      expect(screen.getByLabelText(/hóspedes no mês/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/hóspedes no mês/i), { target: { value: '480' } })
    fireEvent.change(screen.getByLabelText(/motivo mais comum/i), {
      target: { value: 'Negócios e trabalho' },
    })
    fireEvent.change(screen.getByLabelText(/de onde veio a maioria/i), {
      target: { value: 'Sul de Minas' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    // Step 4: Review and submit
    await waitFor(() => {
      expect(screen.getByText('Confira antes de enviar')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText(/confirmo que os números são do meu estabelecimento/i))
    fireEvent.click(screen.getByRole('button', { name: /enviar para a prefeitura/i }))

    await waitFor(() => {
      expect(screen.getByText('Envio recebido')).toBeInTheDocument()
      expect(screen.getByText('65%')).toBeInTheDocument()
    })

    expect(payloadEnviado).toMatchObject({
      rooms_available: 18,
      beds_available: 46,
      room_nights_sold: 352,
      employees_count: 9,
      guests_count: 480,
      main_travel_reason: 'negocios_trabalho',
      main_origin: 'sul_de_minas',
      submit: true,
    })
  })

  it('renders /comerciante/historico with API comparisons and returned correction link', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/submissions/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: MEUS_ENVIOS, meta: { page: 1, limit: 100, total: 2, total_pages: 1 } }),
        }
      }
      if (destino.includes('/api/establishments/me/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: PAINEL_ESTABELECIMENTO }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    renderRotaComerciante('/comerciante/historico')

    await waitFor(() => {
      expect(screen.getByText('1 de 1')).toBeInTheDocument()
      expect(screen.getByText('Ago. 2026 · 68%')).toBeInTheDocument()
      expect(screen.getByText('Confira o total de diárias vendidas no relatório.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /corrigir/i })).toHaveAttribute(
        'href',
        '/comerciante/enviar?id=9&ano=2026&mes=7',
      )
    })
  })
})
