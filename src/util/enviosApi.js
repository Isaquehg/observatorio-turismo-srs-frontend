import { requisicaoApi } from './api'

// Maps backend submission status strings to frontend UI badge keys
const STATUS_PARA_SITUACAO = {
  draft: 'rascunho',
  submitted: 'analise',
  approved: 'publicado',
  returned: 'recusado',
}

// Bidirectional mapping between Portuguese UI labels and backend VALID_TRAVEL_REASONS codes
export const MOTIVOS_VIAGEM = [
  { codigo: 'lazer_ferias', rotulo: 'Lazer e descanso' },
  { codigo: 'negocios_trabalho', rotulo: 'Negócios e trabalho' },
  { codigo: 'eventos_congressos', rotulo: 'Eventos e festas' },
  { codigo: 'visita_parentes_amigos', rotulo: 'Visita a parentes e amigos' },
  { codigo: 'estudos_cursos', rotulo: 'Estudos' },
  { codigo: 'saude_tratamento', rotulo: 'Saúde e tratamento' },
  { codigo: 'outro', rotulo: 'Outro' },
]

// Bidirectional mapping between Portuguese UI labels and backend VALID_ORIGINS codes
export const ORIGENS_HOSPEDES = [
  { codigo: 'sul_de_minas', rotulo: 'Sul de Minas' },
  { codigo: 'outras_regioes_mg', rotulo: 'Outras regiões de MG' },
  { codigo: 'grande_sp', rotulo: 'Grande São Paulo' },
  { codigo: 'sao_paulo', rotulo: 'São Paulo' },
  { codigo: 'rio_de_janeiro', rotulo: 'Rio de Janeiro' },
  { codigo: 'outros_estados', rotulo: 'Outros estados' },
  { codigo: 'exterior', rotulo: 'Exterior' },
]

export function motivoParaCodigo(rotulo) {
  const encontrado = MOTIVOS_VIAGEM.find((item) => item.rotulo === rotulo || item.codigo === rotulo)
  return encontrado ? encontrado.codigo : null
}

export function codigoParaMotivo(codigo) {
  if (!codigo) return ''
  const encontrado = MOTIVOS_VIAGEM.find((item) => item.codigo === codigo || item.rotulo === codigo)
  return encontrado ? encontrado.rotulo : ''
}

export function origemParaCodigo(rotulo) {
  const encontrado = ORIGENS_HOSPEDES.find((item) => item.rotulo === rotulo || item.codigo === rotulo)
  return encontrado ? encontrado.codigo : null
}

export function codigoParaOrigem(codigo) {
  if (!codigo) return ''
  const encontrado = ORIGENS_HOSPEDES.find((item) => item.codigo === codigo || item.rotulo === codigo)
  return encontrado ? encontrado.rotulo : ''
}

export function formatarPeriodoIso(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export function formatarMesReferenciaIso(ano, mes) {
  return `${formatarPeriodoIso(ano, mes)}-01`
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

function formatarDiaMes(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}, ${hora}:${minuto}`
}

/**
 * Normalizes a backend submission record (merchant or admin) into the frontend UI shape.
 */
export function normalizarEnvio(raw, estabelecimentoPadrao = null) {
  const [anoStr, mesStr] = String(raw.reference_month || '').slice(0, 10).split('-')
  const ano = Number(anoStr) || new Date().getFullYear()
  const mes = Number(mesStr) || 1
  const est = raw.establishment || estabelecimentoPadrao
  const situacao = STATUS_PARA_SITUACAO[raw.status] || 'analise'
  const ocupacao =
    typeof raw.occupancy_rate === 'number' && !Number.isNaN(raw.occupancy_rate)
      ? Math.round(raw.occupancy_rate)
      : null
  const mediaCidade =
    typeof raw.comparisons?.city_average_occupancy_rate === 'number' &&
    !Number.isNaN(raw.comparisons.city_average_occupancy_rate)
      ? Math.round(raw.comparisons.city_average_occupancy_rate)
      : null
  const mediaTipo =
    typeof raw.comparisons?.sector_average_occupancy_rate === 'number' &&
    !Number.isNaN(raw.comparisons.sector_average_occupancy_rate)
      ? Math.round(raw.comparisons.sector_average_occupancy_rate)
      : null

  return {
    id: raw.id,
    establishmentId: raw.establishment_id ?? est?.id ?? null,
    nome: est?.trade_name || 'Estabelecimento',
    cnpj: est?.tax_id || '',
    tipo: est?.type || est?.sector?.name || 'Hospedagem',
    setor: est?.sector?.name || null,
    capacidadeQuartos: est?.rooms_count ?? null,
    capacidadeLeitos: est?.beds_count ?? null,
    ano,
    mes,
    referenceMonth: raw.reference_month,
    quartos: raw.rooms_available ?? null,
    leitos: raw.beds_available ?? null,
    diarias: raw.room_nights_sold ?? null,
    funcionarios: raw.employees_count ?? null,
    hospedes: raw.guests_count ?? null,
    motivoViagem: codigoParaMotivo(raw.main_travel_reason),
    motivoViagemCodigo: raw.main_travel_reason ?? null,
    origemHospedes: codigoParaOrigem(raw.main_origin),
    origemHospedesCodigo: raw.main_origin ?? null,
    observacoes: raw.notes ?? '',
    ocupacao,
    ocupacaoExata: raw.occupancy_rate ?? null,
    status: raw.status,
    situacao,
    motivo: raw.return_reason ?? null,
    atrasado: Boolean(raw.overdue),
    alertas: Array.isArray(raw.alerts) ? raw.alerts : null,
    temAlertasBloqueantes:
      typeof raw.has_blocking_alerts === 'boolean'
        ? raw.has_blocking_alerts
        : Array.isArray(raw.alerts) && raw.alerts.some((a) => a.severity === 'blocking'),
    resumoAlerta: raw.alert_summary ?? null,
    revisadoPor: raw.reviewed_by?.name ?? null,
    enviadoEm: formatarDiaMes(raw.submitted_at || raw.created_at),
    recebido: formatarDataHora(raw.submitted_at || raw.created_at),
    submittedAt: raw.submitted_at ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    mediaCidade,
    mediaTipo,
  }
}

/**
 * Normalizes a missing establishment entry from GET /api/admin/submissions/missing.
 */
export function normalizarFaltante(raw) {
  return {
    id: raw.id,
    nome: raw.trade_name,
    cnpj: raw.tax_id,
    setor: raw.sector?.name || null,
    ultimoLembrete: raw.last_reminder
      ? {
          status: raw.last_reminder.status,
          enviadoEm: formatarDataHora(raw.last_reminder.sent_at || raw.last_reminder.created_at),
        }
      : null,
  }
}

/**
 * Fetches the authenticated merchant's establishment dashboard from GET /api/establishments/me/dashboard.
 */
export async function buscarMeuPainelEstabelecimento(opcoes = {}) {
  const resposta = await requisicaoApi('/establishments/me/dashboard', opcoes)
  return resposta?.data || null
}

/**
 * Lists the authenticated merchant's own monthly submissions from GET /api/submissions/me.
 */
export async function listarMeusEnvios(filtros = {}, opcoes = {}) {
  const query = montarQuery({
    status: filtros.status,
    year: filtros.year,
    page: filtros.page,
    limit: filtros.limit,
  })
  const resposta = await requisicaoApi(`/submissions/me${query}`, opcoes)
  return {
    data: Array.isArray(resposta?.data) ? resposta.data : [],
    meta: resposta?.meta || { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
}

/**
 * Creates a monthly submission or draft via POST /api/submissions.
 */
export async function criarEnvio(payload) {
  const resposta = await requisicaoApi('/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return resposta?.data || null
}

/**
 * Updates an editable draft or returned submission via PATCH /api/submissions/:id.
 */
export async function atualizarEnvio(id, payload) {
  const resposta = await requisicaoApi(`/submissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return resposta?.data || null
}

/**
 * Submits an existing draft or returned submission for review via POST /api/submissions/:id/submit.
 */
export async function submeterEnvio(id) {
  const resposta = await requisicaoApi(`/submissions/${id}/submit`, {
    method: 'POST',
  })
  return resposta?.data || null
}

/**
 * Lists reviewable submissions for city hall via GET /api/admin/submissions.
 */
export async function listarEnviosAdmin(filtros = {}, opcoes = {}) {
  const query = montarQuery({
    status: filtros.status,
    period: filtros.period,
    q: filtros.q,
    establishment_id: filtros.establishment_id,
    overdue: filtros.overdue,
    page: filtros.page,
    limit: filtros.limit,
  })
  const resposta = await requisicaoApi(`/admin/submissions${query}`, opcoes)
  return {
    data: Array.isArray(resposta?.data) ? resposta.data : [],
    meta: resposta?.meta || { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
}

/**
 * Fetches full submission details and consistency alerts via GET /api/admin/submissions/:id.
 */
export async function buscarEnvioAdmin(id, opcoes = {}) {
  const resposta = await requisicaoApi(`/admin/submissions/${id}`, opcoes)
  return resposta?.data || null
}

/**
 * Approves a submitted record via POST /api/admin/submissions/:id/approve.
 * Supports optional override + justification when the submission has blocking consistency alerts.
 */
export async function aprovarEnvioAdmin(id, opcoes = {}) {
  const temOverride = Boolean(opcoes?.override)
  const resposta = await requisicaoApi(`/admin/submissions/${id}/approve`, {
    method: 'POST',
    ...(temOverride
      ? {
          body: JSON.stringify({
            override: true,
            justification: opcoes.justification,
          }),
        }
      : {}),
  })
  return resposta?.data || null
}

/**
 * Returns a submitted record with an obligatory reason via POST /api/admin/submissions/:id/return.
 */
export async function devolverEnvioAdmin(id, reason) {
  const resposta = await requisicaoApi(`/admin/submissions/${id}/return`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return resposta?.data || null
}

/**
 * Reopens an approved or returned submission via POST /api/admin/submissions/:id/reopen.
 */
export async function reabrirEnvioAdmin(id) {
  const resposta = await requisicaoApi(`/admin/submissions/${id}/reopen`, {
    method: 'POST',
  })
  return resposta?.data || null
}

/**
 * Lists establishments missing a submission for the given period via GET /api/admin/submissions/missing.
 */
export async function listarFaltantesAdmin(period, filtros = {}, opcoes = {}) {
  const query = montarQuery({
    period,
    q: filtros.q,
    page: filtros.page,
    limit: filtros.limit,
  })
  const resposta = await requisicaoApi(`/admin/submissions/missing${query}`, opcoes)
  return {
    data: Array.isArray(resposta?.data) ? resposta.data : [],
    meta: resposta?.meta || { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
}

/**
 * Triggers submission reminders for one, multiple, or all pending establishments via POST /api/admin/submissions/reminders.
 */
export async function enviarLembretesAdmin(period, establishmentIds) {
  const corpo = {
    period,
    ...(Array.isArray(establishmentIds) && establishmentIds.length > 0
      ? { establishment_ids: establishmentIds }
      : {}),
  }
  const resposta = await requisicaoApi('/admin/submissions/reminders', {
    method: 'POST',
    body: JSON.stringify(corpo),
  })
  return resposta?.data || null
}

/**
 * Fetches city hall overview metrics via GET /api/admin/dashboard.
 */
export async function buscarDashboardAdmin(opcoes = {}) {
  const resposta = await requisicaoApi('/admin/dashboard', opcoes)
  return resposta?.data || null
}

/**
 * Lists registered establishments with their latest submission via GET /api/admin/establishments.
 */
export async function listarEstabelecimentosAdmin(filtros = {}, opcoes = {}) {
  const query = montarQuery({
    q: filtros.q,
    sector_id: filtros.sector_id,
    status: filtros.status,
    page: filtros.page,
    limit: filtros.limit,
  })
  const resposta = await requisicaoApi(`/admin/establishments${query}`, opcoes)
  return {
    data: Array.isArray(resposta?.data) ? resposta.data : [],
    meta: resposta?.meta || { page: 1, limit: 20, total: 0, total_pages: 0 },
  }
}
