import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
