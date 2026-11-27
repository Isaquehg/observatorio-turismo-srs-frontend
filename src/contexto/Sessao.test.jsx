import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAVE_SESSAO, definirTokenSessao, obterTokenSessao } from '../util/api'
import { gravar, ler } from '../util/armazenamento'
import { mapearPapelParaPerfil, SessaoProvider, useSessao } from './Sessao'

function wrapper({ children }) {
  return <SessaoProvider>{children}</SessaoProvider>
}

describe('Sessao context unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    vi.restoreAllMocks()
  })

  it('maps backend roles to frontend profile identifiers', () => {
    expect(mapearPapelParaPerfil('admin_smcelt')).toBe('prefeitura')
    expect(mapearPapelParaPerfil('establishment')).toBe('comerciante')
    expect(mapearPapelParaPerfil('tourist')).toBe('turista')
    expect(mapearPapelParaPerfil('unknown_role')).toBeNull()
  })

  it('authenticates city hall user via POST /api/auth/login and persists token when manter is true', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: 'jwt-admin-token',
          refresh_token: 'refresh-admin',
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

    const { result } = renderHook(() => useSessao(), { wrapper })

    await act(async () => {
      await result.current.entrar('prefeitura', 'admin@pmsrs.mg.gov.br', 'senha123', true)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          identifier: 'admin@pmsrs.mg.gov.br',
          password: 'senha123',
          profile: 'city_hall',
        }),
      }),
    )

    expect(result.current.sessao).toMatchObject({
      perfil: 'prefeitura',
      nome: 'Admin SMCELT',
      email: 'admin@pmsrs.mg.gov.br',
      role: 'admin_smcelt',
      token: 'jwt-admin-token',
      refreshToken: 'refresh-admin',
    })
    expect(ler(CHAVE_SESSAO, null)).toMatchObject({
      perfil: 'prefeitura',
      token: 'jwt-admin-token',
    })
    expect(obterTokenSessao()).toBe('jwt-admin-token')
  })

  it('keeps JWT only in memory when manter is false and clears previous localStorage session', async () => {
    gravar(CHAVE_SESSAO, { perfil: 'turista', nome: 'Antigo', token: 'old-token' })

    vi.spyOn(globalThis, 'fetch')
      // Mount revalidation for the pre-existing stored token
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { id: 9, name: 'Antigo', email: 'antigo@email.com', role: 'tourist' },
        }),
      })
      // New establishment login with manter = false
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            token: 'jwt-merchant-memory',
            refresh_token: 'refresh-merchant',
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

    const { result } = renderHook(() => useSessao(), { wrapper })

    await act(async () => {
      await result.current.entrar('comerciante', '12.345.678/0001-90', 'senha123', false)
    })

    expect(result.current.sessao).toMatchObject({
      perfil: 'comerciante',
      nome: 'Hotel Central',
      identificador: '12.345.678/0001-90',
      token: 'jwt-merchant-memory',
    })
    expect(ler(CHAVE_SESSAO, null)).toBeNull()
    expect(obterTokenSessao()).toBe('jwt-merchant-memory')
  })

  it('clears session, localStorage, in-memory token, and revokes refresh token on sair()', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            token: 'jwt-tourist-token',
            refresh_token: 'refresh-tourist',
            expires_in: '8h',
            user: {
              id: 3,
              name: 'Ana Souza',
              email: 'ana@email.com',
              role: 'tourist',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

    const { result } = renderHook(() => useSessao(), { wrapper })

    await act(async () => {
      await result.current.entrar('turista', 'ana@email.com', 'senha123', true)
    })

    act(() => {
      result.current.sair()
    })

    expect(result.current.sessao).toBeNull()
    expect(ler(CHAVE_SESSAO, null)).toBeNull()
    expect(obterTokenSessao()).toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-tourist-token',
          }),
          body: JSON.stringify({ refresh_token: 'refresh-tourist' }),
        }),
      )
    })
  })

  it('supports tourist/establishment registration and city hall access requests', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            token: 'jwt-new-tourist',
            refresh_token: 'ref-1',
            expires_in: '8h',
            user: { id: 4, name: 'Ana Souza', email: 'ana@email.com', role: 'tourist' },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            token: 'jwt-new-merchant',
            refresh_token: 'ref-2',
            expires_in: '8h',
            user: { id: 5, name: 'Marina Alves', email: 'marina@pousada.com', role: 'establishment' },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({ data: { accepted: true } }),
      })

    const { result } = renderHook(() => useSessao(), { wrapper })

    await act(async () => {
      await result.current.cadastrar({
        perfil: 'turista',
        nome: 'Ana Souza',
        identificador: 'ana@email.com',
        senha: 'senha123',
        manter: true,
      })
    })
    expect(result.current.sessao?.perfil).toBe('turista')

    await act(async () => {
      await result.current.cadastrar({
        perfil: 'comerciante',
        nome: 'Marina Alves',
        identificador: '12.345.678/0001-90',
        email: 'marina@pousada.com',
        senha: 'senha123',
        manter: true,
      })
    })
    expect(result.current.sessao?.perfil).toBe('comerciante')

    await act(async () => {
      await result.current.solicitarAcesso({
        nome: 'Maria Silva',
        email: 'maria@pmsrs.mg.gov.br',
        senha: 'senha123',
      })
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
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

  it('keeps restored session when /auth/me fails with a transient network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    gravar(CHAVE_SESSAO, {
      perfil: 'prefeitura',
      nome: 'Admin SMCELT',
      token: 'jwt-still-saved',
    })

    const { result } = renderHook(() => useSessao(), { wrapper })

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
    expect(result.current.sessao).toMatchObject({
      perfil: 'prefeitura',
      token: 'jwt-still-saved',
    })
  })
})
