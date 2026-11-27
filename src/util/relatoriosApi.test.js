import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { definirTokenSessao } from './api'
import {
  atualizarRelatorio,
  buscarRelatorio,
  buscarRelatorioMensalAdmin,
  criarRelatorio,
  excluirRelatorio,
  formatarTamanhoArquivo,
  listarRelatorios,
  normalizarRelatorio,
  uploadPdfRelatorio,
  verificarSaudeApi,
  verificarSaudeBanco,
} from './relatoriosApi'

describe('relatoriosApi wrappers and normalizers', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao('jwt-admin-token')
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    definirTokenSessao(null)
  })

  it('formats file sizes and normalizes backend report payloads cleanly', () => {
    expect(formatarTamanhoArquivo(2936013)).toBe('2,8 MB')
    expect(formatarTamanhoArquivo(430080)).toBe('420 KB')
    expect(formatarTamanhoArquivo(512)).toBe('512 B')
    expect(formatarTamanhoArquivo(null)).toBe('')

    const normalizado = normalizarRelatorio({
      id: 4,
      title: 'Relatório OT 004/2025',
      summary: 'Análise do Carnaval',
      category: 'survey',
      pages: 24,
      file_size_bytes: 2936013,
      highlights: ['Aumento na ocupação.'],
      featured: true,
      file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/ot-004.pdf',
      published_at: '2025-03-10',
      author: { id: 1, name: 'Admin SMCELT' },
    })

    expect(normalizado).toMatchObject({
      id: 4,
      titulo: 'Relatório OT 004/2025',
      resumo: 'Análise do Carnaval',
      categoria: 'pesquisa',
      data: '2025-03-10',
      paginas: 24,
      tamanho: '2,8 MB',
      achados: ['Aumento na ocupação.'],
      novo: true,
      arquivoUrl: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/ot-004.pdf',
      autor: 'Admin SMCELT',
    })
  })

  it('lists, fetches, uploads PDF via FormData without JSON Content-Type, creates, updates, and deletes reports', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      const destino = String(url)
      const metodo = options.method || 'GET'

      if (destino.includes('/api/reports/upload') && metodo === 'POST') {
        expect(options.body).toBeInstanceOf(FormData)
        // Must never force Content-Type: application/json for multipart/form-data uploads
        expect(options.headers['Content-Type']).toBeUndefined()
        expect(options.headers.Authorization).toBe('Bearer jwt-admin-token')
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              file_url: 'https://bucket.s3.us-east-2.amazonaws.com/reports/novo.pdf',
              file_size_bytes: 102400,
            },
          }),
        }
      }

      if (destino.includes('/api/reports/9') && metodo === 'DELETE') {
        return { ok: true, status: 204 }
      }

      if (destino.includes('/api/reports/9') && metodo === 'PUT') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: 9,
              title: body.title,
              category: 'bulletin',
              published_at: '2026-04-01',
              file_url: 'https://bucket.s3.us-east-2.amazonaws.com/reports/novo.pdf',
            },
          }),
        }
      }

      if (destino.includes('/api/reports/9') && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: 9,
              title: 'Boletim Abril',
              category: 'bulletin',
              published_at: '2026-04-01',
              file_url: 'https://bucket.s3.us-east-2.amazonaws.com/reports/novo.pdf',
            },
          }),
        }
      }

      if (destino.includes('/api/reports') && metodo === 'POST') {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: { id: 9, ...body },
          }),
        }
      }

      if (destino.includes('/api/reports')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 9,
                title: 'Boletim Abril',
                category: 'bulletin',
                published_at: '2026-04-01',
                file_url: 'https://bucket.s3.us-east-2.amazonaws.com/reports/novo.pdf',
              },
            ],
            meta: { page: 2, limit: 5, total: 6, total_pages: 2 },
          }),
        }
      }

      return { ok: true, status: 200, json: async () => ({ data: null }) }
    })

    const lista = await listarRelatorios({
      q: 'Boletim',
      year: '2026',
      category: 'boletim',
      sort: 'antigos',
      page: 2,
      limit: 5,
    })
    expect(lista.data).toHaveLength(1)
    expect(lista.meta.total).toBe(6)
    expect(fetchSpy.mock.calls[0][0]).toContain(
      '/api/reports?q=Boletim&year=2026&category=bulletin&sort=oldest&page=2&limit=5',
    )

    const detalhe = await buscarRelatorio(9)
    expect(detalhe.titulo).toBe('Boletim Abril')

    const pdf = new File(['%PDF-1.4'], 'boletim.pdf', { type: 'application/pdf' })
    const uploaded = await uploadPdfRelatorio(pdf)
    expect(uploaded.file_url).toBe('https://bucket.s3.us-east-2.amazonaws.com/reports/novo.pdf')

    const criado = await criarRelatorio({
      title: 'Boletim Abril',
      category: 'bulletin',
      file_url: uploaded.file_url,
      file_size_bytes: uploaded.file_size_bytes,
      published_at: '2026-04-01',
    })
    expect(criado.id).toBe(9)

    const atualizado = await atualizarRelatorio(9, { title: 'Boletim Abril Atualizado' })
    expect(atualizado.titulo).toBe('Boletim Abril Atualizado')

    expect(await excluirRelatorio(9)).toBeNull()
  })

  it('calls monthly admin report and public health/database endpoints', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/admin/reports/monthly')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: { period: '2026-09', available_periods: ['2026-09'], summary: {}, items: [] } }),
        }
      }
      if (destino.includes('/api/health/database')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'success', database: 'connected' }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', message: 'SRS Tourism API is running' }),
      }
    })

    const mensal = await buscarRelatorioMensalAdmin('2026-09')
    expect(mensal.period).toBe('2026-09')

    const apiHealth = await verificarSaudeApi()
    expect(apiHealth.status).toBe('success')

    const dbHealth = await verificarSaudeBanco()
    expect(dbHealth.database).toBe('connected')
  })
})
