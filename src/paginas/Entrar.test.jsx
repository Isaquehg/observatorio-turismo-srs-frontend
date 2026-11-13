import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderApp } from '../test/renderApp'
import { ler } from '../util/armazenamento'

const preencher = (campos) => Object.entries(campos).forEach(([id, valor]) => fireEvent.change(document.getElementById(id), { target: { value: valor } }))
const enviar = () => fireEvent.click(document.querySelector('form button[type=submit]'))
const esperarEnvio = () => act(() => vi.advanceTimersByTime(700))

describe('Login and sign-up', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('sign-up asks for a name and matching passwords', () => {
    renderApp('/entrar?perfil=turista&modo=criar')
    enviar()
    expect(screen.getByText('Digite seu nome completo.')).toBeInTheDocument()

    preencher({ nome: 'Ana Paula Lima', usuario: 'ana@email.com', senha: '123456', confirmar: '654321' })
    enviar()
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
  })

  it('tourist sign-up logs in with the given name and opens the tourist area', () => {
    renderApp('/entrar?perfil=turista&modo=criar')
    preencher({ nome: 'Ana Paula Lima', usuario: 'ana@email.com', senha: '123456', confirmar: '123456' })
    enviar()
    esperarEnvio()
    expect(ler('ot-srs:sessao', null)).toMatchObject({ perfil: 'turista', nome: 'Ana Paula Lima' })
    expect(screen.getByRole('heading', { name: 'Olá, Ana!' })).toBeInTheDocument()
  })

  it('city hall sign-up only sends an access request, without logging in', () => {
    renderApp('/entrar?perfil=prefeitura&modo=criar')
    preencher({ nome: 'Carlos Silva', usuario: 'carlos@pmsrs.mg.gov.br', senha: '123456', confirmar: '123456' })
    enviar()
    esperarEnvio()
    expect(ler('ot-srs:sessao', null)).toBeNull()
    expect(screen.getByText('Pedido enviado')).toBeInTheDocument()
  })

  it('city hall login requires the institutional e-mail', () => {
    renderApp('/entrar?perfil=prefeitura')
    preencher({ usuario: 'carlos@gmail.com', senha: '123456' })
    enviar()
    expect(document.getElementById('usuario-erro')).toHaveTextContent('Use seu e-mail institucional, terminado em @pmsrs.mg.gov.br.')
  })

  it('merchant login validates the CNPJ length', () => {
    renderApp('/entrar?perfil=comerciante')
    preencher({ usuario: '12.345.678/0001', senha: '123456' })
    enviar()
    expect(screen.getByText('O CNPJ tem 14 números. Confira se faltou algum.')).toBeInTheDocument()
  })
})
