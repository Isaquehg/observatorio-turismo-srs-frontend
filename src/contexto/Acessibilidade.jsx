import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ler, gravar } from '../util/armazenamento'

const AcessibilidadeContexto = createContext(null)
const CHAVE = 'ot-srs:acessibilidade'
export const TAMANHOS_FONTE = ['normal', 'maior', 'grande']

export function AcessibilidadeProvider({ children }) {
  const [prefs, setPrefs] = useState(() => ler(CHAVE, { fonte: 'normal', movimento: 'normal' }))

  useEffect(() => {
    const raiz = document.documentElement
    raiz.dataset.fonte = prefs.fonte
    raiz.dataset.movimento = prefs.movimento
    gravar(CHAVE, prefs)
  }, [prefs])

  const valor = useMemo(
    () => ({
      prefs,
      definir: (chave, v) => setPrefs((p) => ({ ...p, [chave]: v })),
      restaurar: () => setPrefs({ fonte: 'normal', movimento: 'normal' }),
    }),
    [prefs],
  )

  return <AcessibilidadeContexto.Provider value={valor}>{children}</AcessibilidadeContexto.Provider>
}

export const useAcessibilidade = () => useContext(AcessibilidadeContexto)
