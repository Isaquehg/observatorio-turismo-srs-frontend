import { useCallback, useEffect, useState } from 'react'
import Icone from '../componentes/Icone'
import { Aviso, Migalhas, Selo, Sobretitulo } from '../componentes/Basicos'
import { obterBaseUrlApi } from '../util/api'
import { verificarSaudeApi, verificarSaudeBanco } from '../util/relatoriosApi'
import { useTitulo } from '../util/ganchos'
import './publico.css'

export default function StatusApi() {
  useTitulo('Status da API')
  const apiUrl = obterBaseUrlApi()
  const [carregando, setCarregando] = useState(true)
  const [saudeApi, setSaudeApi] = useState(null)
  const [erroApi, setErroApi] = useState('')
  const [saudeBanco, setSaudeBanco] = useState(null)
  const [erroBanco, setErroBanco] = useState('')
  const [latenciaMs, setLatenciaMs] = useState(null)

  // Queries both GET /api/health and GET /api/health/database in parallel to report API and PostgreSQL RDS health
  const verificar = useCallback(async (signal) => {
    setCarregando(true)
    setErroApi('')
    setErroBanco('')
    const inicio = Date.now()

    const [resultadoApi, resultadoBanco] = await Promise.allSettled([
      verificarSaudeApi({ signal }),
      verificarSaudeBanco({ signal }),
    ])

    if (signal?.aborted) return

    setLatenciaMs(Date.now() - inicio)

    if (resultadoApi.status === 'fulfilled') {
      setSaudeApi(resultadoApi.value)
    } else if (resultadoApi.reason?.name !== 'AbortError') {
      setSaudeApi(null)
      setErroApi(resultadoApi.reason?.message || 'Não foi possível alcançar a API.')
    }

    if (resultadoBanco.status === 'fulfilled') {
      setSaudeBanco(resultadoBanco.value)
    } else if (resultadoBanco.reason?.name !== 'AbortError') {
      setSaudeBanco(null)
      setErroBanco(resultadoBanco.reason?.message || 'Conexão com o banco de dados indisponível.')
    }

    setCarregando(false)
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    verificar(controlador.signal)
    return () => controlador.abort()
  }, [verificar])

  const apiOnline = saudeApi?.status === 'success'
  const bancoConectado = saudeBanco?.status === 'success' && saudeBanco?.database === 'connected'

  return (
    <div className="container pag surgir">
      <div className="pag__cab">
        <div>
          <Migalhas atual="Status da API" />
          <Sobretitulo>Diagnóstico de conexão · Front-end ↔ AWS</Sobretitulo>
          <h1 className="display-l pag__titulo">Status da API</h1>
          <p className="corpo-l pag__abertura">
            Verificação em tempo real do servidor da API e da conexão com o banco PostgreSQL na AWS.
          </p>
        </div>
        <button
          type="button"
          className="ot-btn ot-btn--secundario"
          onClick={() => verificar()}
          disabled={carregando}
          aria-busy={carregando}
        >
          <Icone nome="nuvem" /> {carregando ? 'Verificando…' : 'Verificar novamente'}
        </button>
      </div>

      <div className="grade-3" style={{ marginBottom: 24 }}>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>API do Observatório</span>
          <span className="ot-mini__v ot-mini__v--texto">
            {carregando ? 'Verificando…' : apiOnline ? 'Online' : 'Indisponível'}
          </span>
          {!carregando && (
            <Selo situacao={apiOnline ? 'publicado' : 'recusado'} style={{ alignSelf: 'flex-start' }}>
              {apiOnline ? 'GET /api/health · OK' : 'Falha na API'}
            </Selo>
          )}
        </div>

        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Banco PostgreSQL (AWS)</span>
          <span className="ot-mini__v ot-mini__v--texto">
            {carregando ? 'Verificando…' : bancoConectado ? 'Conectado' : 'Desconectado'}
          </span>
          {!carregando && (
            <Selo situacao={bancoConectado ? 'publicado' : 'recusado'} style={{ alignSelf: 'flex-start' }}>
              {bancoConectado ? 'GET /api/health/database · OK' : 'Sem conexão'}
            </Selo>
          )}
        </div>

        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Endereço configurado</span>
          <span className="ot-mini__v ot-mini__v--texto" style={{ wordBreak: 'break-all' }}>
            {apiUrl}
          </span>
          <span className="corpo-s suave">
            {latenciaMs != null && !carregando ? `Tempo de resposta: ${latenciaMs} ms` : 'VITE_API_URL ativa'}
          </span>
        </div>
      </div>

      {carregando && (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Testando conexão com a API e o banco PostgreSQL na AWS…</p>
        </div>
      )}

      {!carregando && (
        <div className="pilha" style={{ gap: 16 }}>
          {apiOnline ? (
            <Aviso tipo="sucesso" titulo="Servidor da API respondendo normalmente">
              {saudeApi.message || 'SRS Tourism API is running'}
            </Aviso>
          ) : (
            <Aviso tipo="erro" titulo="Falha ao conectar com a API (/api/health)">
              {erroApi || 'Não foi possível confirmar o status da API.'}
            </Aviso>
          )}

          {bancoConectado ? (
            <Aviso tipo="sucesso" titulo="Conexão com o banco de dados PostgreSQL saudável">
              {saudeBanco.message || 'Database connection is healthy'} ({saudeBanco.database})
            </Aviso>
          ) : (
            <Aviso tipo="erro" titulo="Falha na conexão com o PostgreSQL (/api/health/database)">
              {erroBanco || 'Banco de dados indisponível no momento.'}
            </Aviso>
          )}
        </div>
      )}
    </div>
  )
}
