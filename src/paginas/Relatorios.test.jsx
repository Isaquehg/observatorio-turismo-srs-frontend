import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../contexto/Avisos'
import Relatorios from './Relatorios'

const RELATORIOS_PAGINA_1 = [
  {
    id: 1,
    title: 'Perfil do turista em eventos — 2025',
    summary: 'Pesquisa de perfil dos visitantes em eventos municipais.',
    category: 'survey',
    pages: 38,
    file_size_bytes: 4404019,
    highlights: ['6 em cada 10 visitantes vieram de fora do Sul de Minas.'],
    featured: true,
    file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/perfil-2025.pdf',
    published_at: '2025-11-18',
    author: { id: 1, name: 'Admin SMCELT' },
  },
  {
    id: 2,
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
  },
]

const RELATORIOS_PAGINA_2 = [
  {
    id: 3,
    title: 'Inventário da oferta turística — 2024',
    summary: 'Atrativos e equipamentos inventariados.',
    category: 'inventory',
    pages: 56,
    file_size_bytes: 7759462,
    highlights: ['205 itens inventariados.'],
    featured: false,
    file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/inventario-2024.pdf',
    published_at: '2024-12-09',
    author: { id: 1, name: 'Admin SMCELT' },
  },
]

function renderRelatorios() {
  return render(
    <MemoryRouter>
      <AvisosProvider>
        <Relatorios />
      </AvisosProvider>
    </MemoryRouter>,
  )
}

describe('Relatorios page API integration tests', () => {
  let fetchSpy
  let openSpy

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
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
    openSpy?.mockRestore()
  })

  it('loads reports from GET /api/reports, opens S3 PDF URL on download, paginates, and filters by category', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('featured=true')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [RELATORIOS_PAGINA_1[0]],
            meta: { page: 1, limit: 1, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('category=bulletin')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [RELATORIOS_PAGINA_1[1]],
            meta: { page: 1, limit: 5, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('page=2')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: RELATORIOS_PAGINA_2,
            meta: { page: 2, limit: 5, total: 3, total_pages: 2 },
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: RELATORIOS_PAGINA_1,
          meta: { page: 1, limit: 5, total: 3, total_pages: 2 },
        }),
      }
    })

    renderRelatorios()

    await waitFor(() => {
      expect(screen.getByText('Relatório OT nº 004/2025 — Oferta hoteleira')).toBeInTheDocument()
      expect(screen.getAllByText('Perfil do turista em eventos — 2025').length).toBeGreaterThanOrEqual(1)
    })

    // Opens the real S3 URL returned by the API when clicking Baixar PDF
    fireEvent.click(screen.getByRole('button', { name: /baixar pdf/i }))
    expect(openSpy).toHaveBeenCalledWith(
      'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/perfil-2025.pdf',
      '_blank',
      'noopener,noreferrer',
    )

    // Loads page 2 via real API pagination
    fireEvent.click(screen.getByRole('button', { name: /carregar mais relatórios/i }))
    await waitFor(() => {
      expect(screen.getByText('Inventário da oferta turística — 2024')).toBeInTheDocument()
    })

    // Filters by category chip sending canonical backend category slug
    fireEvent.click(screen.getByRole('button', { name: 'Boletins de indicadores' }))
    await waitFor(() => {
      const filtrou = fetchSpy.mock.calls.some(([url]) => String(url).includes('category=bulletin'))
      expect(filtrou).toBe(true)
    })
  })

  it('shows network error state and retries when clicking Tentar novamente', async () => {
    let tentativas = 0
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('page=1&limit=5')) {
        tentativas += 1
        if (tentativas === 1) {
          throw new Error('Failed to fetch')
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [RELATORIOS_PAGINA_1[1]],
          meta: { page: 1, limit: 5, total: 1, total_pages: 1 },
        }),
      }
    })

    renderRelatorios()

    await waitFor(() => {
      expect(screen.getByText('Não foi possível carregar os relatórios')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => {
      expect(
        screen.getAllByText('Relatório OT nº 004/2025 — Oferta hoteleira').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })
})
