import { useCallback, useState } from 'react'
import { ler, gravar } from './armazenamento'

const CHAVE = 'ot-srs:favoritos'

// Favoritos do turista, guardados neste aparelho (sem servidor no protótipo)
export function useFavoritos() {
  const [ids, setIds] = useState(() => ler(CHAVE, []))
  const alternar = useCallback((id) => {
    setIds((lista) => {
      const novos = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]
      gravar(CHAVE, novos)
      return novos
    })
  }, [])
  return { ids, alternar }
}
