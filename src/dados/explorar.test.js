import { beforeEach, describe, expect, it } from 'vitest'
import { CHAVE_ESTABELECIMENTO, CHAVE_INVENTARIO, hospedagensVisiveis, pontosVisiveis, slug, todosOsLugares } from './explorar'
import { inventarioInicial } from './painel'
import { gravar } from '../util/armazenamento'

const nomes = (lista) => lista.map((l) => l.nome)

describe('explorar data rules', () => {
  beforeEach(() => localStorage.clear())

  it('slug ignores accents and punctuation so saved ids survive list changes', () => {
    expect(slug('Museu Histórico Delfim Moreira')).toBe('museu-historico-delfim-moreira')
    expect(slug("Grandpa Joel's Coffee")).toBe('grandpa-joel-s-coffee')
  })

  it('every place has a unique id', () => {
    const ids = todosOsLugares().map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('inventory item published with a description is added to "O que visitar"', () => {
    const antes = pontosVisiveis().length
    gravar(CHAVE_INVENTARIO, inventarioInicial.map((i) => (i.nome === 'Trilha do Ribeirão' ? { ...i, publicar: true, descricao: 'Trilha leve na zona rural, boa para ir de manhã.' } : i)))
    const depois = pontosVisiveis()
    expect(depois).toHaveLength(antes + 1)
    expect(depois.at(-1)).toMatchObject({ nome: 'Trilha do Ribeirão', local: 'Zona rural' })
  })

  it('published inventory item without description, or not an attraction, stays off the site', () => {
    const antes = pontosVisiveis().length
    gravar(CHAVE_INVENTARIO, inventarioInicial.map((i) => (
      i.nome === 'Trilha do Ribeirão' ? { ...i, publicar: true, descricao: '' }
        : i.nome === 'Rodoviária Municipal' ? { ...i, publicar: true, descricao: 'Terminal de ônibus no centro da cidade.' } : i
    )))
    expect(pontosVisiveis()).toHaveLength(antes)
  })

  it('unpublishing an inventory item hides the fixed place with the same name', () => {
    expect(nomes(pontosVisiveis())).toContain('Praça Santa Rita')
    gravar(CHAVE_INVENTARIO, inventarioInicial.map((i) => (i.nome === 'Praça Santa Rita' ? { ...i, publicar: false } : i)))
    expect(nomes(pontosVisiveis())).not.toContain('Praça Santa Rita')
  })

  it('merchant showcase updates the example card and can hide it', () => {
    const exemplo = () => hospedagensVisiveis().find((h) => h.exemplo)
    expect(exemplo()).toMatchObject({ bairro: 'Centro', preco: '$$' })

    gravar(CHAVE_ESTABELECIMENTO, { area: 'Zona rural', preco: '$$$', descricao: 'Vista para a serra.', destaques: 'Piscina, Lareira, Pets, Extra', publicar: true })
    expect(exemplo()).toMatchObject({ bairro: 'Zona rural', preco: '$$$', descricao: 'Vista para a serra.', destaques: ['Piscina', 'Lareira', 'Pets'] })

    gravar(CHAVE_ESTABELECIMENTO, { publicar: false })
    expect(exemplo()).toBeUndefined()
    expect(hospedagensVisiveis()).toHaveLength(10)
  })
})
