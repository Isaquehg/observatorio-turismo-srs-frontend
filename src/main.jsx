import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// Estilos globais antes do App, para que o CSS de cada página possa sobrescrevê-los.
import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import './estilos/layout.css'
import './estilos/graficos.css'
import App from './App'
import { SessaoProvider } from './contexto/Sessao'
import { AvisosProvider } from './contexto/Avisos'
import { EnviosProvider } from './contexto/Envios'
import { AcessibilidadeProvider } from './contexto/Acessibilidade'

// HashRouter: o site funciona em qualquer hospedagem estática, sem configurar o servidor.
createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <HashRouter>
      <AcessibilidadeProvider>
        <SessaoProvider>
          <EnviosProvider>
            <AvisosProvider>
              <App />
            </AvisosProvider>
          </EnviosProvider>
        </SessaoProvider>
      </AcessibilidadeProvider>
    </HashRouter>
  </StrictMode>,
)
