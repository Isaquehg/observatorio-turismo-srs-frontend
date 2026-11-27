import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../../contexto/Avisos'
import { EnviosProvider } from '../../contexto/Envios'
import { SessaoProvider } from '../../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../../util/api'
import { gravar } from '../../util/armazenamento'
import RelatoriosGerenciais from './RelatoriosGerenciais'

const RELATORIO_INICIAL = {
  id: 1,
  title: 'Relatório OT nº 004/2025 — Oferta hoteleira',
  summary: 'Retrato dos meios de hospedagem da cidade.',
  category: 'bulletin',
  pages: 24,
  file_size_bytes: 2936013,
  highlights: ['1.284 leitos disponíveis.'],
  featured: false,
  file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/ot-004.pdf',
  published_at: '2025-10-07',
  author: { id: 1, name: 'Admin SMCELT' },
}

function renderRelatoriosGerenciais() {
  return render(
    <MemoryRouter>
      <SessaoProvider>
        <EnviosProvider>
          <AvisosProvider>
            <RelatoriosGerenciais />
          </AvisosProvider>
        </EnviosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('Prefeitura RelatoriosGerenciais PDF S3 CRUD integration tests', () => {
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

  it('uploads PDF via FormData, creates, updates, and deletes reports with immediate UI updates', async () => {
    let uploadHeaders = null
    let uploadBody = null

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'

      if (destino.includes('/api/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { available_years: [2025], occupancy_monthly: [] },
          }),
        }
      }
      if (destino.includes('/api/admin/reports/monthly')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              period: '2026-10',
              available_periods: ['2026-10'],
              summary: {
                received: 12,
                approved: 10,
                in_review: 1,
                returned: 1,
                average_occupancy_rate: 68.2,
                room_nights_sold: 4200,
              },
              items: [],
            },
          }),
        }
      }
      if (destino.includes('/api/reports/upload') && metodo === 'POST') {
        uploadHeaders = options.headers
        uploadBody = options.body
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/novo-005.pdf',
              file_size_bytes: 2097152,
            },
          }),
        }
      }
      if (destino.endsWith('/api/reports') && metodo === 'POST') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 2,
              ...body,
              author: { id: 1, name: 'Admin SMCELT' },
            },
          }),
        }
      }
      if (destino.endsWith('/api/reports/2') && metodo === 'PUT') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: 2,
              ...body,
              file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/novo-005.pdf',
              file_size_bytes: 2097152,
              author: { id: 1, name: 'Admin SMCELT' },
            },
          }),
        }
      }
      if (destino.endsWith('/api/reports/1') && metodo === 'DELETE') {
        return { ok: true, status: 204 }
      }
      if (destino.includes('/api/reports') && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [RELATORIO_INICIAL],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions')) {
        return { ok: true, status: 200, json: async () => ({ data: [], meta: {} }) }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ data: null }) }
      }
      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    const { container } = renderRelatoriosGerenciais()

    // Displays real monthly summary and initial published report from API
    await waitFor(() => {
      expect(screen.getByText('Relatório OT nº 004/2025 — Oferta hoteleira')).toBeInTheDocument()
      expect(screen.getByText('68%')).toBeInTheDocument()
    })

    // Opens upload dialog and publishes a new PDF report
    fireEvent.click(screen.getByRole('button', { name: /publicar relatório pdf/i }))

    fireEvent.change(screen.getByLabelText('Título do relatório'), {
      target: { value: 'Relatório OT nº 005/2026' },
    })
    fireEvent.change(screen.getByLabelText('Data de publicação'), {
      target: { value: '2026-10-15' },
    })
    const inputPdf = container.querySelector('input[type="file"]')
    const arquivoPdf = new File(['%PDF-1.4 content'], 'relatorio-005.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(inputPdf, { target: { files: [arquivoPdf] } })

    fireEvent.click(screen.getByRole('button', { name: /^publicar relatório$/i }))

    await waitFor(() => {
      expect(screen.getByText('Relatório publicado')).toBeInTheDocument()
      expect(screen.getByText('Relatório OT nº 005/2026')).toBeInTheDocument()
    })

    // Ensures multipart FormData was sent without forcing Content-Type: application/json
    expect(uploadBody).toBeInstanceOf(FormData)
    expect(uploadHeaders['Content-Type']).toBeUndefined()

    // Edits the newly created report and verifies immediate list update
    fireEvent.click(screen.getByRole('button', { name: 'Editar Relatório OT nº 005/2026' }))
    fireEvent.change(screen.getByLabelText('Título do relatório'), {
      target: { value: 'Relatório OT nº 005/2026 — Revisado' },
    })
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(screen.getByText('Relatório atualizado')).toBeInTheDocument()
      expect(screen.getByText('Relatório OT nº 005/2026 — Revisado')).toBeInTheDocument()
    })

    // Deletes the initial report and verifies immediate removal
    fireEvent.click(
      screen.getByRole('button', { name: 'Excluir Relatório OT nº 004/2025 — Oferta hoteleira' }),
    )

    await waitFor(() => {
      expect(screen.getByText('Relatório excluído')).toBeInTheDocument()
      expect(
        screen.queryByText('Relatório OT nº 004/2025 — Oferta hoteleira'),
      ).not.toBeInTheDocument()
    })
  })
})
