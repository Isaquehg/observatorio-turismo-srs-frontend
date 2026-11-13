import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { ler } from '../../util/armazenamento'

const estrela = (nome) => screen.getByRole('button', { name: `Salvar ${nome} nos favoritos` })

describe('Tourist area', () => {
  beforeEach(() => localStorage.clear())

  it('redirects to login when the visitor is not a tourist', () => {
    renderApp('/turista/favoritos', 'comerciante')
    expect(screen.getByRole('heading', { name: 'Como você quer entrar?' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Turista ou visitante/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('home shows an empty itinerary and the city calendar', () => {
    renderApp('/turista', 'turista')
    expect(screen.getByRole('heading', { name: 'Olá, Ana!' })).toBeInTheDocument()
    expect(screen.getAllByText('Nenhum ainda · ver opções')).toHaveLength(3)
    expect(screen.getByText('Festa de Santa Rita')).toBeInTheDocument()
  })

  it('guide lists the real places from the official portal', () => {
    renderApp('/turista/explorar', 'turista')
    expect(screen.getByText('Crisal Hotel')).toBeInTheDocument()
    expect(screen.getByText('Nano Coffee Lab')).toBeInTheDocument()
    expect(screen.getByText('Museu Histórico Delfim Moreira')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\(35\) 3471-3322/ })).toHaveAttribute('href', 'tel:+553534713322')
  })

  it('lodging filter shows only the chosen type', () => {
    renderApp('/turista/explorar', 'turista')
    const filtros = screen.getByRole('group', { name: 'Tipo de hospedagem' })
    fireEvent.click(within(filtros).getByRole('button', { name: 'Hotéis' }))
    const secao = document.getElementById('onde-ficar')
    expect(within(secao).getByText('Crisal Hotel')).toBeInTheDocument()
    expect(within(secao).queryByText('Camping Pedra do Osso')).not.toBeInTheDocument()
  })

  it('saved places show up grouped in the itinerary, with contact data, and can be removed', () => {
    const { unmount } = renderApp('/turista/explorar', 'turista')
    fireEvent.click(estrela('Crisal Hotel'))
    fireEvent.click(estrela('Nano Coffee Lab'))
    fireEvent.click(estrela('Museu Histórico Delfim Moreira'))
    expect(ler('ot-srs:favoritos', [])).toEqual(['hosp-crisal-hotel', 'comer-nano-coffee-lab', 'lugar-museu-historico-delfim-moreira'])
    unmount()

    renderApp('/turista/favoritos', 'turista')
    expect(screen.getByRole('heading', { name: /Onde ficar/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Onde comer/ })).toBeInTheDocument()
    expect(screen.getByText(/8h30/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tirar Nano Coffee Lab do roteiro' }))
    expect(screen.queryByText('Nano Coffee Lab')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Onde comer/ })).not.toBeInTheDocument()
  })

  it('home counts saved places per group', () => {
    localStorage.setItem('ot-srs:favoritos', JSON.stringify(['hosp-crisal-hotel', 'comer-nano-coffee-lab', 'comer-o-cortes']))
    renderApp('/turista', 'turista')
    expect(screen.getByText('1 lugar guardado')).toBeInTheDocument()
    expect(screen.getByText('2 lugares guardados')).toBeInTheDocument()
  })

  it('empty itinerary points to the guide', () => {
    renderApp('/turista/favoritos', 'turista')
    expect(screen.getByRole('heading', { name: 'Seu roteiro está vazio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir o guia/ })).toHaveAttribute('href', '/turista/explorar')
  })
})
