import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MESES_CURTOS,
  MESES_LONGOS,
  baixarCsv,
  dataCurta,
  decimal,
  diferenca,
  iniciais,
  mesAno,
  mesAnoLongo,
  normalizar,
  numero,
  pct,
  variacao,
} from './formatar'

describe('formatar utility unit tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should format integers, decimals, and percentages in pt-BR locale', () => {
    expect(numero(null)).toBe('—')
    expect(numero(undefined)).toBe('—')
    expect(numero(Number.NaN)).toBe('—')
    expect(numero(1500)).toBe('1.500')

    expect(decimal(12.34)).toBe('12,3')

    expect(pct(null)).toBe('—')
    expect(pct(78.6)).toBe('79%')
  })

  it('should calculate percentage variation with plus or minus sign', () => {
    expect(variacao(100, 0)).toBeNull()
    expect(variacao(100, null)).toBeNull()

    const positiva = variacao(120, 100)
    expect(positiva).toEqual({ valor: 20, texto: '+20,0%' })

    const negativa = variacao(80, 100)
    expect(negativa).toEqual({ valor: -20, texto: '−20,0%' })
  })

  it('should calculate absolute difference with optional suffix', () => {
    expect(diferenca(150, 100, ' leitos')).toEqual({
      valor: 50,
      texto: '+50 leitos',
    })

    expect(diferenca(80, 100)).toEqual({
      valor: -20,
      texto: '−20',
    })
  })

  it('should format dates and month-year strings', () => {
    expect(MESES_CURTOS).toHaveLength(12)
    expect(MESES_LONGOS).toHaveLength(12)

    expect(dataCurta('2026-09-12')).toBe('12 set. 2026')
    expect(mesAno(2026, 9)).toBe('Set. 2026')
    expect(mesAnoLongo(2026, 9)).toBe('setembro de 2026')
  })

  it('should extract up to two initials ignoring short prepositions', () => {
    expect(iniciais('Hotel da Mantiqueira Sul')).toBe('HM')
    expect(iniciais('Pousada do Sol')).toBe('PS')
  })

  it('should normalize strings by removing accents and converting to lowercase', () => {
    expect(normalizar('São Gonçalo do Sapucaí')).toBe('sao goncalo do sapucai')
  })

  it('should generate and trigger a CSV download with escaped special characters', () => {
    vi.useFakeTimers()

    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-csv-url')
    const revokeObjectURLMock = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLMock
    globalThis.URL.revokeObjectURL = revokeObjectURLMock

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    baixarCsv('relatorio.csv', [
      ['Nome', 'Observação'],
      ['Hotel Central', 'Texto com "aspas"; e ponto e vírgula'],
      [null, undefined],
    ])

    expect(createObjectURLMock).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()

    // Fast-forward timer to trigger URL.revokeObjectURL cleanup
    vi.advanceTimersByTime(1000)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-csv-url')

    vi.useRealTimers()
  })
})
