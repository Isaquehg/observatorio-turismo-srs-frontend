import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { definirTokenSessao } from './api'
import {
  aprovarEnvioAdmin,
  atualizarEnvio,
  buscarDashboardAdmin,
  buscarEnvioAdmin,
  buscarMeuPainelEstabelecimento,
  codigoParaMotivo,
  codigoParaOrigem,
  criarEnvio,
  devolverEnvioAdmin,
  enviarLembretesAdmin,
  formatarMesReferenciaIso,
  formatarPeriodoIso,
  listarEnviosAdmin,
  listarEstabelecimentosAdmin,
  listarFaltantesAdmin,
  listarMeusEnvios,
  motivoParaCodigo,
  normalizarEnvio,
  normalizarFaltante,
  origemParaCodigo,
  reabrirEnvioAdmin,
  submeterEnvio,
} from './enviosApi'

describe('enviosApi helpers and HTTP wrappers', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao('jwt-token-test')
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    definirTokenSessao(null)
  })

  it('maps travel reasons and guest origins bidirectionally between labels and backend codes', () => {
    expect(motivoParaCodigo('Negócios e trabalho')).toBe('negocios_trabalho')
    expect(motivoParaCodigo('negocios_trabalho')).toBe('negocios_trabalho')
    expect(motivoParaCodigo('Desconhecido')).toBeNull()
    expect(codigoParaMotivo('visita_parentes_amigos')).toBe('Visita a parentes e amigos')
    expect(codigoParaMotivo(null)).toBe('')

    expect(origemParaCodigo('Sul de Minas')).toBe('sul_de_minas')
    expect(origemParaCodigo('exterior')).toBe('exterior')
    expect(origemParaCodigo('Outro lugar')).toBeNull()
    expect(codigoParaOrigem('sao_paulo')).toBe('São Paulo')
    expect(codigoParaOrigem(undefined)).toBe('')

    expect(formatarPeriodoIso(2026, 8)).toBe('2026-08')
    expect(formatarMesReferenciaIso(2026, 8)).toBe('2026-08-01')
  })

  it('normalizes backend submissions including comparisons, alerts, and missing establishments', () => {
    const envio = normalizarEnvio(
      {
        id: 22,
        establishment_id: 3,
        reference_month: '2026-08-01',
        rooms_available: 18,
        beds_available: 46,
        room_nights_sold: 380,
        employees_count: 8,
        guests_count: 510,
        main_travel_reason: 'negocios_trabalho',
        main_origin: 'sul_de_minas',
        notes: 'Evento municipal',
        occupancy_rate: 68.4,
        status: 'approved',
        return_reason: null,
        overdue: false,
        submitted_at: '2026-09-04T15:30:00.000Z',
        reviewed_at: '2026-09-05T10:00:00.000Z',
        alerts: [
          { code: 'HIGH_OCCUPANCY', severity: 'warning', field: 'room_nights_sold', message: 'Ocupação muito alta.' },
        ],
        has_blocking_alerts: false,
        comparisons: {
          city_average_occupancy_rate: 61.2,
          sector_average_occupancy_rate: 63.7,
        },
      },
      {
        id: 3,
        trade_name: 'Hotel Central SRS',
        tax_id: '12345678000190',
        type: 'Hotel',
        rooms_count: 18,
        beds_count: 46,
      },
    )

    expect(envio.ano).toBe(2026)
    expect(envio.mes).toBe(8)
    expect(envio.nome).toBe('Hotel Central SRS')
    expect(envio.situacao).toBe('publicado')
    expect(envio.ocupacao).toBe(68)
    expect(envio.mediaCidade).toBe(61)
    expect(envio.mediaTipo).toBe(64)
    expect(envio.motivoViagem).toBe('Negócios e trabalho')
    expect(envio.origemHospedes).toBe('Sul de Minas')
    expect(envio.alertas).toHaveLength(1)

    const faltante = normalizarFaltante({
      id: 7,
      trade_name: 'Pousada da Serra',
      tax_id: '22345678000190',
      sector: { id: 1, name: 'Hospedagem' },
      last_reminder: {
        status: 'queued',
        sent_at: '2026-09-11T12:00:00.000Z',
      },
    })

    expect(faltante.id).toBe(7)
    expect(faltante.nome).toBe('Pousada da Serra')
    expect(faltante.ultimoLembrete?.status).toBe('queued')
  })

  it('calls merchant submission endpoints with exact methods, URLs, and Authorization header', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 99 }, meta: { page: 1, limit: 20, total: 1, total_pages: 1 } }),
    })

    await buscarMeuPainelEstabelecimento()
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/establishments/me/dashboard'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token-test' }),
      }),
    )

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1 }], meta: { page: 1, limit: 50, total: 1, total_pages: 1 } }),
    })
    const lista = await listarMeusEnvios({ status: 'approved', year: 2026, limit: 50 })
    expect(lista.data).toHaveLength(1)
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/submissions/me?status=approved&year=2026&limit=50')

    await criarEnvio({ reference_month: '2026-09-01', submit: true })
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/submissions')
    expect(fetchSpy.mock.calls.at(-1)[1].method).toBe('POST')

    await atualizarEnvio(99, { rooms_available: 18 })
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/submissions/99')
    expect(fetchSpy.mock.calls.at(-1)[1].method).toBe('PATCH')

    await submeterEnvio(99)
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/submissions/99/submit')
    expect(fetchSpy.mock.calls.at(-1)[1].method).toBe('POST')
  })

  it('calls city hall admin submission, reminder, dashboard, and establishment endpoints', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: { page: 1, limit: 20, total: 0, total_pages: 0 } }),
    })

    await listarEnviosAdmin({ status: 'submitted', overdue: true, limit: 100 })
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain(
      '/api/admin/submissions?status=submitted&overdue=true&limit=100',
    )

    await buscarEnvioAdmin(15)
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/15')

    await aprovarEnvioAdmin(15)
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/15/approve')
    expect(fetchSpy.mock.calls.at(-1)[1].method).toBe('POST')

    await aprovarEnvioAdmin(15, { override: true, justification: 'Confirmado por telefone com o hotel.' })
    expect(JSON.parse(fetchSpy.mock.calls.at(-1)[1].body)).toEqual({
      override: true,
      justification: 'Confirmado por telefone com o hotel.',
    })

    await devolverEnvioAdmin(15, 'Número de diárias inconsistente com quartos.')
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/15/return')
    expect(JSON.parse(fetchSpy.mock.calls.at(-1)[1].body)).toEqual({
      reason: 'Número de diárias inconsistente com quartos.',
    })

    await reabrirEnvioAdmin(15)
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/15/reopen')

    await listarFaltantesAdmin('2026-09', { limit: 50 })
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/missing?period=2026-09&limit=50')

    await enviarLembretesAdmin('2026-09', [4, 5])
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/submissions/reminders')
    expect(JSON.parse(fetchSpy.mock.calls.at(-1)[1].body)).toEqual({
      period: '2026-09',
      establishment_ids: [4, 5],
    })

    await buscarDashboardAdmin()
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/dashboard')

    await listarEstabelecimentosAdmin({ status: 'active', limit: 100 })
    expect(fetchSpy.mock.calls.at(-1)[0]).toContain('/api/admin/establishments?status=active&limit=100')
  })
})
