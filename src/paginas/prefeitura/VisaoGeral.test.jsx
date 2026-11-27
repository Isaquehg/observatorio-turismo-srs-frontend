import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../../contexto/Avisos'
import { EnviosProvider } from '../../contexto/Envios'
import { SessaoProvider } from '../../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../../util/api'
import { gravar } from '../../util/armazenamento'
import VisaoGeral from './VisaoGeral'

const SETORES = [
  { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
  { id: 2, slug: 'alimentacao', name: 'Alimentação' },
]

const INDICADORES_INICIAIS = [
  {
    id: 1,
    sector_id: 1,
    reference_date: '2025-10-01',
    companies_count: 15,
    jobs_count: 120,
    beds_count: 450,
    visitors_count: 3200,
    accommodations_count: 15,
    occupancy_rate: 61,
    published: true,
    source: 'OT-SRS / SMCELT',
    updated_at: '2026-09-12T10:00:00.000Z',
    sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
  },
  {
    id: 2,
    sector_id: 2,
    reference_date: '2025-11-01',
    companies_count: 45,
    jobs_count: 300,
    beds_count: 0,
    visitors_count: 8500,
    accommodations_count: 0,
    occupancy_rate: null,
    published: false,
    source: 'OT-SRS / SMCELT',
    updated_at: '2026-09-13T10:00:00.000Z',
    sector: { id: 2, slug: 'alimentacao', name: 'Alimentação' },
  },
]

const RESUMO_ADMIN = {
  pending_validation: 2,
  overdue_validation: 1,
  oldest_pending: [
    { id: 41, reference_month: '2026-08', submitted_at: '2026-09-01T10:00:00.000Z', waiting_days: 5 },
  ],
  response_rate: 75,
  response_rate_target: 80,
  response_rate_history: [
    { period: '2026-07', rate: 62.5, submitted: 5, expected: 8 },
    { period: '2026-08', rate: 75, submitted: 6, expected: 8 },
  ],
  current_period: '2026-08',
  establishments_submitted: 6,
  establishments_expected: 8,
  latest_published_indicator: { id: 1, reference_date: '2025-10-01', updated_at: '2026-09-12T10:00:00.000Z' },
  next_scheduled_report: null,
}

const ENVIOS_ADMIN = [
  {
    id: 41,
    establishment_id: 1,
    reference_month: '2026-08-01',
    rooms_available: 18,
    beds_available: 46,
    room_nights_sold: 380,
    employees_count: 8,
    guests_count: 510,
    occupancy_rate: 68.1,
    status: 'submitted',
    overdue: true,
    submitted_at: '2026-09-01T10:00:00.000Z',
    establishment: { id: 1, trade_name: 'Hotel Central SRS', tax_id: '12345678000190', type: 'Hotel' },
  },
]

function renderVisaoGeral() {
  return render(
    <MemoryRouter>
      <SessaoProvider>
        <EnviosProvider>
          <AvisosProvider>
            <VisaoGeral />
          </AvisosProvider>
        </EnviosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('Prefeitura VisaoGeral indicator management integration tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    gravar(CHAVE_SESSAO, { perfil: 'prefeitura', nome: 'Admin SMCELT', role: 'admin_smcelt' })

    // Polyfill dialog modal methods for jsdom when opening the edit/import dialogs
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
  })

  it('lists published and draft indicators for prefeitura and updates state when creating, publishing, and deleting', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'

      if (destino.includes('/api/admin/submissions/missing')) {
        return { ok: true, status: 200, json: async () => ({ data: [], meta: { page: 1, limit: 100, total: 0, total_pages: 0 } }) }
      }
      if (destino.includes('/api/admin/submissions')) {
        return { ok: true, status: 200, json: async () => ({ data: ENVIOS_ADMIN, meta: { page: 1, limit: 100, total: 1, total_pages: 1 } }) }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: RESUMO_ADMIN }) }
      }
      if (destino.includes('/api/sectors')) {
        return { ok: true, status: 200, json: async () => ({ data: SETORES }) }
      }
      if (destino.includes('/api/indicators') && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: INDICADORES_INICIAIS,
            meta: { page: 1, limit: 100, total: 2, total_pages: 1 },
          }),
        }
      }
      if (destino.endsWith('/api/indicators') && metodo === 'POST') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 3,
              sector_id: body.sector_id ?? null,
              reference_date: body.reference_date,
              companies_count: body.companies_count ?? 0,
              jobs_count: body.jobs_count ?? 0,
              beds_count: body.beds_count ?? 0,
              visitors_count: body.visitors_count ?? 0,
              accommodations_count: body.accommodations_count ?? 0,
              occupancy_rate: body.occupancy_rate ?? null,
              published: body.published ?? true,
              source: body.source ?? 'OT-SRS / SMCELT',
              updated_at: '2026-10-01T12:00:00.000Z',
              sector: null,
            },
          }),
        }
      }
      if (destino.includes('/api/indicators/2') && metodo === 'PUT') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { ...INDICADORES_INICIAIS[1], ...body },
          }),
        }
      }
      if (destino.includes('/api/indicators/1') && metodo === 'PUT') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { ...INDICADORES_INICIAIS[0], ...body },
          }),
        }
      }
      if (destino.includes('/api/indicators/1') && metodo === 'DELETE') {
        return { ok: true, status: 204 }
      }
      return { ok: true, status: 200, json: async () => ({ data: [] }) }
    })

    renderVisaoGeral()

    // Displays both published and draft records for city hall, plus real admin dashboard KPIs and response rate history
    await waitFor(() => {
      expect(screen.getByText('12 set. 2026')).toBeInTheDocument()
      expect(screen.getAllByText('Rascunho').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('6 de 8 estabelecimentos')).toBeInTheDocument()
      expect(screen.getByText('Meta para 2026: 80% de resposta.')).toBeInTheDocument()
      expect(screen.getByText('Hotel Central SRS')).toBeInTheDocument()
    })

    // Creates a new indicator via quick publish form as draft
    fireEvent.click(screen.getByLabelText('Mostrar no site assim que publicar'))
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '1.982' } })
    fireEvent.click(screen.getAllByRole('button', { name: /^publicar$/i })[0])

    await waitFor(() => {
      expect(screen.getByText('Salvo sem publicar')).toBeInTheDocument()
      expect(screen.getByText('1.982')).toBeInTheDocument()
    })

    // Edits an existing indicator (id=1) via modal and updates the table immediately
    const botoesEditar = screen.getAllByRole('button', { name: /editar/i })
    fireEvent.click(botoesEditar[botoesEditar.length - 1])

    await waitFor(() => {
      expect(screen.getByLabelText('Empregos')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Empregos'), { target: { value: '555' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(screen.getByText('Indicador atualizado')).toBeInTheDocument()
      expect(screen.getByText('555')).toBeInTheDocument()
    })

    // Publishes an existing draft indicator (id=2) and updates the row immediately
    const publicarBotoes = screen.getAllByRole('button', { name: /^publicar$/i })
    fireEvent.click(publicarBotoes[publicarBotoes.length - 1])

    await waitFor(() => {
      expect(screen.getByText('Indicador publicado')).toBeInTheDocument()
    })

    // Deletes an indicator and removes it from the table
    fireEvent.click(screen.getByRole('button', { name: /excluir indicador de out\. 2025/i }))

    await waitFor(() => {
      expect(screen.getByText('Indicador excluído')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /excluir indicador de out\. 2025/i })).not.toBeInTheDocument()
    })
  })

  it('previews and commits CSV spreadsheet import via admin import endpoints', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      if (destino.includes('/api/admin/submissions/missing')) {
        return { ok: true, status: 200, json: async () => ({ data: [], meta: { page: 1, limit: 100, total: 0, total_pages: 0 } }) }
      }
      if (destino.includes('/api/admin/submissions')) {
        return { ok: true, status: 200, json: async () => ({ data: ENVIOS_ADMIN, meta: { page: 1, limit: 100, total: 1, total_pages: 1 } }) }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: RESUMO_ADMIN }) }
      }
      if (destino.includes('/api/sectors')) {
        return { ok: true, status: 200, json: async () => ({ data: SETORES }) }
      }
      if (destino.includes('/api/indicators') && (options.method || 'GET') === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [], meta: { page: 1, limit: 100, total: 0, total_pages: 0 } }),
        }
      }
      if (destino.includes('/api/admin/indicators/import/preview')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              preview_id: '550e8400-e29b-41d4-a716-446655440000',
              file_name: 'indicadores.csv',
              valid: true,
              total_rows: 2,
              valid_rows: 2,
              errors: [],
            },
          }),
        }
      }
      if (destino.includes('/api/admin/indicators/import/commit')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              preview_id: '550e8400-e29b-41d4-a716-446655440000',
              committed: true,
              imported_rows: 2,
            },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ data: [] }) }
    })

    const { container } = renderVisaoGeral()

    await waitFor(() => {
      expect(screen.getByText('Nenhum indicador encontrado')).toBeInTheDocument()
    })

    const inputArquivo = container.querySelector('input[type="file"]')
    const arquivoCsv = new File(['reference_date,jobs_count\n2026-08-01,200'], 'indicadores.csv', {
      type: 'text/csv',
    })
    fireEvent.change(inputArquivo, { target: { files: [arquivoCsv] } })

    fireEvent.click(screen.getByRole('button', { name: 'Conferir dados' }))

    await waitFor(() => {
      expect(screen.getByText('Tudo certo para importar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    await waitFor(() => {
      expect(screen.getByText('Planilha importada')).toBeInTheDocument()
    })
  })
})
