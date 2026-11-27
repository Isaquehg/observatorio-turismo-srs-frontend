import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSessao } from './Sessao'
import { periodoAtual } from '../paginas/comerciante/prazo'
import {
  aprovarEnvioAdmin,
  atualizarEnvio,
  buscarDashboardAdmin,
  buscarEnvioAdmin,
  buscarMeuPainelEstabelecimento,
  criarEnvio,
  devolverEnvioAdmin,
  enviarLembretesAdmin,
  formatarMesReferenciaIso,
  formatarPeriodoIso,
  listarEnviosAdmin,
  listarFaltantesAdmin,
  listarMeusEnvios,
  normalizarEnvio,
  normalizarFaltante,
  reabrirEnvioAdmin,
  submeterEnvio,
} from '../util/enviosApi'

const EnviosContexto = createContext(null)

function ordenarPorPeriodo(lista) {
  return [...lista].sort((a, b) => b.ano - a.ano || b.mes - a.mes || (b.id || 0) - (a.id || 0))
}

export function EnviosProvider({ children }) {
  const { sessao } = useSessao()
  const perfil = sessao?.perfil || null
  const autenticadoParaEnvios = perfil === 'comerciante' || perfil === 'prefeitura'

  const [envios, setEnvios] = useState([])
  const [faltantes, setFaltantes] = useState([])
  const [estabelecimento, setEstabelecimento] = useState(null)
  const [painelComerciante, setPainelComerciante] = useState(null)
  const [painelAdmin, setPainelAdmin] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [recarregamento, setRecarregamento] = useState(0)

  const periodoFaltantes = useMemo(() => {
    const ref = periodoAtual()
    return formatarPeriodoIso(ref.ano, ref.mes)
  }, [])

  const recarregar = useCallback(() => {
    setRecarregamento((valor) => valor + 1)
  }, [])

  // Loads submission data strictly for authenticated merchant or city hall sessions to avoid 401/403 calls on public routes
  useEffect(() => {
    if (!autenticadoParaEnvios) {
      setEnvios([])
      setFaltantes([])
      setEstabelecimento(null)
      setPainelComerciante(null)
      setPainelAdmin(null)
      setCarregando(false)
      setErro('')
      return
    }

    const controlador = new AbortController()
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        if (perfil === 'comerciante') {
          const [respostaEnvios, painel] = await Promise.all([
            listarMeusEnvios({ limit: 100 }, { signal: controlador.signal }),
            buscarMeuPainelEstabelecimento({ signal: controlador.signal }).catch(() => null),
          ])
          if (!ativo) return
          const est = painel?.establishment || null
          setEstabelecimento(est)
          setPainelComerciante(painel)
          setPainelAdmin(null)
          setFaltantes([])
          setEnvios(ordenarPorPeriodo(respostaEnvios.data.map((item) => normalizarEnvio(item, est))))
        } else {
          const [respostaEnvios, respostaFaltantes, resumoAdmin] = await Promise.all([
            listarEnviosAdmin({ limit: 100 }, { signal: controlador.signal }),
            listarFaltantesAdmin(periodoFaltantes, { limit: 100 }, { signal: controlador.signal }).catch(
              () => ({ data: [] }),
            ),
            buscarDashboardAdmin({ signal: controlador.signal }).catch(() => null),
          ])
          if (!ativo) return
          setEstabelecimento(null)
          setPainelComerciante(null)
          setPainelAdmin(resumoAdmin)
          setEnvios(ordenarPorPeriodo(respostaEnvios.data.map((item) => normalizarEnvio(item))))
          setFaltantes(respostaFaltantes.data.map(normalizarFaltante))
        }
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os envios.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [autenticadoParaEnvios, perfil, sessao?.token, periodoFaltantes, recarregamento])

  const mesclarEnvio = useCallback((normalizado) => {
    setEnvios((lista) =>
      ordenarPorPeriodo([normalizado, ...lista.filter((item) => item.id !== normalizado.id)]),
    )
    return normalizado
  }, [])

  // Creates or updates a merchant monthly submission/draft and optionally submits it for city hall review
  const salvarEnvio = useCallback(
    async ({
      idExistente,
      ano,
      mes,
      roomsAvailable,
      bedsAvailable,
      roomNightsSold,
      employeesCount,
      guestsCount,
      mainTravelReason,
      mainOrigin,
      notes,
      submit = true,
    }) => {
      const referenceMonth = formatarMesReferenciaIso(ano, mes)
      const corpoBase = {
        reference_month: referenceMonth,
        rooms_available: roomsAvailable ?? null,
        beds_available: bedsAvailable ?? null,
        room_nights_sold: roomNightsSold ?? null,
        employees_count: employeesCount ?? null,
        guests_count: guestsCount ?? null,
        main_travel_reason: mainTravelReason ?? null,
        main_origin: mainOrigin ?? null,
        notes: notes?.trim() ? notes.trim() : null,
      }

      const alvoEditavel =
        envios.find((item) => item.id === idExistente && ['draft', 'returned'].includes(item.status)) ||
        envios.find(
          (item) =>
            item.ano === ano &&
            item.mes === mes &&
            ['draft', 'returned'].includes(item.status),
        )

      let respostaApi
      if (alvoEditavel) {
        // PATCH does not allow the submit field; transition via POST /:id/submit afterwards when submitting
        respostaApi = await atualizarEnvio(alvoEditavel.id, corpoBase)
        if (submit) {
          respostaApi = await submeterEnvio(alvoEditavel.id)
        }
      } else {
        respostaApi = await criarEnvio({ ...corpoBase, submit: Boolean(submit) })
      }

      const normalizado = normalizarEnvio(respostaApi, estabelecimento)
      return mesclarEnvio(normalizado)
    },
    [envios, estabelecimento, mesclarEnvio],
  )

  // Fetches full details including backend consistency alerts for a specific submission under review
  const carregarDetalhesAdmin = useCallback(
    async (id) => {
      const detalhe = await buscarEnvioAdmin(id)
      if (!detalhe || Array.isArray(detalhe)) return null
      const normalizado = normalizarEnvio(detalhe)
      return mesclarEnvio(normalizado)
    },
    [mesclarEnvio],
  )

  const aprovarEnvio = useCallback(
    async (id, opcoes) => {
      const atualizado = await aprovarEnvioAdmin(id, opcoes)
      const normalizado = normalizarEnvio(atualizado)
      mesclarEnvio(normalizado)
      setPainelAdmin((atual) =>
        atual
          ? { ...atual, pending_validation: Math.max(0, (atual.pending_validation ?? 0) - 1) }
          : atual,
      )
      return normalizado
    },
    [mesclarEnvio],
  )

  const devolverEnvio = useCallback(
    async (id, motivo) => {
      const atualizado = await devolverEnvioAdmin(id, motivo)
      const normalizado = normalizarEnvio(atualizado)
      mesclarEnvio(normalizado)
      setPainelAdmin((atual) =>
        atual
          ? { ...atual, pending_validation: Math.max(0, (atual.pending_validation ?? 0) - 1) }
          : atual,
      )
      return normalizado
    },
    [mesclarEnvio],
  )

  const reabrirEnvio = useCallback(
    async (id) => {
      const atualizado = await reabrirEnvioAdmin(id)
      const normalizado = normalizarEnvio(atualizado)
      mesclarEnvio(normalizado)
      setPainelAdmin((atual) =>
        atual
          ? { ...atual, pending_validation: (atual.pending_validation ?? 0) + 1 }
          : atual,
      )
      return normalizado
    },
    [mesclarEnvio],
  )

  const enviarLembrete = useCallback(
    async (establishmentIds) => {
      const resultado = await enviarLembretesAdmin(periodoFaltantes, establishmentIds)
      const lembretesPorEstab = new Map(
        (resultado?.reminders || []).map((item) => [item.establishment_id, item]),
      )
      setFaltantes((lista) =>
        lista.map((item) => {
          const registro = lembretesPorEstab.get(item.id)
          if (!registro) return item
          return {
            ...item,
            ultimoLembrete: {
              status: registro.status,
              enviadoEm: 'agora',
            },
          }
        }),
      )
      return resultado
    },
    [periodoFaltantes],
  )

  const valor = useMemo(() => {
    const pendentes = envios.filter((e) => e.situacao === 'analise')
    return {
      envios,
      pendentes,
      totalPendentes: painelAdmin?.pending_validation ?? pendentes.length,
      faltantes,
      periodoFaltantes,
      estabelecimento,
      painelComerciante,
      painelAdmin,
      carregando,
      erro,
      recarregar,
      salvarEnvio,
      carregarDetalhesAdmin,
      aprovarEnvio,
      devolverEnvio,
      reabrirEnvio,
      enviarLembrete,
    }
  }, [
    envios,
    painelAdmin,
    faltantes,
    periodoFaltantes,
    estabelecimento,
    painelComerciante,
    carregando,
    erro,
    recarregar,
    salvarEnvio,
    carregarDetalhesAdmin,
    aprovarEnvio,
    devolverEnvio,
    reabrirEnvio,
    enviarLembrete,
  ])

  return <EnviosContexto.Provider value={valor}>{children}</EnviosContexto.Provider>
}

export const useEnvios = () => useContext(EnviosContexto)
