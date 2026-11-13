import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../test/renderApp'
import { ler } from '../util/armazenamento'
import { periodoAtual } from './comerciante/prazo'

describe('Merchant and city hall panels', () => {
  beforeEach(() => localStorage.clear())

  it('monthly deadline: previous month, due on the 10th', () => {
    expect(periodoAtual(new Date(2026, 9, 4))).toMatchObject({ ano: 2026, mes: 9, diasRestantes: 7, encerrado: false })
    expect(periodoAtual(new Date(2026, 9, 15))).toMatchObject({ mes: 9, encerrado: true, diasRestantes: 0 })
    expect(periodoAtual(new Date(2027, 0, 3))).toMatchObject({ ano: 2026, mes: 12 })
  })

  it('merchant home greets the person and asks for the pending month', () => {
    renderApp('/comerciante', 'comerciante')
    expect(screen.getByRole('heading', { name: 'Olá, Marina!' })).toBeInTheDocument()
    expect(screen.getByText(/envie os dados de/)).toHaveTextContent('setembro')
  })

  it('merchant showcase requires a description and saves what tourists see', () => {
    renderApp('/comerciante/estabelecimento', 'comerciante')
    fireEvent.change(document.getElementById('descricao'), { target: { value: 'curto' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar alterações/ }))
    expect(screen.getByText(/ao menos 20 caracteres/)).toBeInTheDocument()

    fireEvent.change(document.getElementById('area'), { target: { value: 'Zona rural' } })
    fireEvent.change(document.getElementById('descricao'), { target: { value: 'Refúgio com vista para a serra e café colonial.' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar alterações/ }))
    expect(ler('ot-srs:estabelecimento', {})).toMatchObject({ area: 'Zona rural', descricao: 'Refúgio com vista para a serra e café colonial.', publicar: true })
  })

  it('inventory: publishing an attraction needs a description and is saved', () => {
    renderApp('/prefeitura/inventario', 'prefeitura')
    const linha = screen.getByText('Mirante da serra').closest('tr')
    fireEvent.click(within(linha).getByRole('button', { name: /Editar/ }))
    const dialogo = screen.getByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('checkbox'))
    fireEvent.click(within(dialogo).getByRole('button', { name: /Salvar/ }))
    expect(within(dialogo).getByText(/ao menos 20 caracteres/)).toBeInTheDocument()

    fireEvent.change(within(dialogo).getByLabelText('Descrição para o turista'), { target: { value: 'Vista ampla da cidade, ótimo para o pôr do sol.' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: /Salvar/ }))
    const salvo = ler('ot-srs:inventario', []).find((i) => i.nome === 'Mirante da serra')
    expect(salvo).toMatchObject({ publicar: true, descricao: 'Vista ampla da cidade, ótimo para o pôr do sol.' })
    expect(screen.getByText('Mirante da serra').closest('tr')).toHaveTextContent('Visível no site')
  })

  it('establishments table flags occupancy above 100% and paginates', () => {
    renderApp('/prefeitura/estabelecimentos', 'prefeitura')
    expect(screen.getByTitle(/acima de 100%/)).toHaveTextContent('112%')
    expect(document.querySelectorAll('tbody tr')).toHaveLength(10)
    fireEvent.click(screen.getByRole('button', { name: /Mostrar todos/ }))
    expect(document.querySelectorAll('tbody tr').length).toBeGreaterThan(10)
  })
})
