import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requisicaoApi, uploadPdfRelatorio } from './api'
import { gravar } from './armazenamento'

describe('api utility unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
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

  it('should attach Bearer token when session exists in localStorage', async () => {
    gravar('otsrs:sessao', { token: 'jwt-secret-token' })

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

  it('should return null when response status is 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    const resultado = await requisicaoApi('/reports/1', { method: 'DELETE' })
    expect(resultado).toBeNull()
  })

  it('should throw formatted error with status and code when API returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' },
      }),
    })

    await expect(requisicaoApi('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      message: 'Credenciais inválidas.',
      status: 401,
      codigo: 'INVALID_CREDENTIALS',
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
    })
  })

  it('should upload a PDF file using FormData without forcing application/json Content-Type', async () => {
    gravar('otsrs:sessao', { token: 'admin-token' })

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
