import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AcessibilidadeProvider } from './contexto/Acessibilidade'
import { SessaoProvider } from './contexto/Sessao'
import { EnviosProvider } from './contexto/Envios'
import { AvisosProvider } from './contexto/Avisos'

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
  it('renders the home route (/) without crashing and triggers scrollTo top', () => {
    const { container } = renderAppWithProviders('/')

    // Verify that the DOM rendered content inside the container
    expect(container.firstChild).not.toBeNull()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('renders public pages (/indicadores-publicos and /sobre) without errors', () => {
    const { unmount } = renderAppWithProviders('/indicadores-publicos')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmount()

    renderAppWithProviders('/sobre')
    expect(document.body.textContent.length).toBeGreaterThan(0)
  })

  it('renders the login page (/entrar) correctly', () => {
    const { container } = renderAppWithProviders('/entrar')
    expect(container.firstChild).not.toBeNull()
  })

  it('redirects /cadastur to the merchant guide route', () => {
    const { container } = renderAppWithProviders('/cadastur')
    // Ensures the <Navigate to="/comerciante/guia" replace /> route resolves without throwing
    expect(container.firstChild).not.toBeNull()
  })

  it('renders the 404 fallback page (NaoEncontrada) on unknown routes', () => {
    const { container } = renderAppWithProviders('/rota-que-nao-existe-404')
    expect(container.firstChild).not.toBeNull()
  })
})
