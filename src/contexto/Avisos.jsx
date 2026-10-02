import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Icone from '../componentes/Icone'

const AvisosContexto = createContext(null)

const ICONES = { sucesso: 'check-circulo', alerta: 'alerta', erro: 'x-circulo', info: 'info' }

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const proximoId = useRef(1)

  const fechar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const avisar = useCallback(
    (titulo, { texto, tipo = 'sucesso', duracao = 5000 } = {}) => {
      const id = proximoId.current++
      setAvisos((lista) => [...lista.slice(-2), { id, titulo, texto, tipo }])
      if (duracao) setTimeout(() => fechar(id), duracao)
    },
    [fechar],
  )

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      <div className="ot-toasts" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`ot-toast ot-toast--${a.tipo}`}>
            <Icone nome={ICONES[a.tipo]} />
            <p>
              <strong>{a.titulo}</strong>
              {a.texto}
            </p>
            <button type="button" onClick={() => fechar(a.id)} aria-label="Fechar aviso">
              <Icone nome="x" tamanho="s" />
            </button>
          </div>
        ))}
      </div>
    </AvisosContexto.Provider>
  )
}

export const useAvisos = () => useContext(AvisosContexto)
