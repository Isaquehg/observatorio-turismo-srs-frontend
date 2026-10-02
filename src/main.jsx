import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { SessaoProvider } from './contexto/Sessao'
import { AvisosProvider } from './contexto/Avisos'
import { EnviosProvider } from './contexto/Envios'
import { AcessibilidadeProvider } from './contexto/Acessibilidade'
import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import './estilos/layout.css'
import './estilos/graficos.css'

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
