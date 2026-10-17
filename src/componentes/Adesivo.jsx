// Adesivos decorativos do sistema. No máximo um por bloco, sempre parados.
const RAIOS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

export function Adesivo({ tipo, cor = 'var(--amarelo)', tamanho = 60, style, className = '' }) {
  const props = { className: `ot-adesivo ${className}`, style, 'aria-hidden': true, focusable: 'false' }

  if (tipo === 'explosao') {
    return (
      <svg {...props} width={tamanho} height={tamanho} viewBox="-46 -46 92 92">
        <g fill={cor}>
          {RAIOS.map((r) => <rect key={r} x="-4" y="-44" width="8" height="26" rx="4" transform={`rotate(${r})`} />)}
        </g>
      </svg>
    )
  }
  if (tipo === 'estrela') {
    return (
      <svg {...props} width={tamanho} height={tamanho} viewBox="-40 -40 80 80">
        <path d="M0 -40 L9 -12 L38 -14 L14 4 L24 32 L0 14 L-24 32 L-14 4 L-38 -14 L-9 -12 Z" fill={cor} />
      </svg>
    )
  }
  if (tipo === 'brilho') {
    return (
      <svg {...props} width={tamanho} height={tamanho} viewBox="-30 -30 60 60">
        <path d="M0 -30 L7 -7 L30 0 L7 7 L0 30 L-7 7 L-30 0 L-7 -7 Z" fill={cor} />
      </svg>
    )
  }
  return null
}

