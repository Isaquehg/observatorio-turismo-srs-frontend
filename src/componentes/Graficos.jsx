import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { numero } from '../util/formatar'

const TINTA = '#1C1838'
const TINTA_SUAVE = '#4E4867'
const LINHA = '#E4DFEE'
const FONTE = 'Atkinson Hyperlegible Next, Verdana, sans-serif'

// Mede a largura real do contêiner: os gráficos são desenhados em pixels
// para o texto não encolher no celular.
function useLargura() {
  const ref = useRef(null)
  const [largura, setLargura] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(([e]) => setLargura(Math.floor(e.contentRect.width)))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, largura]
}

// Anima de 0 a 1 quando o componente aparece na tela
function useEntrada() {
  const ref = useRef(null)
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisivel(true), { threshold: 0.2 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visivel]
}

export function Minilinha({ valores, largura = 72, altura = 30 }) {
  if (!valores || valores.length < 2) return null
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const faixa = max - min || 1
  const pontos = valores
    .map((v, i) => `${((i / (valores.length - 1)) * largura).toFixed(1)},${(altura - 4 - ((v - min) / faixa) * (altura - 8)).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <polyline points={pontos} fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Linhas mensais. A primeira série é a principal (linha cheia, área e pontos);
 * as demais entram tracejadas para comparação.
 */
export function GraficoLinha({ series, rotulos, max = 100, sufixo = '%', altura = 260, descricao }) {
  const [ref, largura] = useLargura()
  const [foco, setFoco] = useState(null)

  const margem = { esq: 44, dir: 12, topo: 16, base: 34 }
  const w = Math.max(largura, 280)
  const areaW = w - margem.esq - margem.dir
  const areaH = altura - margem.topo - margem.base
  const x = (i) => margem.esq + 10 + (i / (rotulos.length - 1)) * (areaW - 20)
  const y = (v) => margem.topo + areaH - (v / max) * areaH
  const passoRotulo = w < 420 ? 2 : 1
  const linhasGuia = [0, 25, 50, 75, 100].map((p) => (p / 100) * max)

  // Meses sem dado (null) interrompem a linha em vez de cair para zero
  const caminho = (valores) =>
    valores
      .map((v, i) => (v == null ? '' : `${i === 0 || valores[i - 1] == null ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`))
      .join(' ')
  const principal = series[0]
  const temLacuna = principal.valores.some((v) => v == null)
  const fmt = (v) => (v == null ? '—' : `${numero(v)}${sufixo}`)

  const aoMover = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = Math.round(((px - margem.esq - 10) / (areaW - 20)) * (rotulos.length - 1))
    setFoco(Math.max(0, Math.min(rotulos.length - 1, i)))
  }

  return (
    <div ref={ref} className="grafico-linha" style={{ position: 'relative' }}>
      {largura > 0 && (
        <svg
          width={w}
          height={altura}
          role="img"
          aria-label={descricao}
          onPointerMove={aoMover}
          onPointerLeave={() => setFoco(null)}
          style={{ touchAction: 'pan-y' }}
        >
          {linhasGuia.map((v) => (
            <g key={v}>
              <line x1={margem.esq} x2={w - margem.dir} y1={y(v)} y2={y(v)} stroke={LINHA} />
              <text x={margem.esq - 10} y={y(v) + 5} textAnchor="end" fontSize="13" fill={TINTA_SUAVE} fontFamily={FONTE}>
                {numero(v)}{sufixo}
              </text>
            </g>
          ))}
          {rotulos.map((r, i) =>
            i % passoRotulo === 0 ? (
              <text key={r} x={x(i)} y={altura - 10} textAnchor="middle" fontSize="13" fill={foco === i ? TINTA : TINTA_SUAVE} fontWeight={foco === i ? 700 : 400} fontFamily={FONTE}>
                {r}
              </text>
            ) : null,
          )}

          {foco != null && <line x1={x(foco)} x2={x(foco)} y1={margem.topo} y2={margem.topo + areaH} stroke={TINTA} strokeOpacity=".25" strokeWidth="2" strokeDasharray="4 4" />}

          {series.slice(1).map((s) => (
            <path key={s.nome} d={caminho(s.valores)} fill="none" stroke={s.cor} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2 8" />
          ))}

          {!temLacuna && (
            <path
              d={`${caminho(principal.valores)} L${x(principal.valores.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
              fill={principal.area || principal.cor}
              opacity=".3"
            />
          )}
          <path className="grafico-linha__traco" d={caminho(principal.valores)} fill="none" stroke={principal.cor} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
          {principal.valores.map((v, i) =>
            v == null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r={foco === i ? 7 : 5} fill="#fff" stroke={principal.cor} strokeWidth="3" style={{ transition: 'r .15s ease' }} />
            ),
          )}
        </svg>
      )}

      {foco != null && (
        <div
          className="grafico-dica"
          style={{ left: Math.min(Math.max(x(foco), 80), w - 80), top: Math.max(y(Math.max(...series.map((s) => s.valores[foco] ?? 0))) - 14, 0) }}
          aria-hidden="true"
        >
          <strong>{rotulos[foco]}</strong>
          {series.map((s) => (
            <span key={s.nome}>
              <i style={{ background: s.cor }} />
              {s.nome}: <b className="ot-num">{fmt(s.valores[foco])}</b>
            </span>
          ))}
        </div>
      )}

      {/* Tabela equivalente para leitores de tela. Fica dentro de uma div porque tabelas ignoram width: 1px */}
      <div className="sr-only">
        <table>
          <caption>{descricao}</caption>
          <thead>
            <tr>
              <th>Mês</th>
              {series.map((s) => <th key={s.nome}>{s.nome}</th>)}
            </tr>
          </thead>
          <tbody>
            {rotulos.map((r, i) => (
              <tr key={r}>
                <td>{r}</td>
                {series.map((s) => <td key={s.nome}>{fmt(s.valores[i])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Rosca({ fatias, centro, subcentro, descricao }) {
  const [ref, visivel] = useEntrada()
  const [ativa, setAtiva] = useState(null)
  const total = fatias.reduce((a, f) => a + f.valor, 0)
  const r = 82
  const circ = 2 * Math.PI * r
  const folga = 3
  let acumulado = 0

  return (
    <div className="rosca" ref={ref}>
      <svg viewBox="0 0 200 200" className="rosca__svg" role="img" aria-label={descricao}>
        {fatias.map((f, i) => {
          const comp = (f.valor / total) * circ
          const desloc = acumulado
          acumulado += comp
          return (
            <circle
              key={f.nome}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={f.hex}
              strokeWidth={ativa === i ? 42 : 36}
              strokeDasharray={`${visivel ? Math.max(comp - folga, 0) : 0} ${circ}`}
              strokeDashoffset={-desloc}
              transform="rotate(-90 100 100)"
              opacity={ativa == null || ativa === i ? 1 : 0.35}
              style={{ transition: 'stroke-dasharray .9s cubic-bezier(.2,.7,.2,1), opacity .2s ease, stroke-width .2s ease' }}
              onPointerEnter={() => setAtiva(i)}
              onPointerLeave={() => setAtiva(null)}
            />
          )
        })}
        <text x="100" y="104" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="38" fontWeight="800" fill={TINTA}>
          {ativa == null ? centro : `${fatias[ativa].valor}%`}
        </text>
        <text x="100" y="128" textAnchor="middle" fontFamily={FONTE} fontSize="14" fill={TINTA_SUAVE}>
          {ativa == null ? subcentro : fatias[ativa].nome.length > 16 ? `${fatias[ativa].nome.slice(0, 15)}…` : fatias[ativa].nome}
        </text>
      </svg>
      <ul className="rosca__legenda">
        {fatias.map((f, i) => (
          <li key={f.nome} onPointerEnter={() => setAtiva(i)} onPointerLeave={() => setAtiva(null)} data-ativa={ativa === i}>
            <i style={{ background: f.hex }} />
            <span>{f.nome}</span>
            <strong className="ot-num">{f.valor}%</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarrasHorizontais({ itens, descricao, destaque }) {
  const [ref, visivel] = useEntrada()
  const max = Math.max(...itens.map((i) => i.valor))
  return (
    <ul className="barras-h" ref={ref} aria-label={descricao}>
      {itens.map((item, i) => (
        <li key={item.nome} data-apagada={!!destaque && destaque !== item.id}>
          <span className="barras-h__rotulo">{item.nome}</span>
          <span className="barras-h__trilho">
            <i style={{ width: visivel ? `${(item.valor / max) * 100}%` : 0, background: item.hex, transitionDelay: `${i * 70}ms` }} />
          </span>
          <strong className="barras-h__valor ot-num">{numero(item.valor)}</strong>
        </li>
      ))}
    </ul>
  )
}

// Em contêineres estreitos as colunas viram barras deitadas, para os rótulos caberem
export function BarrasVerticais({ itens, destaque, descricao }) {
  const [medida, largura] = useLargura()
  return (
    <div ref={medida}>
      {largura > 0 && largura < 440 ? (
        <BarrasHorizontais itens={itens} destaque={destaque} descricao={descricao} />
      ) : (
        <Colunas itens={itens} destaque={destaque} descricao={descricao} />
      )}
    </div>
  )
}

function Colunas({ itens, destaque, descricao }) {
  const [ref, visivel] = useEntrada()
  const max = Math.max(...itens.map((i) => i.valor)) * 1.1
  return (
    <div className="barras-v" ref={ref} role="img" aria-label={descricao}>
      {itens.map((item, i) => {
        const apagada = destaque && destaque !== item.id
        return (
          <div key={item.nome} className="barras-v__coluna" data-apagada={apagada}>
            <div className="barras-v__area">
              <strong className="ot-num">{numero(item.valor)}</strong>
              <i style={{ height: visivel ? `${(item.valor / max) * 100}%` : 0, background: item.hex, transitionDelay: `${i * 70}ms` }} />
            </div>
            <span className="barras-v__rotulo">{item.nome}</span>
          </div>
        )
      })}
    </div>
  )
}

export function BarraComparacao({ rotulo, valor, cor }) {
  const [ref, visivel] = useEntrada()
  return (
    <div className="comparacao" ref={ref}>
      <span>{rotulo}</span>
      <div className="comparacao__barra">
        <i style={{ width: visivel ? `${Math.min(valor, 100)}%` : 0, background: cor }} />
      </div>
      <strong className="ot-num">{valor == null ? '—' : `${valor}%`}</strong>
    </div>
  )
}
