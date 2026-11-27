import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { definirTokenSessao } from './api'
import {
  atualizarIndicador,
  buscarDashboard,
  calcularOcupacaoMedia,
  confirmarImportacaoIndicadores,
  criarIndicador,
  excluirIndicador,
  formatarDataSegura,
  formatarVisitantesCurto,
  listarIndicadores,
  listarSetores,
  montarSerieOcupacaoMensal,
  normalizarCategoriasHospedagem,
  normalizarOrigens,
  normalizarSetores,
  previsualizarImportacaoIndicadores,
} from './indicadoresApi'

describe('indicadoresApi utility unit tests', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('normalizes sectors, dates, visitors, occupancy series, origins, and accommodation categories', () => {
    expect(normalizarSetores([
      { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
      { id: 9, slug: 'setor-extra', name: 'Setor Extra' },
    ])).toEqual([
      { id: 1, slug: 'hospedagem', nome: 'Hospedagem', cor: 'var(--azul-institucional)', hex: '#0A4AAD' },
      { id: 9, slug: 'setor-extra', nome: 'Setor Extra', cor: 'var(--roxo)', hex: '#6C5CE0' },
    ])

    expect(formatarDataSegura('2026-09-12T10:30:00.000Z')).toBe('12 set. 2026')
    expect(formatarDataSegura(null)).toBeNull()
    expect(formatarDataSegura('invalid')).toBeNull()

    expect(formatarVisitantesCurto(86400)).toBe('86 mil')
    expect(formatarVisitantesCurto(850)).toBe('850')
    expect(formatarVisitantesCurto(null)).toBe('—')

    const serie = montarSerieOcupacaoMensal([
      { reference_date: '2025-01-01', occupancy_rate: 46.4, previous_year_occupancy_rate: 42.1 },
      { reference_date: '2025-08-01', occupancy_rate: 78.2, previous_year_occupancy_rate: null },
    ])
    expect(serie.atual[0]).toBe(46)
    expect(serie.atual[7]).toBe(78)
    expect(serie.atual[2]).toBeNull()
    expect(serie.anterior[0]).toBe(42)
    expect(serie.anterior[7]).toBeNull()

    expect(calcularOcupacaoMedia([{ occupancy_rate: 60 }, { occupancy_rate: 62 }])).toBe(61)
    expect(calcularOcupacaoMedia([], 54.6)).toBe(55)
    expect(calcularOcupacaoMedia([], null)).toBeNull()

    const origens = normalizarOrigens([
      { origin: 'sul_de_minas', value: 60 },
      { origin: 'sao_paulo', value: 40 },
      { origin: 'outros_lugares', value: 0 },
    ])
    expect(origens).toEqual([
      { chave: 'sul_de_minas', nome: 'Sul de Minas', hex: '#0A4AAD', valor: 60, bruto: 60 },
      { chave: 'sao_paulo', nome: 'Grande SP', hex: '#6C5CE0', valor: 40, bruto: 40 },
    ])

    const categorias = normalizarCategoriasHospedagem([
      { type: 'hotel', establishments: 14, beds: 612, occupancy_rate: 61.2 },
      { type: 'chale', establishments: 5, beds: 96, occupancy_rate: null },
    ])
    expect(categorias).toEqual([
      { tipo: 'hotel', nome: 'Hotéis', hex: '#0A4AAD', estabelecimentos: 14, leitos: 612, ocupacao: 61, situacao: 'publicado' },
      { tipo: 'chale', nome: 'Chalés e sítios', hex: '#B986ED', estabelecimentos: 5, leitos: 96, ocupacao: null, situacao: 'analise' },
    ])
  })

  it('calls GET /api/sectors and GET /api/dashboard with expected query parameters', async () => {
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 1, slug: 'hospedagem', name: 'Hospedagem' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { available_years: [2025] } }),
      })

    const setores = await listarSetores()
    expect(setores[0].nome).toBe('Hospedagem')
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/sectors'),
      expect.any(Object),
    )

    const dash = await buscarDashboard({ year: 2025, sector_id: 1 })
    expect(dash).toEqual({ available_years: [2025] })
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/dashboard?year=2025&sector_id=1'),
      expect.any(Object),
    )
  })

  it('omits published filter for non-admin indicator queries and passes it when permitirRascunhos is true', async () => {
    definirTokenSessao('jwt-admin')
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: { page: 1, limit: 20, total: 0, total_pages: 0 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 5, published: false }], meta: { page: 1, limit: 20, total: 1, total_pages: 1 } }),
      })

    await listarIndicadores({ year: 2025, published: false }, { permitirRascunhos: false })
    expect(fetchSpy.mock.calls[0][0]).not.toContain('published=')

    const adminRes = await listarIndicadores({ year: 2025, published: false }, { permitirRascunhos: true })
    expect(fetchSpy.mock.calls[1][0]).toContain('published=false')
    expect(adminRes.data).toHaveLength(1)
  })

  it('calls POST/PUT/DELETE indicators and import preview/commit endpoints', async () => {
    definirTokenSessao('jwt-admin')
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 10, reference_date: '2026-09-01', published: false } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 10, reference_date: '2026-09-01', published: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { preview_id: 'uuid-1', valid: true, total_rows: 2, valid_rows: 2, errors: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { preview_id: 'uuid-1', committed: true, imported_rows: 2 } }),
      })

    const criado = await criarIndicador({ reference_date: '2026-09-01', jobs_count: 100, published: false })
    expect(criado.id).toBe(10)

    const atualizado = await atualizarIndicador(10, { published: true })
    expect(atualizado.published).toBe(true)

    await excluirIndicador(10)
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/api/indicators/10'),
      expect.objectContaining({ method: 'DELETE' }),
    )

    const arquivo = new File(['reference_date,jobs_count\n2026-09-01,100'], 'dados.csv', { type: 'text/csv' })
    const previa = await previsualizarImportacaoIndicadores(arquivo)
    expect(previa.preview_id).toBe('uuid-1')

    const commit = await confirmarImportacaoIndicadores('uuid-1')
    expect(commit.imported_rows).toBe(2)
  })
})
