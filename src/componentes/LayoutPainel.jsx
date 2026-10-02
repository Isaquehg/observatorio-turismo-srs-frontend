import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icone from './Icone'
import { useSessao } from '../contexto/Sessao'
import { useTravarRolagem } from '../util/ganchos'

/**
 * Casca das áreas logadas. `menu` é uma lista de seções:
 * [{ secao: 'Meu negócio', itens: [{ para, rotulo, icone, contador?, fim? }] }]
 */
export default function LayoutPainel({ perfil, menu, rodapeLateral }) {
  const { sessao, sair } = useSessao()
  const [aberto, setAberto] = useState(false)
  const local = useLocation()
  const navegar = useNavigate()
  const fechar = useCallback(() => setAberto(false), [])

  useTravarRolagem(aberto)
  useEffect(() => setAberto(false), [local.pathname])
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, fechar])

  if (!sessao || sessao.perfil !== perfil) {
    return <Navigate to={`/entrar?perfil=${perfil}`} replace state={{ voltarPara: local.pathname }} />
  }

  const encerrar = () => {
    sair()
    navegar('/')
  }

  return (
    <div className="painel" data-menu={aberto ? 'aberto' : 'fechado'}>
      <a className="pular-conteudo" href="#conteudo-painel">Pular para o conteúdo</a>

      <div className="painel__barra-movel">
        <button type="button" className="ot-btn ot-btn--fantasma ot-btn--icone" aria-label="Abrir menu do painel" aria-expanded={aberto} onClick={() => setAberto(true)}>
          <Icone nome="menu" />
        </button>
        <Link to="/" aria-label="Ir para o site público">
          <img src="logos/observatorio-branco.png" alt="" />
        </Link>
        <span style={{ width: 48 }} />
      </div>

      {aberto && <div className="painel__veu" onClick={fechar} aria-hidden="true" />}

      <aside className="lateral" aria-label="Menu do painel">
        <Link className="lateral__marca" to="/" aria-label="Observatório do Turismo — ir para o site público">
          <img src="logos/observatorio-branco.png" alt="" />
        </Link>
        <nav className="lateral__nav" aria-label="Painel">
          {menu.map((grupo) => (
            <div key={grupo.secao} className="pilha" style={{ gap: 4 }}>
              <div className="lateral__secao">{grupo.secao}</div>
              {grupo.itens.map((item) =>
                item.externo ? (
                  <Link key={item.para} className="lateral__link" to={item.para}>
                    <Icone nome={item.icone} />
                    {item.rotulo}
                    <Icone nome="externo" tamanho="s" className="lateral__ext" />
                  </Link>
                ) : (
                  <NavLink key={item.para} className="lateral__link" to={item.para} end={item.fim}>
                    <Icone nome={item.icone} />
                    {item.rotulo}
                    {item.contador > 0 && <span className="lateral__contador ot-num">{item.contador}</span>}
                  </NavLink>
                ),
              )}
            </div>
          ))}
          <div className="lateral__secao">Conta</div>
          <button type="button" className="lateral__link" onClick={encerrar}>
            <Icone nome="sair" />
            Sair
          </button>
        </nav>
        {rodapeLateral && <div className="lateral__rodape">{rodapeLateral}</div>}
      </aside>

      <main id="conteudo-painel" className="painel__principal" tabIndex={-1} style={{ outline: 'none' }}>
        <div className="painel__conteudo">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
