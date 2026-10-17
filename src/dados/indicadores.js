// Valores ilustrativos para o protótipo. Fonte prevista: OT-SRS / SMCELT.

export const ANOS = [2023, 2024, 2025]
export const ATUALIZADO_EM = '2026-09-12'

export const SETORES = [
  { id: 'hospedagem', nome: 'Hospedagem', cor: 'var(--azul-institucional)', hex: '#0A4AAD' },
  { id: 'alimentacao', nome: 'Alimentação', cor: 'var(--roxo)', hex: '#6C5CE0' },
  { id: 'eventos', nome: 'Eventos', cor: 'var(--magenta)', hex: '#C750D6' },
  { id: 'agencias', nome: 'Agências e guias', cor: 'var(--azul-ceu)', hex: '#27B7FD' },
  { id: 'transporte', nome: 'Transporte', cor: 'var(--lilas)', hex: '#B986ED' },
  { id: 'comercio', nome: 'Comércio', cor: 'var(--amarelo)', hex: '#FADA77' },
]

export const dadosPorAno = {
  2023: {
    hospedagens: 37,
    ocupacaoMensal: [39, 41, 44, 43, 42, 47, 54, 68, 57, 51, 48, 58],
    visitantes: 71000,
    origem: [42, 24, 14, 8, 12],
    leitosPorTipo: [572, 338, 104, 80, 56],
    empregos: { hospedagem: 470, alimentacao: 680, eventos: 175, agencias: 85, transporte: 210, comercio: 270 },
    empresas: { hospedagem: 37, alimentacao: 117, eventos: 23, agencias: 20, transporte: 29, comercio: 63 },
    categorias: [
      [13, 572, 54, 'publicado'], [15, 338, 49, 'publicado'], [3, 104, 44, 'publicado'],
      [4, 80, 47, 'publicado'], [2, 56, null, 'publicado'],
    ],
  },
  2024: {
    hospedagens: 39,
    ocupacaoMensal: [42, 44, 47, 46, 45, 50, 57, 71, 60, 54, 51, 62],
    visitantes: 79000,
    origem: [40, 25, 15, 9, 11],
    leitosPorTipo: [590, 362, 112, 89, 56],
    empregos: { hospedagem: 505, alimentacao: 712, eventos: 196, agencias: 92, transporte: 220, comercio: 271 },
    empresas: { hospedagem: 39, alimentacao: 122, eventos: 25, agencias: 21, transporte: 30, comercio: 66 },
    categorias: [
      [14, 590, 57, 'publicado'], [16, 362, 52, 'publicado'], [3, 112, 46, 'publicado'],
      [4, 89, 50, 'publicado'], [2, 56, null, 'publicado'],
    ],
  },
  2025: {
    hospedagens: 42,
    ocupacaoMensal: [46, 48, 52, 50, 49, 55, 62, 78, 64, 58, 55, 67],
    visitantes: 86000,
    origem: [38, 27, 16, 9, 10],
    leitosPorTipo: [612, 388, 124, 96, 64],
    empregos: { hospedagem: 520, alimentacao: 690, eventos: 180, agencias: 95, transporte: 210, comercio: 265 },
    empresas: { hospedagem: 42, alimentacao: 128, eventos: 26, agencias: 22, transporte: 31, comercio: 69 },
    categorias: [
      [14, 612, 61, 'publicado'], [17, 388, 56, 'publicado'], [3, 124, 49, 'publicado'],
      [5, 96, 52, 'analise'], [3, 64, null, 'analise'],
    ],
  },
}

export const ORIGENS = [
  { nome: 'Sul de Minas', hex: '#0A4AAD' },
  { nome: 'Grande SP', hex: '#6C5CE0' },
  { nome: 'Outras regiões de MG', hex: '#27B7FD' },
  { nome: 'Rio de Janeiro', hex: '#C750D6' },
  { nome: 'Outros', hex: '#FADA77' },
]

export const TIPOS_HOSPEDAGEM = [
  { nome: 'Hotéis', hex: '#0A4AAD' },
  { nome: 'Pousadas', hex: '#6C5CE0' },
  { nome: 'Hostels', hex: '#27B7FD' },
  { nome: 'Chalés e sítios', hex: '#B986ED' },
  { nome: 'Aluguel por temporada', hex: '#C750D6' },
]

const soma = (obj) => Object.values(obj).reduce((a, b) => a + b, 0)
const media = (lista) => lista.reduce((a, b) => a + b, 0) / lista.length

// Resumo do ano já com os totais calculados
export function resumoDoAno(ano, setor = 'todos') {
  const d = dadosPorAno[ano]
  const filtrado = (obj) => (setor === 'todos' ? soma(obj) : obj[setor])
  return {
    leitos: d.leitosPorTipo.reduce((a, b) => a + b, 0),
    hospedagens: d.hospedagens,
    visitantes: d.visitantes,
    ocupacao: Math.round(media(d.ocupacaoMensal)),
    empresas: filtrado(d.empresas),
    empregos: filtrado(d.empregos),
  }
}

// Série dos últimos anos para a minilinha dos cartões
export function serie(chave, ate, setor = 'todos') {
  return ANOS.filter((a) => a <= ate).map((a) => resumoDoAno(a, setor)[chave])
}
