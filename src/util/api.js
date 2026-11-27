import { ler } from './armazenamento'

// Shared localStorage key for the authenticated session
export const CHAVE_SESSAO = 'ot-srs:sessao'

// In-memory JWT token used when "manter conectado" is disabled
let tokenSessaoMemoria = null

/**
 * Updates the in-memory JWT token so non-persistent sessions can authenticate requests.
 */
export function definirTokenSessao(token) {
  tokenSessaoMemoria = token || null
}

/**
 * Resolves the API base URL from Vite environment variables with a safe local fallback.
 */
export function obterBaseUrlApi() {
  const configurada = (import.meta.env.VITE_API_URL || '').trim()
  return (configurada || 'http://localhost:3000')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')
}

/**
 * Retrieves the active JWT token from memory or localStorage.
 */
export function obterTokenSessao() {
  if (tokenSessaoMemoria) return tokenSessaoMemoria
  const sessao = ler(CHAVE_SESSAO, null)
  return sessao?.token || null
}

/**
 * Standard HTTP client for JSON requests to the Express API.
 */
export async function requisicaoApi(caminho, opcoes = {}) {
  const { headers, autenticado = true, ...restoOpcoes } = opcoes
  const token = autenticado ? obterTokenSessao() : null
  const caminhoNormalizado = caminho.startsWith('/') ? caminho : `/${caminho}`
  const cabecalhos = {
    ...(restoOpcoes.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  let resposta
  try {
    resposta = await fetch(`${obterBaseUrlApi()}/api${caminhoNormalizado}`, {
      ...restoOpcoes,
      headers: cabecalhos,
    })
  } catch (causa) {
    if (causa?.name === 'AbortError') {
      throw causa
    }
    const erro = new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
    erro.status = 0
    erro.codigo = 'NETWORK_ERROR'
    erro.detalhes = []
    throw erro
  }

  // 204 No Content (e.g., DELETE /reports/:id, POST /auth/logout) returns no body
  if (resposta.status === 204) {
    return null
  }

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const detalhes = Array.isArray(dados?.error?.details) ? dados.error.details : []
    const mensagem =
      dados?.error?.message ||
      dados?.message ||
      `Erro na comunicação com o servidor (${resposta.status})`
    const erro = new Error(mensagem)
    erro.status = resposta.status
    erro.codigo = dados?.error?.code
    erro.detalhes = detalhes
    throw erro
  }

  return dados
}

/**
 * Uploads a PDF file to S3 via POST /api/reports/upload and returns { file_url, file_size_bytes }
 */
export async function uploadPdfRelatorio(arquivoPdf) {
  const formData = new FormData()
  formData.append('file', arquivoPdf)

  const resposta = await requisicaoApi('/reports/upload', {
    method: 'POST',
    body: formData,
  })

  return resposta.data
}
