import { useEffect, useRef, useState } from 'react'
import { comportamentoRolagem } from '../util/ganchos'
import { numero } from '../util/formatar'

// Número que conta de 0 até `valor` quando aparece na tela.
// Com "reduzir animações" (ou sem IntersectionObserver), mostra o valor final direto.
export default function Contador({ valor, prefixo = '', sufixo = '', duracao = 1200 }) {
  const ref = useRef(null)
  const [atual, setAtual] = useState(valor)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined' || comportamentoRolagem() === 'auto') return
    setAtual(0)
    let quadro
    const observador = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observador.disconnect()
      const inicio = performance.now()
      const passo = (agora) => {
        const t = Math.min((agora - inicio) / duracao, 1)
        setAtual(Math.round(valor * (1 - Math.pow(1 - t, 3))))
        if (t < 1) quadro = requestAnimationFrame(passo)
      }
      quadro = requestAnimationFrame(passo)
    }, { threshold: 0.4 })
    observador.observe(el)
    return () => { observador.disconnect(); cancelAnimationFrame(quadro) }
  }, [valor, duracao])

  return (
    <span ref={ref} className="ot-num" aria-label={`${prefixo}${numero(valor)}${sufixo}`}>
      <span aria-hidden="true">{prefixo}{numero(atual)}{sufixo}</span>
    </span>
  )
}
