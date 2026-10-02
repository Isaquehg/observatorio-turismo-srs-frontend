import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icone from './Icone'

const SELOS = {
  publicado: { classe: 'ot-selo--publicado', icone: 'check-circulo', rotulo: 'Publicado' },
  analise: { classe: 'ot-selo--analise', icone: 'relogio', rotulo: 'Em análise' },
  recusado: { classe: 'ot-selo--recusado', icone: 'x-circulo', rotulo: 'Devolvido' },
}

export function Selo({ situacao, children, icone, className = '' }) {
  const s = SELOS[situacao] || {}
  return (
    <span className={`ot-selo ${s.classe || ''} ${className}`}>
      <Icone nome={icone || s.icone || 'info'} />
      {children || s.rotulo}
    </span>
  )
}

export function Aviso({ tipo, icone, titulo, children, style }) {
  const padrao = { sucesso: 'check-circulo', alerta: 'alerta', erro: 'x-circulo' }
  return (
    <div className={`ot-aviso ${tipo ? `ot-aviso--${tipo}` : ''}`} style={style} role={tipo === 'erro' ? 'alert' : undefined}>
      <Icone nome={icone || padrao[tipo] || 'info'} />
      <div>
        {titulo && <strong>{titulo}</strong>}
        {children}
      </div>
    </div>
  )
}

export function Migalhas({ atual }) {
  return (
    <nav className="migalhas" aria-label="Você está em">
      <Link to="/">Início</Link>
      <span aria-hidden="true">›</span>
      <strong aria-current="page">{atual}</strong>
    </nav>
  )
}

export function Sobretitulo({ children, cor, className = '' }) {
  return <span className={`ot-sobretitulo ${cor ? `ot-sobretitulo--${cor}` : ''} ${className}`}>{children}</span>
}

export function Variacao({ texto, valor, invertida = false }) {
  if (valor == null) return null
  const sobe = valor >= 0
  const neutra = valor === 0
  const classe = neutra ? 'ot-variacao--neutra' : sobe !== invertida ? 'ot-variacao--sobe' : 'ot-variacao--desce'
  return (
    <span className={`ot-variacao ${classe}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d={sobe ? 'M6 1.5L11 10H1z' : 'M6 10.5L1 2h10z'} fill="currentColor" />
      </svg>
      <span className="ot-num">{texto}</span>
      <span className="sr-only">{sobe ? 'alta' : 'queda'}</span>
    </span>
  )
}

export function Dialogo({ aberto, aoFechar, titulo, children, acoes, largura }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className="ot-dialogo"
      style={largura ? { width: `min(${largura}px, calc(100vw - 32px))` } : undefined}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
      aria-labelledby="dialogo-titulo"
    >
      {aberto && (
        <div className="ot-dialogo__corpo">
          <div className="ot-dialogo__cab">
            <h2 className="titulo-2" id="dialogo-titulo">{titulo}</h2>
            <button type="button" className="ot-btn ot-btn--fantasma ot-btn--icone" onClick={aoFechar} aria-label="Fechar">
              <Icone nome="x" />
            </button>
          </div>
          {children}
          {acoes && <div className="ot-dialogo__acoes">{acoes}</div>}
        </div>
      )}
    </dialog>
  )
}

export function Campo({ id, rotulo, extra, ajuda, erro, children }) {
  return (
    <div className="ot-campo">
      <label className="ot-rotulo" htmlFor={id}>
        {rotulo} {extra && <small>{extra}</small>}
      </label>
      {children}
      {erro ? (
        <span className="ot-ajuda ot-ajuda--erro" id={`${id}-ajuda`}>
          <Icone nome="alerta" tamanho="s" /> {erro}
        </span>
      ) : (
        ajuda && <span className="ot-ajuda" id={`${id}-ajuda`}>{ajuda}</span>
      )}
    </div>
  )
}
