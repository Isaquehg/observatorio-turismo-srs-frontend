import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gravar, ler } from './armazenamento'

describe('armazenamento utility unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should return default value when key does not exist in localStorage', () => {
    expect(ler('chave_inexistente', 'padrao')).toBe('padrao')
  })

  it('should save and read a JSON serializable value', () => {
    const objeto = { usuario: 'Prefeitura', ativo: true }
    gravar('otsrs:teste', objeto)

    expect(ler('otsrs:teste', null)).toEqual(objeto)
  })

  it('should remove key from localStorage when value is null or undefined', () => {
    gravar('otsrs:remover', 'valor')
    expect(ler('otsrs:remover', null)).toBe('valor')

    gravar('otsrs:remover', null)
    expect(ler('otsrs:remover', 'vazio')).toBe('vazio')
  })

    it('should return default value if stored JSON is corrupted or getItem throws', () => {
    localStorage.setItem('otsrs:corrompido', '{json_invalido')
    expect(ler('otsrs:corrompido', 'fallback')).toBe('fallback')

    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })
    expect(ler('qualquer', 123)).toBe(123)
  })

  it('should silently ignore errors when setItem throws (e.g. private mode quota exceeded)', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => gravar('otsrs:erro', { a: 1 })).not.toThrow()
  })

})
