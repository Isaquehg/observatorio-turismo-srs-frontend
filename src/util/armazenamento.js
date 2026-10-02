// localStorage pode falhar em aba anônima ou com dados do site bloqueados.
export function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto == null ? padrao : JSON.parse(bruto)
  } catch {
    return padrao
  }
}

export function gravar(chave, valor) {
  try {
    if (valor == null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    /* sem armazenamento: segue só em memória */
  }
}
