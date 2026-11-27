import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAVE_SESSAO,
  definirTokenSessao,
  obterBaseUrlApi,
  requisicaoApi,
  uploadPdfRelatorio,
} from './api'
import { gravar } from './armazenamento'

describe('api utility unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    definirTokenSessao(null)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should resolve API base URL from VITE_API_URL with safe local fallback', () => {
    vi.stubEnv('VITE_API_URL', '')
    expect(obterBaseUrlApi()).toBe('http://localhost:3000')

    vi.stubEnv('VITE_API_URL', 'https://api.otsrs.gov.br/api/')
    expect(obterBaseUrlApi()).toBe('https://api.otsrs.gov.br')

    vi.stubEnv('VITE_API_URL', 'https://api.otsrs.gov.br///')
    expect(obterBaseUrlApi()).toBe('https://api.otsrs.gov.br')
  })

  it('should perform a JSON request without token when user is not logged in', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1 }] }),
    })

    const resultado = await requisicaoApi('/sectors')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/sectors'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    expect(resultado).toEqual({ data: [{ id: 1 }] })
  })

  it('should attach Bearer token when session exists in localStorage under ot-srs:sessao', async () => {
    gravar(CHAVE_SESSAO, { token: 'jwt-secret-token' })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 10 } }),
    })

    await requisicaoApi('/auth/me')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-secret-token',
        },
      }),
    )
  })

  it('should attach in-memory Bearer token for non-persistent sessions and skip it when autenticado is false', async () => {
    definirTokenSessao('memory-only-token')

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { token: 'new-token' } }),
      })

    await requisicaoApi('auth/me')
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer memory-only-token',
        },
      }),
    )

    await requisicaoApi('/auth/login', { method: 'POST', autenticado: false })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('should return null when response status is 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    const resultado = await requisicaoApi('/reports/1', { method: 'DELETE' })
    expect(resultado).toBeNull()
  })

  it('should throw formatted error with status, code, and details when API returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          details: [{ field: 'identifier', message: 'O CNPJ deve possuir 14 dígitos.' }],
        },
      }),
    })

    await expect(requisicaoApi('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      message: 'Os dados enviados são inválidos.',
      status: 400,
      codigo: 'VALIDATION_ERROR',
      detalhes: [{ field: 'identifier', message: 'O CNPJ deve possuir 14 dígitos.' }],
    })
  })

  it('should throw fallback error message when response body is not valid JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(requisicaoApi('/indicators')).rejects.toMatchObject({
      message: 'Erro na comunicação com o servidor (500)',
      status: 500,
      detalhes: [],
    })
  })

  it('should wrap network failures and rethrow AbortError without wrapping', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(requisicaoApi('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      status: 0,
      codigo: 'NETWORK_ERROR',
    })

    const abortError = new DOMException('Aborted', 'AbortError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError)

    await expect(requisicaoApi('/auth/me')).rejects.toBe(abortError)
  })

  it('should upload a PDF file using FormData without forcing application/json Content-Type', async () => {
    gravar(CHAVE_SESSAO, { token: 'admin-token' })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          file_url: 'https://bucket.s3.amazonaws.com/reports/doc.pdf',
          file_size_bytes: 4096,
        },
      }),
    })

    const fakePdf = new File(['%PDF-1.4'], 'relatorio.pdf', { type: 'application/pdf' })
    const resultado = await uploadPdfRelatorio(fakePdf)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/reports/upload'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }),
    )
    expect(resultado).toEqual({
      file_url: 'https://bucket.s3.amazonaws.com/reports/doc.pdf',
      file_size_bytes: 4096,
    })
  })
})
