import { useState } from 'react'
import Icone from './Icone'
import { FOTOS } from '../dados/turismo'

// Foto com crédito do autor e licença (exigência das licenças Creative Commons).
// Se o arquivo ainda não existe em public/fotos/, mostra um espaço reservado no lugar.
export default function Foto({ chave, alt, className = '', proporcao = '4 / 3', icone = 'mapa' }) {
  const [faltando, setFaltando] = useState(false)
  const c = FOTOS[chave]

  if (faltando) {
    return (
      <figure className={`ot-foto ot-foto--reservada ${className}`} style={{ aspectRatio: proporcao }} role="img" aria-label={`${alt} (foto em breve)`}>
        <Icone nome={icone} tamanho="l" />
        <span>Foto em breve</span>
      </figure>
    )
  }

  return (
    <figure className={`ot-foto ${className}`} style={{ aspectRatio: proporcao }}>
      <img src={`fotos/${chave}.jpg`} alt={alt} loading="lazy" onError={() => setFaltando(true)} />
      {c && (
        <figcaption className="ot-foto__credito">
          <a href={c.fonte} target="_blank" rel="noreferrer">Foto: {c.autor} · {c.licenca}</a>
        </figcaption>
      )}
    </figure>
  )
}
