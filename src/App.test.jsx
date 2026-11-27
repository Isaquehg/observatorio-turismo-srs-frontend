import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AcessibilidadeProvider } from './contexto/Acessibilidade'
import { SessaoProvider } from './contexto/Sessao'
import { EnviosProvider } from './contexto/Envios'
import { AvisosProvider } from './contexto/Avisos'
import { gravar } from './util/armazenamento'

// Helper to render App with the exact same Provider tree as main.jsx
function renderAppWithProviders(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AcessibilidadeProvider>
        <SessaoProvider>
          <EnviosProvider>
            <AvisosProvider>
              <App />
            </AvisosProvider>
          </EnviosProvider>
        </SessaoProvider>
      </AcessibilidadeProvider>
    </MemoryRouter>
  )
}

describe('App Smoke Tests (Providers & Routing)', () => {
  let fetchSpy

  beforeEach(() => {
    localStorage.clear()
    // Prevent real HTTP requests during smoke tests across all integrated routes
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const destino = String(url)
      if (destino.includes('/api/sectors')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
              { id: 2, slug: 'alimentacao', name: 'Alimentação' },
            ],
          }),
        }
      }
      if (destino.includes('/api/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              reference_date: '2025-10-01',
              last_updated: '2026-09-12T10:00:00.000Z',
              available_years: [2025],
              summary: { companies: 60, jobs: 420, beds: 450, visitors: 11700 },
              annual_summary: {
                accommodations: 15,
                occupancy_rate: 61,
                companies: 60,
                jobs: 420,
                beds: 450,
                visitors: 11700,
              },
              timeline: [{ reference_date: '2025-10-01', visitors: 11700, jobs: 420 }],
              by_sector: [{ sector_id: 1, sector: 'Hospedagem', visitors: 3200 }],
              occupancy_monthly: [
                { reference_date: '2025-10-01', occupancy_rate: 61, previous_year_occupancy_rate: null },
              ],
              origin_distribution: [{ origin: 'sul_de_minas', value: 80 }],
              beds_by_accommodation_type: [{ type: 'hotel', beds: 450 }],
              jobs_by_sector: [{ sector_id: 1, sector: 'Hospedagem', value: 120 }],
              companies_by_sector: [{ sector_id: 1, sector: 'Hospedagem', value: 15 }],
              accommodation_categories: [
                { type: 'hotel', establishments: 15, beds: 450, occupancy_rate: 61 },
              ],
              highlights: [
                { reference_date: '2025-10-01', visitors: 11700, jobs: 420, companies: 60, beds: 450 },
              ],
            },
          }),
        }
      }
      if (destino.includes('/api/indicators')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 1,
                sector_id: 1,
                reference_date: '2025-10-01',
                companies_count: 15,
                jobs_count: 120,
                beds_count: 450,
                visitors_count: 3200,
                accommodations_count: 15,
                occupancy_rate: 61,
                published: true,
                source: 'OT-SRS / SMCELT',
                updated_at: '2026-09-12T10:00:00.000Z',
                sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/submissions/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 10,
                establishment_id: 1,
                reference_month: '2026-08-01',
                rooms_available: 18,
                beds_available: 46,
                room_nights_sold: 380,
                employees_count: 8,
                guests_count: 510,
                main_travel_reason: 'negocios_trabalho',
                main_origin: 'sul_de_minas',
                notes: null,
                occupancy_rate: 68.1,
                status: 'approved',
                return_reason: null,
                submitted_at: '2026-09-04T14:00:00.000Z',
                reviewed_at: '2026-09-06T10:00:00.000Z',
                comparisons: {
                  city_average_occupancy_rate: 61,
                  sector_average_occupancy_rate: 63,
                },
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/establishments/me/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              establishment: {
                id: 1,
                trade_name: 'Hotel Central SRS',
                tax_id: '12345678000190',
                type: 'Hotel',
                rooms_count: 18,
                beds_count: 46,
                link_status: 'confirmed',
                cadastur_status: 'active',
                cadastur_expires_at: '2027-03-31',
                sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
              },
              current_period: '2026-09',
              submission_deadline: '2026-10-10',
              latest_submission: null,
              cadastur_active: true,
            },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions/missing')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 2,
                trade_name: 'Pousada da Serra',
                tax_id: '22345678000190',
                sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
                last_reminder: null,
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/submissions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 11,
                establishment_id: 1,
                reference_month: '2026-09-01',
                rooms_available: 18,
                beds_available: 46,
                room_nights_sold: 360,
                employees_count: 8,
                guests_count: 490,
                main_travel_reason: 'negocios_trabalho',
                main_origin: 'sul_de_minas',
                notes: null,
                occupancy_rate: 66.7,
                status: 'submitted',
                return_reason: null,
                overdue: false,
                submitted_at: '2026-10-03T12:00:00.000Z',
                establishment: {
                  id: 1,
                  trade_name: 'Hotel Central SRS',
                  tax_id: '12345678000190',
                  type: 'Hotel',
                  rooms_count: 18,
                  beds_count: 46,
                  sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
                },
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/admin/dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              pending_validation: 1,
              overdue_validation: 0,
              oldest_pending: [],
              response_rate: 50,
              response_rate_target: 75,
              response_rate_history: [
                { period: '2026-08', rate: 50, submitted: 1, expected: 2 },
                { period: '2026-09', rate: 60, submitted: 3, expected: 5 },
              ],
              current_period: '2026-09',
              establishments_submitted: 1,
              establishments_expected: 2,
              latest_published_indicator: null,
              next_scheduled_report: null,
            },
          }),
        }
      }
      if (destino.includes('/api/admin/reports/monthly')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              period: '2026-09',
              available_periods: ['2026-09'],
              summary: {
                received: 1,
                approved: 1,
                in_review: 0,
                returned: 0,
                average_occupancy_rate: 66.7,
                room_nights_sold: 360,
              },
              items: [],
            },
          }),
        }
      }
      if (destino.includes('/api/reports')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 1,
                title: 'Relatório OT 004/2025',
                summary: 'Análise de fluxo turístico',
                category: 'bulletin',
                pages: 24,
                file_size_bytes: 2936013,
                highlights: ['Fluxo crescente de visitantes.'],
                featured: true,
                file_url: 'https://srs-tourism-reports-bucket-inatel.s3.us-east-2.amazonaws.com/reports/ot-004.pdf',
                published_at: '2025-10-07',
                author: { id: 1, name: 'Admin SMCELT' },
              },
            ],
            meta: { page: 1, limit: 5, total: 1, total_pages: 1 },
          }),
        }
      }
      if (destino.includes('/api/health/database')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            message: 'Database connection is healthy',
            database: 'connected',
          }),
        }
      }
      if (destino.includes('/api/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            message: 'SRS Tourism API is running',
          }),
        }
      }
      if (destino.includes('/api/admin/establishments')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 1,
                trade_name: 'Hotel Central SRS',
                tax_id: '12345678000190',
                type: 'Hotel',
                beds_count: 46,
                sector: { id: 1, slug: 'hospedagem', name: 'Hospedagem' },
                latest_submission: {
                  reference_month: '2026-09-01',
                  status: 'submitted',
                  occupancy_rate: 66.7,
                  beds_available: 46,
                },
              },
            ],
            meta: { page: 1, limit: 100, total: 1, total_pages: 1 },
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', database: 'connected' }),
      }
    })
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('renders public pages (/ , /indicadores-publicos, /conheca-a-cidade, /sobre, /status-api) without crashing', () => {
    const publicRoutes = ['/', '/indicadores-publicos', '/conheca-a-cidade', '/sobre', '/status-api']

    for (const route of publicRoutes) {
      const { unmount } = renderAppWithProviders(route)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('renders login page (/entrar), redirects (/cadastur, /explorar), and 404 fallback page', () => {
    const routes = ['/entrar', '/cadastur', '/explorar', '/rota-inexistente-404']

    for (const route of routes) {
      const { unmount } = renderAppWithProviders(route)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('redirects unauthenticated users trying to access restricted routes to /entrar', () => {
    const { unmount } = renderAppWithProviders('/indicadores')
    // Unauthenticated user should be redirected to login screen
    expect(document.body.textContent).toContain('Entrar')
    unmount()
  })

  it('renders authenticated common restricted routes (/indicadores and /relatorios) when logged in', () => {
    gravar('ot-srs:sessao', { perfil: 'turista', nome: 'Visitante', identificador: 'turista@email.com' })

    const { unmount: unmountInd } = renderAppWithProviders('/indicadores')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmountInd()

    const { unmount: unmountRel } = renderAppWithProviders('/relatorios')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmountRel()
  })

  it('renders tourist restricted area (/turista) when logged in as turista', () => {
    gravar('ot-srs:sessao', { perfil: 'turista', nome: 'Visitante', identificador: 'turista@email.com' })

    const { unmount } = renderAppWithProviders('/turista')
    expect(document.body.textContent.length).toBeGreaterThan(0)
    unmount()
  })

  it('renders all merchant panel routes (/comerciante/*)', () => {
    gravar('ot-srs:sessao', { perfil: 'comerciante', nome: 'Restaurante Central', identificador: '12345678000199' })

    const rotasComerciante = [
      '/comerciante',
      '/comerciante/enviar',
      '/comerciante/historico',
      '/comerciante/estabelecimento',
      '/comerciante/guia',
    ]

    for (const rota of rotasComerciante) {
      const { unmount } = renderAppWithProviders(rota)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('renders all city hall panel routes (/prefeitura/*)', () => {
    gravar('ot-srs:sessao', { perfil: 'prefeitura', nome: 'SMCELT', identificador: 'turismo@pmsrs.mg.gov.br' })

    const rotasPrefeitura = [
      '/prefeitura',
      '/prefeitura/envios',
      '/prefeitura/estabelecimentos',
      '/prefeitura/relatorios',
      '/prefeitura/inventario',
    ]

    for (const rota of rotasPrefeitura) {
      const { unmount } = renderAppWithProviders(rota)
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })
})
