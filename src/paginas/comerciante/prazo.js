// Reference month is always the previous calendar month; submission deadline is day 10
export function periodoAtual(hoje = new Date()) {
  const ref = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const prazo = new Date(hoje.getFullYear(), hoje.getMonth(), 10, 23, 59)
  const dias = Math.ceil((prazo - hoje) / 86400000)
  return { ano: ref.getFullYear(), mes: ref.getMonth() + 1, prazo, diasRestantes: Math.max(dias, 0), encerrado: dias < 0 }
}

// Sorts merchant submissions returned by the API from newest to oldest
export function historicoCompleto(envios = []) {
  return [...envios].sort((a, b) => b.ano - a.ano || b.mes - a.mes || (b.id || 0) - (a.id || 0))
}
