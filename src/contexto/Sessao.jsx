import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ler, gravar } from '../util/armazenamento'
import { MEU_NEGOCIO } from '../dados/painel'

export const PERFIS = {
  turista: {
    id: 'turista',
    titulo: 'Turista ou visitante',
    texto: 'Consulte dados, relatórios e salve seus favoritos.',
    cor: 'var(--azul-ceu)',
    arte: 'ilustracoes/turista.svg',
    icone: 'mala',
    campo: 'E-mail',
    vazio: 'Preencha o seu e-mail.',
    dica: 'Use o e-mail que você cadastrou.',
    inicio: '/',
  },
  comerciante: {
    id: 'comerciante',
    titulo: 'Comerciante local',
    texto: 'Hotéis, pousadas, restaurantes e serviços da cidade.',
    cor: 'var(--rosa)',
    arte: 'ilustracoes/comerciante.svg',
    icone: 'loja',
    campo: 'CNPJ ou e-mail',
    vazio: 'Preencha o CNPJ ou o e-mail do estabelecimento.',
    dica: 'Use o CNPJ ou o e-mail cadastrado do seu estabelecimento.',
    inicio: '/comerciante',
  },
  prefeitura: {
    id: 'prefeitura',
    titulo: 'Prefeitura',
    texto: 'Equipe da SMCELT que publica e valida os dados.',
    cor: 'var(--ciano)',
    arte: 'ilustracoes/gestora.svg',
    icone: 'prefeitura',
    campo: 'E-mail institucional',
    vazio: 'Preencha o seu e-mail institucional.',
    dica: 'Use seu e-mail @pmsrs.mg.gov.br.',
    inicio: '/prefeitura',
  },
}

const SessaoContexto = createContext(null)
const CHAVE = 'ot-srs:sessao'

export function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(() => ler(CHAVE, null))

  const entrar = useCallback((perfil, identificador, manter) => {
    const nomes = {
      turista: identificador.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      comerciante: MEU_NEGOCIO.responsavel,
      prefeitura: 'SMCELT',
    }
    const nova = { perfil, nome: nomes[perfil] || 'Visitante', identificador }
    setSessao(nova)
    if (manter) gravar(CHAVE, nova)
    return nova
  }, [])

  const sair = useCallback(() => {
    setSessao(null)
    gravar(CHAVE, null)
  }, [])

  const valor = useMemo(() => ({ sessao, entrar, sair }), [sessao, entrar, sair])
  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>
}

export const useSessao = () => useContext(SessaoContexto)
