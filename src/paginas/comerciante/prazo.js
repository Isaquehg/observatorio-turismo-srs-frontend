import { historicoComerciante, MEU_NEGOCIO } from '../../dados/painel'

// O mês de referência é sempre o anterior ao atual; o prazo vai até o dia 10.
export function periodoAtual(hoje = new Date()) {
  const ref = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const prazo = new Date(hoje.getFullYear(), hoje.getMonth(), 10, 23, 59)
  const dias = Math.ceil((prazo - hoje) / 86400000)
  return { ano: ref.getFullYear(), mes: ref.getMonth() + 1, prazo, diasRestantes: Math.max(dias, 0), encerrado: dias < 0 }
}

// Junta o histórico fixo com o que foi enviado nesta sessão (contexto de envios)
export function historicoCompleto(envios) {
  const meus = envios
    .filter((e) => e.nome === MEU_NEGOCIO.nome)
    .map((e) => ({ ...e, enviadoEm: e.enviadoEm || 'agora' }))
  const chave = (e) => `${e.ano}-${e.mes}`
  const vistos = new Set(meus.map(chave))
  return [...meus, ...historicoComerciante.filter((h) => !vistos.has(chave(h)))].sort((a, b) => b.ano - a.ano || b.mes - a.mes)
}
