import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RotaRestrita from './RotaRestrita'
import { SessaoProvider } from '../contexto/Sessao'
import { gravar } from '../util/armazenamento'

function renderRotaComSessao(rotaInicial, perfilObrigatorio) {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <SessaoProvider>
        <Routes>
          <Route path="/entrar" element={<div>Tela de Login</div>} />
          <Route element={<RotaRestrita perfil={perfilObrigatorio} />}>
            <Route path="/protegida" element={<div>Conteudo Protegido</div>} />
          </Route>
        </Routes>
      </SessaoProvider>
    </MemoryRouter>
  )
}

describe('RotaRestrita unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects to /entrar when user is not logged in', () => {
    renderRotaComSessao('/protegida')
    expect(screen.getByText('Tela de Login')).toBeDefined()
  })

  it('allows access to protected outlet when user is logged in with valid session', () => {
    gravar('ot-srs:sessao', { perfil: 'comerciante', nome: 'Comerciante' })
    renderRotaComSessao('/protegida')
    expect(screen.getByText('Conteudo Protegido')).toBeDefined()
  })

  it('redirects to /entrar when user profile does not match required role', () => {
    gravar('ot-srs:sessao', { perfil: 'turista', nome: 'Turista' })
    renderRotaComSessao('/protegida', 'prefeitura')
    expect(screen.getByText('Tela de Login')).toBeDefined()
  })

  it('allows access with JWT session mapped from admin_smcelt and keeps access after /auth/me validates', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 1,
          name: 'Admin SMCELT',
          email: 'admin@pmsrs.mg.gov.br',
          role: 'admin_smcelt',
        },
      }),
    })

    gravar('ot-srs:sessao', {
      perfil: 'prefeitura',
      role: 'admin_smcelt',
      nome: 'Admin SMCELT',
      token: 'jwt-admin-token',
    })

    renderRotaComSessao('/protegida', 'prefeitura')
    expect(screen.getByText('Conteudo Protegido')).toBeDefined()

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.any(Object),
      )
    })
    expect(screen.getByText('Conteudo Protegido')).toBeDefined()
  })

  it('redirects to /entrar when persisted JWT session fails /auth/me with 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: { code: 'UNAUTHORIZED', message: 'Token de autenticação inválido.' },
      }),
    })

    gravar('ot-srs:sessao', {
      perfil: 'comerciante',
      role: 'establishment',
      nome: 'Hotel Central',
      token: 'expired-jwt',
    })

    renderRotaComSessao('/protegida', 'comerciante')

    await waitFor(() => {
      expect(screen.getByText('Tela de Login')).toBeDefined()
    })
    expect(localStorage.getItem('ot-srs:sessao')).toBeNull()
  })
})
