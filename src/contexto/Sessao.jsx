import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ler, gravar } from '../util/armazenamento'
import { CHAVE_SESSAO, definirTokenSessao, requisicaoApi } from '../util/api'

export const PERFIS = {
  turista: {
    id: 'turista',
    titulo: 'Turista ou visitante',
    texto: 'Onde ficar, o que comer e o que visitar na cidade.',
    cor: 'var(--azul-ceu)',
    arte: 'ilustracoes/turista.svg',
    icone: 'mala',
    campo: 'E-mail',
    vazio: 'Preencha o seu e-mail.',
    dica: 'Use o e-mail que você cadastrou.',
    inicio: '/turista',
  },
  comerciante: {
    id: 'comerciante',
    titulo: 'Comerciante local',
    texto: 'Hotéis, pousadas, restaurantes e serviços da cidade.',
    cor: 'var(--rosa)',
    arte: 'ilustracoes/comerciante.svg',
    icone: 'loja',
    campo: 'CNPJ do estabelecimento',
    vazio: 'Preencha o CNPJ do estabelecimento.',
    dica: 'Use o CNPJ cadastrado do seu estabelecimento. Só você vê os dados dele.',
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
    dica: 'Use o e-mail cadastrado na Prefeitura, terminado em @pmsrs.mg.gov.br.',
    inicio: '/prefeitura',
  },
}

// Maps backend JWT roles to the frontend profiles expected by RotaRestrita and Areas
const PAPEL_PARA_PERFIL = {
  admin_smcelt: 'prefeitura',
  establishment: 'comerciante',
  tourist: 'turista',
}

// Maps frontend profile keys to the profile values accepted by the auth endpoints
const PERFIL_PARA_API = {
  prefeitura: 'city_hall',
  comerciante: 'establishment',
  turista: 'tourist',
}

export function mapearPapelParaPerfil(role) {
  return PAPEL_PARA_PERFIL[role] || null
}

function lerSessaoInicial() {
  const salva = ler(CHAVE_SESSAO, null)
  if (!salva || typeof salva !== 'object') return null

  const perfil = salva.perfil || mapearPapelParaPerfil(salva.role)
  if (!perfil || !PERFIS[perfil]) return null

  return { ...salva, perfil }
}

function montarSessao(respostaApi, identificadorInformado) {
  const dados = respostaApi?.data
  const usuario = dados?.user
  const token = dados?.token
  const perfil = mapearPapelParaPerfil(usuario?.role)

  if (!token || !usuario || !perfil) {
    throw new Error('Resposta de autenticação inválida do servidor.')
  }

  return {
    perfil,
    nome: usuario.name || 'Visitante',
    identificador: identificadorInformado || usuario.email,
    email: usuario.email,
    role: usuario.role,
    token,
    ...(dados.refresh_token ? { refreshToken: dados.refresh_token } : {}),
    ...(dados.expires_in ? { expiresIn: dados.expires_in } : {}),
    usuario,
  }
}

const SessaoContexto = createContext(null)

export function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoInicial)
  const sessaoInicialRef = useRef(sessao)
  const sessaoAtualRef = useRef(sessao)
  sessaoAtualRef.current = sessao

  // Keep the API client's in-memory token synchronized with the active React session
  useEffect(() => {
    definirTokenSessao(sessao?.token || null)
    return () => definirTokenSessao(null)
  }, [sessao?.token])

  // Revalidate persisted JWT sessions against GET /api/auth/me on application startup
  useEffect(() => {
    const inicial = sessaoInicialRef.current
    if (!inicial?.token) return

    const controlador = new AbortController()
    let ativo = true

    requisicaoApi('/auth/me', { signal: controlador.signal })
      .then((resposta) => {
        if (!ativo || !resposta?.data) return
        const perfilMapeado = mapearPapelParaPerfil(resposta.data.role)
        if (!perfilMapeado) {
          definirTokenSessao(null)
          gravar(CHAVE_SESSAO, null)
          setSessao(null)
          return
        }

        setSessao((atual) => {
          if (!atual || atual.token !== inicial.token) return atual
          const atualizada = {
            ...atual,
            perfil: perfilMapeado,
            nome: resposta.data.name || atual.nome,
            email: resposta.data.email || atual.email,
            role: resposta.data.role,
            usuario: resposta.data,
          }
          if (ler(CHAVE_SESSAO, null)?.token === inicial.token) {
            gravar(CHAVE_SESSAO, atualizada)
          }
          return atualizada
        })
      })
      .catch((erro) => {
        if (!ativo || erro?.name === 'AbortError') return
        if (erro?.status === 401 || erro?.status === 404) {
          definirTokenSessao(null)
          gravar(CHAVE_SESSAO, null)
          setSessao((atual) => (atual?.token === inicial.token ? null : atual))
        }
      })

    return () => {
      ativo = false
      controlador.abort()
    }
  }, [])

  const aplicarSessao = useCallback((nova, manter) => {
    definirTokenSessao(nova.token || null)
    setSessao(nova)
    if (manter) {
      gravar(CHAVE_SESSAO, nova)
    } else {
      gravar(CHAVE_SESSAO, null)
    }
    return nova
  }, [])

  const entrar = useCallback(async (perfil, identificador, senha, manter = true) => {
    const corpo = {
      identifier: identificador,
      password: senha,
      ...(PERFIL_PARA_API[perfil] ? { profile: PERFIL_PARA_API[perfil] } : {}),
    }

    const resposta = await requisicaoApi('/auth/login', {
      method: 'POST',
      autenticado: false,
      body: JSON.stringify(corpo),
    })

    const nova = montarSessao(resposta, identificador)
    return aplicarSessao(nova, manter)
  }, [aplicarSessao])

  const cadastrar = useCallback(async ({ perfil, nome, identificador, email, senha, manter = true }) => {
    const corpo =
      perfil === 'comerciante'
        ? {
            profile: 'establishment',
            name: nome,
            tax_id: identificador,
            email,
            password: senha,
          }
        : {
            profile: 'tourist',
            name: nome,
            email: identificador,
            password: senha,
          }

    const resposta = await requisicaoApi('/auth/register', {
      method: 'POST',
      autenticado: false,
      body: JSON.stringify(corpo),
    })

    const nova = montarSessao(resposta, identificador)
    return aplicarSessao(nova, manter)
  }, [aplicarSessao])

  const solicitarAcesso = useCallback(async ({ nome, email, senha }) => {
    return requisicaoApi('/auth/access-requests', {
      method: 'POST',
      autenticado: false,
      body: JSON.stringify({
        name: nome,
        email,
        password: senha,
      }),
    })
  }, [])

  const sair = useCallback(() => {
    const atual = sessaoAtualRef.current
    const tokenAtual = atual?.token
    const refreshAtual = atual?.refreshToken

    definirTokenSessao(null)
    setSessao(null)
    gravar(CHAVE_SESSAO, null)

    // Best-effort refresh token revocation without blocking client logout
    if (tokenAtual && refreshAtual) {
      requisicaoApi('/auth/logout', {
        method: 'POST',
        autenticado: false,
        headers: { Authorization: `Bearer ${tokenAtual}` },
        body: JSON.stringify({ refresh_token: refreshAtual }),
      }).catch(() => {})
    }
  }, [])

  const valor = useMemo(
    () => ({ sessao, entrar, cadastrar, solicitarAcesso, sair }),
    [sessao, entrar, cadastrar, solicitarAcesso, sair],
  )
  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>
}

export const useSessao = () => useContext(SessaoContexto)
