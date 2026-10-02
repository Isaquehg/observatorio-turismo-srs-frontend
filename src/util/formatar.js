const inteiro = new Intl.NumberFormat('pt-BR')
const umaCasa = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const numero = (v) => (v == null || Number.isNaN(v) ? '—' : inteiro.format(v))
export const decimal = (v) => umaCasa.format(v)
export const pct = (v) => (v == null ? '—' : `${inteiro.format(Math.round(v))}%`)

// Variação percentual entre dois valores, com o sinal tipográfico de menos (−)
export function variacao(atual, anterior) {
  if (!anterior) return null
  const v = ((atual - anterior) / anterior) * 100
  return { valor: v, texto: `${v >= 0 ? '+' : '−'}${umaCasa.format(Math.abs(v))}%` }
}

export function diferenca(atual, anterior, sufixo = '') {
  const d = atual - anterior
  return { valor: d, texto: `${d >= 0 ? '+' : '−'}${inteiro.format(Math.abs(d))}${sufixo}` }
}

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// "12 set. 2026"
export function dataCurta(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// "Set. 2026"
export function mesAno(ano, mes) {
  const m = MESES[mes - 1]
  return `${m[0].toUpperCase()}${m.slice(1)} ${ano}`
}

export const mesAnoLongo = (ano, mes) => `${MESES_LONGOS[mes - 1]} de ${ano}`

export function iniciais(nome) {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function baixarCsv(nomeArquivo, linhas) {
  const escapar = (c) => {
    const s = String(c ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // Ponto e vírgula + BOM: abre direto no Excel em português
  const csv = '﻿' + linhas.map((l) => l.map(escapar).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
