import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AcessibilidadeProvider } from './contexto/Acessibilidade'
import { SessaoProvider } from './contexto/Sessao'
import { EnviosProvider } from './contexto/Envios'
import { AvisosProvider } from './contexto/Avisos'
import { gravar } from './util/armazenamento'

// Helper to render App with the exact same Provider tree as main.jsx
function renderAppWithProviders(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AcessibilidadeProvider>
        <SessaoProvider>
          <EnviosProvider>
            <AvisosProvider>
              <App />
            </AvisosProvider>
          </EnviosProvider>
        </SessaoProvider>
      </AcessibilidadeProvider>
    </MemoryRouter>
  )
}

describe('App Smoke Tests (Providers & Routing)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders public pages (/ , /indicadores-publicos, /conheca-a-cidade, /sobre, /status-api) without crashing', () => {
    const publicRoutes = ['/', '/indicadores-publicos', '/conheca-a-cidade', '/sobre', '/status-api']

    for (const route of publicRoutes) {
      const { unmount } = renderAppWithProviders(route)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('renders login page (/entrar), redirects (/cadastur, /explorar), and 404 fallback page', () => {
    const routes = ['/entrar', '/cadastur', '/explorar', '/rota-inexistente-404']

    for (const route of routes) {
      const { unmount } = renderAppWithProviders(route)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('redirects unauthenticated users trying to access restricted routes to /entrar', () => {
    const { unmount } = renderAppWithProviders('/indicadores')
    // Unauthenticated user should be redirected to login screen
    expect(document.body.textContent).toContain('Entrar')
    unmount()
  })

  it('renders authenticated common restricted routes (/indicadores and /relatorios) when logged in', () => {
    gravar('ot-srs:sessao', { perfil: 'turista', nome: 'Visitante', identificador: 'turista@email.com' })

    const { unmount: unmountInd } = renderAppWithProviders('/indicadores')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmountInd()

    const { unmount: unmountRel } = renderAppWithProviders('/relatorios')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmountRel()
  })

  it('renders tourist restricted area (/turista) when logged in as turista', () => {
    gravar('ot-srs:sessao', { perfil: 'turista', nome: 'Visitante', identificador: 'turista@email.com' })

    const { unmount } = renderAppWithProviders('/turista')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmount()
  })

  it('renders all merchant panel routes (/comerciante/*)', () => {
    gravar('ot-srs:sessao', { perfil: 'comerciante', nome: 'Restaurante Central', identificador: '12345678000199' })

    const rotasComerciante = [
      '/comerciante',
      '/comerciante/enviar',
      '/comerciante/historico',
      '/comerciante/estabelecimento',
      '/comerciante/guia',
    ]

    for (const rota of rotasComerciante) {
      const { unmount } = renderAppWithProviders(rota)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('renders all city hall panel routes (/prefeitura/*)', () => {
    gravar('ot-srs:sessao', { perfil: 'prefeitura', nome: 'SMCELT', identificador: 'turismo@pmsrs.mg.gov.br' })

    const rotasPrefeitura = [
      '/prefeitura',
      '/prefeitura/envios',
      '/prefeitura/estabelecimentos',
      '/prefeitura/relatorios',
      '/prefeitura/inventario',
    ]

    for (const rota of rotasPrefeitura) {
      const { unmount } = renderAppWithProviders(rota)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })
})
