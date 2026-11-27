import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '../contexto/Avisos'
import { SessaoProvider } from '../contexto/Sessao'
import { CHAVE_SESSAO, definirTokenSessao } from '../util/api'
import { ler } from '../util/armazenamento'
import Entrar from './Entrar'

function renderEntrar(rotaInicial = '/entrar') {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <SessaoProvider>
        <AvisosProvider>
          <Routes>
            <Route path="/entrar" element={<Entrar />} />
            <Route path="/prefeitura" element={<div>Painel Prefeitura</div>} />
            <Route path="/comerciante" element={<div>Painel Comerciante</div>} />
            <Route path="/turista" element={<div>Area Turista</div>} />
          </Routes>
        </AvisosProvider>
      </SessaoProvider>
    </MemoryRouter>,
  )
}

describe('Entrar page API integration tests', () => {
  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    vi.restoreAllMocks()
  })

  it('authenticates city hall user with institutional email and navigates to /prefeitura', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: 'jwt-admin-123',
          refresh_token: 'refresh-admin-123',
          expires_in: '8h',
          user: {
            id: 1,
            name: 'Admin SMCELT',
            email: 'admin@pmsrs.mg.gov.br',
            role: 'admin_smcelt',
          },
        },
      }),
    })

    renderEntrar('/entrar?perfil=prefeitura')

    fireEvent.change(screen.getByLabelText('E-mail institucional'), {
      target: { value: 'admin@pmsrs.mg.gov.br' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'hashed_password_123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Painel Prefeitura')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          identifier: 'admin@pmsrs.mg.gov.br',
          password: 'hashed_password_123',
          profile: 'city_hall',
        }),
      }),
    )
    expect(ler(CHAVE_SESSAO, null)).toMatchObject({
      perfil: 'prefeitura',
      token: 'jwt-admin-123',
    })
  })

  it('authenticates establishment by CNPJ and respects unchecked "manter conectado"', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: 'jwt-est-456',
          refresh_token: 'refresh-est-456',
          expires_in: '8h',
          user: {
            id: 2,
            name: 'Hotel Central',
            email: 'contato@hotelcentral.com',
            role: 'establishment',
          },
        },
      }),
    })

    renderEntrar('/entrar?perfil=comerciante')

    fireEvent.change(screen.getByLabelText('CNPJ do estabelecimento'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'hashed_password_456' },
    })
    fireEvent.click(screen.getByLabelText('Manter conectado neste aparelho'))
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Painel Comerciante')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          identifier: '12.345.678/0001-90',
          password: 'hashed_password_456',
          profile: 'establishment',
        }),
      }),
    )
    expect(ler(CHAVE_SESSAO, null)).toBeNull()
  })

  it('displays API error message when credentials are invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciais inválidas.',
        },
      }),
    })

    renderEntrar('/entrar?perfil=prefeitura')

    fireEvent.change(screen.getByLabelText('E-mail institucional'), {
      target: { value: 'admin@pmsrs.mg.gov.br' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha_errada' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciais inválidas.')
    })
    expect(ler(CHAVE_SESSAO, null)).toBeNull()
  })

  it('maps backend VALIDATION_ERROR field details onto form inputs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          details: [{ field: 'identifier', message: 'O CNPJ informado não é válido.' }],
        },
      }),
    })

    renderEntrar('/entrar?perfil=comerciante')

    fireEvent.change(screen.getByLabelText('CNPJ do estabelecimento'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('O CNPJ informado não é válido.')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('Os dados enviados são inválidos.')
    })
  })

  it('registers tourist account via POST /api/auth/register and submits city hall access request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            token: 'jwt-tourist-1',
            refresh_token: 'refresh-tourist-1',
            expires_in: '8h',
            user: {
              id: 7,
              name: 'Ana Souza',
              email: 'ana@email.com',
              role: 'tourist',
            },
          },
        }),
      })

    renderEntrar('/entrar?perfil=turista&modo=criar')

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@email.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(screen.getByText('Area Turista')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          profile: 'tourist',
          name: 'Ana Souza',
          email: 'ana@email.com',
          password: 'senha123',
        }),
      }),
    )
  })

  it('registers establishment account with CNPJ and email via POST /api/auth/register', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          token: 'jwt-merchant-new',
          refresh_token: 'refresh-merchant-new',
          expires_in: '8h',
          user: {
            id: 8,
            name: 'Marina Alves',
            email: 'contato@pousada.com.br',
            role: 'establishment',
          },
        },
      }),
    })

    renderEntrar('/entrar?perfil=comerciante&modo=criar')

    fireEvent.change(screen.getByLabelText('Nome do responsável'), {
      target: { value: 'Marina Alves' },
    })
    fireEvent.change(screen.getByLabelText('CNPJ do estabelecimento'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'contato@pousada.com.br' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(screen.getByText('Painel Comerciante')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          profile: 'establishment',
          name: 'Marina Alves',
          tax_id: '12.345.678/0001-90',
          email: 'contato@pousada.com.br',
          password: 'senha123',
        }),
      }),
    )
  })

  it('submits city hall access request via POST /api/auth/access-requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({ data: { accepted: true } }),
    })

    renderEntrar('/entrar?perfil=prefeitura&modo=criar')

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Maria Silva' },
    })
    fireEvent.change(screen.getByLabelText('E-mail institucional'), {
      target: { value: 'maria@pmsrs.mg.gov.br' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /pedir acesso/i }))

    await waitFor(() => {
      expect(screen.getByText('Pedido enviado')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/access-requests'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Maria Silva',
          email: 'maria@pmsrs.mg.gov.br',
          password: 'senha123',
        }),
      }),
    )
  })

  it('triggers POST /api/auth/forgot-password when email is provided and forgot password is clicked', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({ data: { accepted: true } }),
    })

    renderEntrar('/entrar?perfil=prefeitura')

    fireEvent.change(screen.getByLabelText('E-mail institucional'), {
      target: { value: 'admin@pmsrs.mg.gov.br' },
    })
    fireEvent.click(screen.getByRole('button', { name: /esqueci minha senha/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'admin@pmsrs.mg.gov.br' }),
        }),
      )
    })
    expect(screen.getByText('Enviamos as instruções')).toBeInTheDocument()
  })
})
