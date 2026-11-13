import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AcessibilidadeProvider } from '../contexto/Acessibilidade'
import { SessaoProvider } from '../contexto/Sessao'
import { EnviosProvider } from '../contexto/Envios'
import { AvisosProvider } from '../contexto/Avisos'
import { gravar } from '../util/armazenamento'

export const SESSOES = {
  turista: { perfil: 'turista', nome: 'Ana Paula Lima', identificador: 'ana@email.com' },
  comerciante: { perfil: 'comerciante', nome: 'Marina Alves', identificador: '12.345.678/0001-90' },
  prefeitura: { perfil: 'prefeitura', nome: 'SMCELT', identificador: 'carlos@pmsrs.mg.gov.br' },
}

// Renders the whole App, like main.jsx, optionally already logged in as a profile
export function renderApp(rota, perfil) {
  if (perfil) gravar('ot-srs:sessao', SESSOES[perfil])
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AcessibilidadeProvider>
        <SessaoProvider>
          <EnviosProvider>
            <AvisosProvider>
              <App />
            </AvisosProvider>
          </EnviosProvider>
        </SessaoProvider>
      </AcessibilidadeProvider>
    </MemoryRouter>,
  )
}
