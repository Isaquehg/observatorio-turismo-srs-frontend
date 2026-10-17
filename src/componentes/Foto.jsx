import { FOTOS } from '../dados/turismo'

// Foto com crédito do autor e licença (exigência das licenças Creative Commons)
export default function Foto({ chave, alt, className = '', proporcao = '4 / 3' }) {
  const c = FOTOS[chave]
  return (
    <figure className={`ot-foto ${className}`} style={{ aspectRatio: proporcao }}>
      <img src={`fotos/${chave}.jpg`} alt={alt} loading="lazy" />
      {c && (
        <figcaption className="ot-foto__credito">
          <a href={c.fonte} target="_blank" rel="noreferrer">Foto: {c.autor} · {c.licenca}</a>
        </figcaption>
      )}
    </figure>
  )
}
