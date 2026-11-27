import { requisicaoApi, uploadPdfRelatorio } from './api'

// Maps backend report category slugs to frontend UI category keys
export const CATEGORIA_API_PARA_UI = {
  survey: 'pesquisa',
  bulletin: 'boletim',
  events: 'eventos',
  inventory: 'inventario',
}

// Maps frontend UI category keys to backend canonical report categories
export const CATEGORIA_UI_PARA_API = {
  pesquisa: 'survey',
  boletim: 'bulletin',
  eventos: 'events',
  inventario: 'inventory',
}

// Maps frontend sort dropdown values to backend query sort keys
export const ORDEM_UI_PARA_API = {
  recentes: 'newest',
  antigos: 'oldest',
  titulo: 'title',
}

function montarQuery(params) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue
    busca.set(chave, String(valor))
  }
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

/**
 * Formats file size in bytes into a human-readable Portuguese label (e.g., "2,8 MB").
 */
export function formatarTamanhoArquivo(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${bytes} B`
}

/**
 * Normalizes a backend report record into the UI shape consumed by report cards and modals.
 */
export function normalizarRelatorio(raw) {
  const categoriaUi = CATEGORIA_API_PARA_UI[raw.category] || 'boletim'
  return {
    id: raw.id,
    titulo: raw.title || '',
    resumo: raw.summary ?? raw.description ?? '',
    categoria: categoriaUi,
    categoriaApi: raw.category || 'bulletin',
    data: String(raw.published_at || '').slice(0, 10),
    paginas: raw.pages ?? null,
    tamanhoBytes: raw.file_size_bytes ?? null,
    tamanho: formatarTamanhoArquivo(raw.file_size_bytes),
    achados: Array.isArray(raw.highlights) ? raw.highlights : [],
    novo: Boolean(raw.featured),
    destaque: Boolean(raw.featured),
    arquivoUrl: raw.file_url || '',
    autor: raw.author?.name || null,
  }
}

/**
 * Lists reports with optional search, year, category, sort, featured, and pagination filters via GET /api/reports.
 */
export async function listarRelatorios(filtros = {}, opcoes = {}) {
  const categoriaApi =
    filtros.category && filtros.category !== 'todas'
      ? CATEGORIA_UI_PARA_API[filtros.category] || filtros.category
      : undefined
  const sortApi = filtros.sort ? ORDEM_UI_PARA_API[filtros.sort] || filtros.sort : undefined

  const query = montarQuery({
    q: filtros.q?.trim() || undefined,
    year: filtros.year && filtros.year !== 'todos' ? filtros.year : undefined,
    category: categoriaApi,
    sort: sortApi,
    featured: filtros.featured,
    page: filtros.page,
    limit: filtros.limit,
  })

  const resposta = await requisicaoApi(`/reports${query}`, { autenticado: false, ...opcoes })
  const lista = Array.isArray(resposta?.data) ? resposta.data.map(normalizarRelatorio) : []
  return {
    data: lista,
    meta: resposta?.meta || { page: 1, limit: 20, total: lista.length, total_pages: 1 },
  }
}

/**
 * Fetches a single report by ID via GET /api/reports/:id.
 */
export async function buscarRelatorio(id, opcoes = {}) {
  const resposta = await requisicaoApi(`/reports/${id}`, { autenticado: false, ...opcoes })
  return resposta?.data ? normalizarRelatorio(resposta.data) : null
}

/**
 * Uploads a PDF file to S3 via POST /api/reports/upload (multipart/form-data) and returns { file_url, file_size_bytes }.
 */
export { uploadPdfRelatorio }

/**
 * Creates a new report record via POST /api/reports (admin only).
 */
export async function criarRelatorio(payload) {
  const resposta = await requisicaoApi('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return resposta?.data ? normalizarRelatorio(resposta.data) : null
}

/**
 * Updates an existing report record via PUT /api/reports/:id (admin only).
 */
export async function atualizarRelatorio(id, payload) {
  const resposta = await requisicaoApi(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return resposta?.data ? normalizarRelatorio(resposta.data) : null
}

/**
 * Deletes a report record and its S3 PDF object via DELETE /api/reports/:id (admin only).
 */
export async function excluirRelatorio(id) {
  await requisicaoApi(`/reports/${id}`, {
    method: 'DELETE',
  })
  return null
}

/**
 * Fetches the consolidated monthly management report for city hall via GET /api/admin/reports/monthly.
 */
export async function buscarRelatorioMensalAdmin(period, opcoes = {}) {
  const query = montarQuery({ period })
  const resposta = await requisicaoApi(`/admin/reports/monthly${query}`, opcoes)
  return resposta?.data || null
}

/**
 * Checks Express API liveness via GET /api/health.
 */
export async function verificarSaudeApi(opcoes = {}) {
  return requisicaoApi('/health', { autenticado: false, ...opcoes })
}

/**
 * Checks PostgreSQL (AWS RDS) connectivity via GET /api/health/database.
 */
export async function verificarSaudeBanco(opcoes = {}) {
  return requisicaoApi('/health/database', { autenticado: false, ...opcoes })
}
