import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icone from './Icone'
import { useSessao, PERFIS } from '../contexto/Sessao'
import { useAcessibilidade } from '../contexto/Acessibilidade'
import { useFecharFora, useRolou, useTravarRolagem } from '../util/ganchos'
import { iniciais } from '../util/formatar'

// Sem login, o site mostra só Início, Indicadores públicos e Sobre
const LINKS_PUBLICOS = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/indicadores-publicos', rotulo: 'Indicadores públicos' },
  { para: '/explorar', rotulo: 'Explorar' },
  { para: '/sobre', rotulo: 'Sobre' },
]
const LINKS_COM_LOGIN = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/indicadores-publicos', rotulo: 'Indicadores públicos' },
  { para: '/explorar', rotulo: 'Explorar' },
  { para: '/indicadores', rotulo: 'Indicadores' },
  { para: '/relatorios', rotulo: 'Relatórios' },
  { para: '/sobre', rotulo: 'Sobre' },
]
const LINKS_TURISTA = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/turista', rotulo: 'Explorar a cidade' },
  ...LINKS_COM_LOGIN.slice(1),
]
export const linksDoSite = (sessao) => (!sessao ? LINKS_PUBLICOS : sessao.perfil === 'turista' ? LINKS_TURISTA : LINKS_COM_LOGIN)

export function OpcoesAcessibilidade() {
  const { prefs, definir, restaurar } = useAcessibilidade()
  const tamanhos = [
    ['normal', 'Tamanho normal'],
    ['maior', 'Texto maior'],
    ['grande', 'Texto grande'],
  ]
  return (
    <>
      <div className="suspenso__grupo">
        <span className="suspenso__rotulo" id="rotulo-fonte">Tamanho do texto</span>
        <div className="tamanho-fonte" role="group" aria-labelledby="rotulo-fonte">
          {tamanhos.map(([valor, rotulo]) => (
            <button key={valor} type="button" aria-pressed={prefs.fonte === valor} aria-label={rotulo} onClick={() => definir('fonte', valor)}>
              A
            </button>
          ))}
        </div>
      </div>
      <div className="suspenso__grupo">
        <label className="ot-check">
          <input
            type="checkbox"
            checked={prefs.movimento === 'reduzido'}
            onChange={(e) => definir('movimento', e.target.checked ? 'reduzido' : 'normal')}
          />
          Reduzir animações
        </label>
        <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" style={{ marginLeft: -12 }} onClick={restaurar}>
          Voltar ao padrão
        </button>
      </div>
    </>
  )
}

function MenuAcessibilidade() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const fechar = useCallback(() => setAberto(false), [])
  useFecharFora(ref, aberto, fechar)

  return (
    <div className="suspenso so-desktop" ref={ref}>
      <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <Icone nome="olho" /> Acessibilidade
      </button>
      {aberto && (
        <div className="suspenso__painel" role="dialog" aria-label="Opções de acessibilidade">
          <h2>Ajuste a leitura</h2>
          <OpcoesAcessibilidade />
        </div>
      )}
    </div>
  )
}

function MenuConta() {
  const { sessao, sair } = useSessao()
  const navegar = useNavigate()
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const fechar = useCallback(() => setAberto(false), [])
  useFecharFora(ref, aberto, fechar)
  const perfil = PERFIS[sessao.perfil]

  return (
    <div className="suspenso" ref={ref}>
      <button type="button" className="ot-usuario" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="ot-usuario__avatar" style={{ '--cor': perfil.cor }}>{sessao.perfil === 'prefeitura' ? 'ST' : iniciais(sessao.nome) || 'OT'}</span>
        <span className="so-desktop">{sessao.nome.split(' ')[0]}</span>
        <Icone nome="chevron" tamanho="s" />
      </button>
      {aberto && (
        <div className="suspenso__painel">
          <p className="corpo-s suave">Conectado como</p>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>{perfil.titulo}</p>
          <div className="suspenso__lista">
            <Link to={perfil.inicio} onClick={fechar}>
              <Icone nome={sessao.perfil === 'turista' ? 'mapa' : 'painel'} /> {{ turista: 'Explorar a cidade', comerciante: 'Área do comerciante', prefeitura: 'Painel da Prefeitura' }[sessao.perfil]}
            </Link>
            <button
              type="button"
              onClick={() => {
                sair()
                fechar()
                navegar('/')
              }}
            >
              <Icone nome="sair" /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Gaveta({ fechar }) {
  const { sessao } = useSessao()
  useTravarRolagem(true)
  const primeiroLink = useRef(null)

  useEffect(() => {
    primeiroLink.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [fechar])

  // Portal: o backdrop-filter do topo prenderia o position: fixed dentro dele
  return createPortal(
    <div className="gaveta" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="gaveta__topo">
        <img src="logos/observatorio.png" alt="Observatório do Turismo de Santa Rita do Sapucaí" />
        <button type="button" className="ot-btn ot-btn--fantasma ot-btn--icone" onClick={fechar} aria-label="Fechar menu">
          <Icone nome="x" />
        </button>
      </div>
      <nav className="gaveta__nav" aria-label="Principal">
        {linksDoSite(sessao).map((l, i) => (
          <NavLink key={l.para} to={l.para} end={l.fim} className="gaveta__link" ref={i === 0 ? primeiroLink : undefined} onClick={fechar}>
            {l.rotulo}
            <Icone nome="chevron-dir" />
          </NavLink>
        ))}
      </nav>
      <div className="gaveta__rodape">
        <div className="ot-cartao">
          <h2 className="titulo-3" style={{ marginBottom: 12 }}>Acessibilidade</h2>
          <OpcoesAcessibilidade />
        </div>
        {!sessao && (
          <Link to="/entrar" className="ot-btn ot-btn--primario ot-btn--g" onClick={fechar}>
            Entrar <Icone nome="seta" />
          </Link>
        )}
        <div className="gaveta__arte ot-gradiente" aria-hidden="true">
          <img src="ilustracoes/cidade.svg" alt="" />
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function Topo() {
  const { sessao } = useSessao()
  const [gaveta, setGaveta] = useState(false)
  const rolou = useRolou()
  const local = useLocation()
  const fecharGaveta = useCallback(() => setGaveta(false), [])

  useEffect(() => setGaveta(false), [local.pathname])

  return (
    <header className="topo" data-rolou={rolou} data-logado={!!sessao}>
      <div className="topo__barra">
        <Link className="topo__marca" to="/" aria-label="Observatório do Turismo de Santa Rita do Sapucaí — início">
          <img src="logos/observatorio.png" alt="" width="146" height="52" />
        </Link>
        <nav className="topo__nav" aria-label="Principal">
          {linksDoSite(sessao).map((l) => (
            <NavLink key={l.para} to={l.para} end={l.fim} className="topo__link">
              {l.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="topo__acoes">
          <MenuAcessibilidade />
          {sessao ? (
            <MenuConta />
          ) : (
            <Link className="ot-btn ot-btn--primario ot-btn--p" to="/entrar">
              Entrar <Icone nome="seta" tamanho="s" />
            </Link>
          )}
          <button
            type="button"
            className="ot-btn ot-btn--fantasma ot-btn--icone topo__menu-btn"
            aria-label="Abrir menu"
            aria-expanded={gaveta}
            onClick={() => setGaveta(true)}
          >
            <Icone nome="menu" />
          </button>
        </div>
      </div>
      {gaveta && <Gaveta fechar={fecharGaveta} />}
    </header>
  )
}
