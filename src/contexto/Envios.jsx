import { createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import { enviosIniciais } from '../dados/painel'
import { ler, gravar } from '../util/armazenamento'

// Envios dos estabelecimentos. Compartilhado entre o painel da Prefeitura
// (que valida) e a área do comerciante (que envia).
const EnviosContexto = createContext(null)
const CHAVE = 'ot-srs:envios'

function reducer(estado, acao) {
  switch (acao.tipo) {
    case 'aprovar':
      return estado.map((e) => (e.id === acao.id ? { ...e, situacao: 'publicado' } : e))
    case 'devolver':
      return estado.map((e) => (e.id === acao.id ? { ...e, situacao: 'recusado', motivo: acao.motivo } : e))
    case 'reabrir':
      return estado.map((e) => (e.id === acao.id ? { ...e, situacao: 'analise', motivo: undefined } : e))
    case 'novo':
      return [{ ...acao.envio, id: Math.max(0, ...estado.map((e) => e.id)) + 1 }, ...estado.filter((e) => !(e.nome === acao.envio.nome && e.mes === acao.envio.mes && e.ano === acao.envio.ano))]
    case 'reiniciar':
      return enviosIniciais
    default:
      return estado
  }
}

export function EnviosProvider({ children }) {
  const [envios, despachar] = useReducer(reducer, null, () => ler(CHAVE, enviosIniciais))

  useEffect(() => gravar(CHAVE, envios), [envios])

  const valor = useMemo(() => {
    const pendentes = envios.filter((e) => e.situacao === 'analise')
    return { envios, pendentes, despachar }
  }, [envios])

  return <EnviosContexto.Provider value={valor}>{children}</EnviosContexto.Provider>
}

export const useEnvios = () => useContext(EnviosContexto)
