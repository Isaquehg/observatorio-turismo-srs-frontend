import { requisicaoApi } from './api'
import { dataCurta, normalizar } from './formatar'

// Visual palette matching the existing design system tokens for tourism sectors
const CORES_SETOR = {
  hospedagem: { cor: 'var(--azul-institucional)', hex: '#0A4AAD' },
  alimentacao: { cor: 'var(--roxo)', hex: '#6C5CE0' },
  eventos: { cor: 'var(--magenta)', hex: '#C750D6' },
  'agencias-guias': { cor: 'var(--azul-ceu)', hex: '#27B7FD' },
  agencias: { cor: 'var(--azul-ceu)', hex: '#27B7FD' },
  transporte: { cor: 'var(--lilas)', hex: '#B986ED' },
  comercio: { cor: 'var(--amarelo)', hex: '#FADA77' },
}

const PALETA_FALLBACK = [
  { cor: 'var(--azul-institucional)', hex: '#0A4AAD' },
  { cor: 'var(--roxo)', hex: '#6C5CE0' },
  { cor: 'var(--magenta)', hex: '#C750D6' },
  { cor: 'var(--azul-ceu)', hex: '#27B7FD' },
  { cor: 'var(--lilas)', hex: '#B986ED' },
  { cor: 'var(--amarelo)', hex: '#FADA77' },
]

// Maps backend origin_breakdown keys to Portuguese display labels and chart colors
const MAPA_ORIGENS = {
  sul_de_minas: { nome: 'Sul de Minas', hex: '#0A4AAD' },
  south_of_minas: { nome: 'Sul de Minas', hex: '#0A4AAD' },
  sao_paulo: { nome: 'Grande SP', hex: '#6C5CE0' },
  grande_sp: { nome: 'Grande SP', hex: '#6C5CE0' },
  outras_regioes_mg: { nome: 'Outras regiões de MG', hex: '#27B7FD' },
  minas_gerais: { nome: 'Outras regiões de MG', hex: '#27B7FD' },
  rio_de_janeiro: { nome: 'Rio de Janeiro', hex: '#C750D6' },
  outros: { nome: 'Outros', hex: '#FADA77' },
  other: { nome: 'Outros', hex: '#FADA77' },
}

// Maps backend accommodation_breakdown types to Portuguese display labels and chart colors
const MAPA_TIPOS_HOSPEDAGEM = {
  hotel: { nome: 'Hotéis', hex: '#0A4AAD' },
  hoteis: { nome: 'Hotéis', hex: '#0A4AAD' },
  pousada: { nome: 'Pousadas', hex: '#6C5CE0' },
  pousadas: { nome: 'Pousadas', hex: '#6C5CE0' },
  hostel: { nome: 'Hostels', hex: '#27B7FD' },
  hostels: { nome: 'Hostels', hex: '#27B7FD' },
  chale: { nome: 'Chalés e sítios', hex: '#B986ED' },
  chales: { nome: 'Chalés e sítios', hex: '#B986ED' },
  chales_e_sitios: { nome: 'Chalés e sítios', hex: '#B986ED' },
  aluguel: { nome: 'Aluguel por temporada', hex: '#C750D6' },
  aluguel_por_temporada: { nome: 'Aluguel por temporada', hex: '#C750D6' },
  aluguel_temporada: { nome: 'Aluguel por temporada', hex: '#C750D6' },
  other: { nome: 'Outros', hex: '#FADA77' },
  outros: { nome: 'Outros', hex: '#FADA77' },
}

// Supported backend indicator metric columns for quick publishing and management
export const METRICAS_INDICADOR = [
  { campo: 'jobs_count', rotulo: 'Empregos no setor', tipo: 'inteiro' },
  { campo: 'companies_count', rotulo: 'Empresas do turismo', tipo: 'inteiro' },
  { campo: 'beds_count', rotulo: 'Leitos disponíveis', tipo: 'inteiro' },
  { campo: 'accommodations_count', rotulo: 'Meios de hospedagem', tipo: 'inteiro' },
  { campo: 'visitors_count', rotulo: 'Visitantes estimados', tipo: 'inteiro' },
  { campo: 'occupancy_rate', rotulo: 'Taxa de ocupação (%)', tipo: 'percentual' },
]

function montarQuery(params) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue
    busca.set(chave, String(valor))
  }
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

function formatarRotuloChave(valor) {
  const limpo = String(valor || '').trim().replace(/[_-]+/g, ' ')
  if (!limpo) return 'Outros'
  return limpo.charAt(0).toUpperCase() + limpo.slice(1)
}

/**
 * Formats an ISO date or full ISO timestamp safely using dataCurta().
 */
export function formatarDataSegura(iso) {
  if (!iso || typeof iso !== 'string') return null
  const somenteData = iso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(somenteData)) return null
  return dataCurta(somenteData)
}

/**
 * Formats visitor counts compactly for highlight cards and donut centers.
 */
export function formatarVisitantesCurto(valor) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '—'
  if (valor >= 1000) return `${Math.round(valor / 1000)} mil`
  return valor.toLocaleString('pt-BR')
}

/**
 * Normalizes backend sector records with consistent frontend visual tokens.
 */
export function normalizarSetores(lista = []) {
  return lista.map((setor, indice) => {
    const cores = CORES_SETOR[setor.slug] || PALETA_FALLBACK[indice % PALETA_FALLBACK.length]
    return {
      id: setor.id,
      slug: setor.slug,
      nome: setor.name,
      cor: cores.cor,
      hex: cores.hex,
    }
  })
}

/**
 * Converts backend occupancy_monthly items into 12-month arrays with null gaps for missing months.
 */
export function montarSerieOcupacaoMensal(occupancyMonthly = []) {
  const atual = Array(12).fill(null)
  const anterior = Array(12).fill(null)

  for (const item of occupancyMonthly) {
    if (!item?.reference_date) continue
    const mes = Number(String(item.reference_date).slice(5, 7))
    if (mes >= 1 && mes <= 12) {
      if (typeof item.occupancy_rate === 'number' && !Number.isNaN(item.occupancy_rate)) {
        atual[mes - 1] = Math.round(item.occupancy_rate)
      }
      if (
        typeof item.previous_year_occupancy_rate === 'number' &&
        !Number.isNaN(item.previous_year_occupancy_rate)
      ) {
        anterior[mes - 1] = Math.round(item.previous_year_occupancy_rate)
      }
    }
  }

  return { atual, anterior }
}

/**
 * Computes average occupancy rate from non-null monthly points, falling back to annual summary.
 */
export function calcularOcupacaoMedia(occupancyMonthly = [], fallback = null) {
  const taxas = occupancyMonthly
    .map((item) => item?.occupancy_rate)
    .filter((valor) => typeof valor === 'number' && !Number.isNaN(valor))

  if (taxas.length > 0) {
    return Math.round(taxas.reduce((soma, valor) => soma + valor, 0) / taxas.length)
  }

  return typeof fallback === 'number' && !Number.isNaN(fallback) ? Math.round(fallback) : null
}

/**
 * Converts backend origin_distribution entries into percentage slices for the donut chart.
 */
export function normalizarOrigens(lista = []) {
  const validos = lista.filter((item) => item && typeof item.value === 'number' && item.value > 0)
  const total = validos.reduce((soma, item) => soma + item.value, 0)
  if (!total) return []

  return validos.map((item, indice) => {
    const chave = normalizar(String(item.origin || '')).trim().replace(/\s+/g, '_')
    const info = MAPA_ORIGENS[chave] || {
      nome: formatarRotuloChave(item.origin),
      hex: PALETA_FALLBACK[indice % PALETA_FALLBACK.length].hex,
    }
    return {
      chave: item.origin,
      nome: info.nome,
      hex: info.hex,
      valor: Math.round((item.value / total) * 100),
      bruto: item.value,
    }
  })
}

/**
 * Normalizes backend accommodation category or bed breakdown items into chart/table rows.
 */
export function normalizarCategoriasHospedagem(lista = []) {
  return lista
    .filter((item) => item && item.type)
    .map((item, indice) => {
      const chave = normalizar(String(item.type)).trim().replace(/\s+/g, '_')
      const info = MAPA_TIPOS_HOSPEDAGEM[chave] || {
        nome: formatarRotuloChave(item.type),
        hex: PALETA_FALLBACK[indice % PALETA_FALLBACK.length].hex,
      }
      return {
        tipo: item.type,
        nome: info.nome,
        hex: info.hex,
        estabelecimentos: item.establishments ?? 0,
        leitos: item.beds ?? 0,
        ocupacao:
          typeof item.occupancy_rate === 'number' && !Number.isNaN(item.occupancy_rate)
            ? Math.round(item.occupancy_rate)
            : null,
        situacao: item.occupancy_rate == null ? 'analise' : 'publicado',
      }
    })
}

/**
 * Fetches all public tourism sectors from GET /api/sectors.
 */
export async function listarSetores(opcoes = {}) {
  const resposta = await requisicaoApi('/sectors', {
    autenticado: false,
    ...opcoes,
  })
  return normalizarSetores(Array.isArray(resposta?.data) ? resposta.data : [])
}

/**
 * Fetches public aggregated dashboard metrics from GET /api/dashboard.
 */
export async function buscarDashboard(filtros = {}, opcoes = {}) {
  const query = montarQuery({
    year: filtros.year,
    sector_id: filtros.sector_id,
    from: filtros.from,
    to: filtros.to,
  })
  const resposta = await requisicaoApi(`/dashboard${query}`, {
    autenticado: false,
    ...opcoes,
  })
  return resposta?.data || null
}

/**
 * Fetches paginated indicators from GET /api/indicators.
 * Non-admin requests never send the published filter so drafts stay restricted to city hall.
 */
export async function listarIndicadores(filtros = {}, opcoes = {}) {
  const { permitirRascunhos = false, ...opcoesFetch } = opcoes
  const query = montarQuery({
    sector_id: filtros.sector_id,
    year: filtros.year,
    from: filtros.from,
    to: filtros.to,
    metric: filtros.metric,
    published: permitirRascunhos ? filtros.published : undefined,
    page: filtros.page,
    limit: filtros.limit,
  })
  const resposta = await requisicaoApi(`/indicators${query}`, {
    autenticado: permitirRascunhos,
    ...opcoesFetch,
  })
  return {
    data: Array.isArray(resposta?.data) ? resposta.data : [],
    meta: resposta?.meta || { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
}

/**
 * Creates a monthly indicator via POST /api/indicators (admin_smcelt only).
 */
export async function criarIndicador(payload) {
  const resposta = await requisicaoApi('/indicators', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return resposta?.data || null
}

/**
 * Updates an existing indicator via PUT /api/indicators/:id (admin_smcelt only).
 */
export async function atualizarIndicador(id, payload) {
  const resposta = await requisicaoApi(`/indicators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return resposta?.data || null
}

/**
 * Deletes an indicator via DELETE /api/indicators/:id (admin_smcelt only).
 */
export async function excluirIndicador(id) {
  await requisicaoApi(`/indicators/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Validates a CSV/XLSX indicator spreadsheet without persisting via POST /api/admin/indicators/import/preview.
 */
export async function previsualizarImportacaoIndicadores(arquivo) {
  const formData = new FormData()
  formData.append('file', arquivo)
  const resposta = await requisicaoApi('/admin/indicators/import/preview', {
    method: 'POST',
    body: formData,
  })
  return resposta?.data || null
}

/**
 * Commits a validated indicator import preview via POST /api/admin/indicators/import/commit.
 */
export async function confirmarImportacaoIndicadores(previewId) {
  const resposta = await requisicaoApi('/admin/indicators/import/commit', {
    method: 'POST',
    body: JSON.stringify({ preview_id: previewId }),
  })
  return resposta?.data || null
}
