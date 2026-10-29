import { ler } from './armazenamento'

// Reads the API base URL from Vercel/local environment variables
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

// Retrieves the JWT token saved in localStorage
function obterToken() {
  const sessao = ler('otsrs:sessao', null)
  return sessao?.token || null
}

/**
 * Standard HTTP client for JSON requests to the Express API
 */
export async function requisicaoApi(caminho, opcoes = {}) {
  const token = obterToken()
  const cabecalhos = {
    ...(opcoes.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opcoes.headers,
  }

  const resposta = await fetch(`${BASE_URL}/api${caminho}`, {
    ...opcoes,
    headers: cabecalhos,
  })

  // 204 No Content (e.g., DELETE /reports/:id) returns no body
  if (resposta.status === 204) {
    return null
  }

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const mensagem = dados?.error?.message || `Erro na comunicação com o servidor (${resposta.status})`
    const erro = new Error(mensagem)
    erro.status = resposta.status
    erro.codigo = dados?.error?.code
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
