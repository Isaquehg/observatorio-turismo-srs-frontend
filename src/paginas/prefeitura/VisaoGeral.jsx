import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Aviso, Campo, Dialogo, Selo } from '../../componentes/Basicos'
import { BarrasVerticais } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { useSessao } from '../../contexto/Sessao'
import {
  atualizarIndicador,
  confirmarImportacaoIndicadores,
  criarIndicador,
  excluirIndicador,
  formatarDataSegura,
  listarIndicadores,
  listarSetores,
  METRICAS_INDICADOR,
  previsualizarImportacaoIndicadores,
} from '../../util/indicadoresApi'
import { mesAno, mesAnoLongo, MESES_CURTOS, MESES_LONGOS, numero } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import { TabelaEnvios } from './Envios'
import RevisarEnvio from './RevisarEnvio'
import '../painel.css'

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

// Builds the selectable month options normalized to YYYY-MM-01 as required by POST /api/indicators
function gerarPeriodosRecentes(quantidade = 6) {
  const hoje = new Date()
  return Array.from({ length: quantidade }, (_, indice) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (indice + 1), 1)
    const ano = d.getFullYear()
    const mes = d.getMonth() + 1
    const referenceDate = `${ano}-${String(mes).padStart(2, '0')}-01`
    const rotulo = `${MESES_LONGOS[d.getMonth()].replace(/^./, (l) => l.toUpperCase())} de ${ano}`
    return { valor: referenceDate, rotulo }
  })
}

function formatarReferencia(referenceDate) {
  if (!referenceDate) return '—'
  const [ano, mes] = String(referenceDate).slice(0, 10).split('-').map(Number)
  if (!ano || !mes) return referenceDate
  return mesAno(ano, mes)
}

function formatarReferenciaLonga(referenceDate) {
  if (!referenceDate) return ''
  const [ano, mes] = String(referenceDate).slice(0, 10).split('-').map(Number)
  if (!ano || !mes) return ''
  return mesAnoLongo(ano, mes)
}

function FormularioEdicaoIndicador({ indicador, salvando, erroApi, aoSalvar, aoFechar }) {
  const [valores, setValores] = useState({
    visitors_count: String(indicador.visitors_count ?? 0),
    beds_count: String(indicador.beds_count ?? 0),
    accommodations_count: String(indicador.accommodations_count ?? 0),
    companies_count: String(indicador.companies_count ?? 0),
    jobs_count: String(indicador.jobs_count ?? 0),
    occupancy_rate: indicador.occupancy_rate == null ? '' : String(indicador.occupancy_rate),
    source: indicador.source || '',
    published: Boolean(indicador.published),
  })
  const [erroLocal, setErroLocal] = useState('')

  const atualizar = (campo, valor) => {
    setValores((atual) => ({ ...atual, [campo]: valor }))
    setErroLocal('')
  }

  const enviar = (e) => {
    e.preventDefault()
    const inteiros = [
      'visitors_count',
      'beds_count',
      'accommodations_count',
      'companies_count',
      'jobs_count',
    ]
    const payload = {
      published: valores.published,
      source: valores.source.trim() || null,
    }

    for (const campo of inteiros) {
      const parsed = Number(valores[campo])
      if (!Number.isInteger(parsed) || parsed < 0) {
        setErroLocal('Os valores numéricos devem ser inteiros maiores ou iguais a zero.')
        return
      }
      payload[campo] = parsed
    }

    if (valores.occupancy_rate.trim() === '') {
      payload.occupancy_rate = null
    } else {
      const ocupacao = Number(valores.occupancy_rate.replace(',', '.'))
      if (Number.isNaN(ocupacao) || ocupacao < 0 || ocupacao > 100) {
        setErroLocal('A taxa de ocupação deve estar entre 0 e 100.')
        return
      }
      payload.occupancy_rate = ocupacao
    }

    aoSalvar(indicador.id, payload)
  }

  return (
    <form onSubmit={enviar} className="pilha" style={{ gap: 16 }} noValidate>
      <p className="corpo-s suave">
        {formatarReferencia(indicador.reference_date)} · {indicador.sector?.name || 'Global'}
      </p>

      <div className="form-grade" style={{ marginTop: 0 }}>
        <Campo id="edit-visitantes" rotulo="Visitantes">
          <input
            id="edit-visitantes"
            className="ot-entrada ot-num"
            inputMode="numeric"
            value={valores.visitors_count}
            onChange={(e) => atualizar('visitors_count', e.target.value)}
          />
        </Campo>
        <Campo id="edit-leitos" rotulo="Leitos">
          <input
            id="edit-leitos"
            className="ot-entrada ot-num"
            inputMode="numeric"
            value={valores.beds_count}
            onChange={(e) => atualizar('beds_count', e.target.value)}
          />
        </Campo>
        <Campo id="edit-hospedagens" rotulo="Meios de hospedagem">
          <input
            id="edit-hospedagens"
            className="ot-entrada ot-num"
            inputMode="numeric"
            value={valores.accommodations_count}
            onChange={(e) => atualizar('accommodations_count', e.target.value)}
          />
        </Campo>
        <Campo id="edit-empresas" rotulo="Empresas">
          <input
            id="edit-empresas"
            className="ot-entrada ot-num"
            inputMode="numeric"
            value={valores.companies_count}
            onChange={(e) => atualizar('companies_count', e.target.value)}
          />
        </Campo>
        <Campo id="edit-empregos" rotulo="Empregos">
          <input
            id="edit-empregos"
            className="ot-entrada ot-num"
            inputMode="numeric"
            value={valores.jobs_count}
            onChange={(e) => atualizar('jobs_count', e.target.value)}
          />
        </Campo>
        <Campo id="edit-ocupacao" rotulo="Ocupação (%)">
          <input
            id="edit-ocupacao"
            className="ot-entrada ot-num"
            inputMode="decimal"
            placeholder="Opcional"
            value={valores.occupancy_rate}
            onChange={(e) => atualizar('occupancy_rate', e.target.value)}
          />
        </Campo>
        <div className="form-grade__largo">
          <Campo id="edit-fonte" rotulo="Fonte">
            <input
              id="edit-fonte"
              className="ot-entrada"
              value={valores.source}
              onChange={(e) => atualizar('source', e.target.value)}
            />
          </Campo>
        </div>
      </div>

      <label className="ot-check">
        <input
          type="checkbox"
          checked={valores.published}
          onChange={(e) => atualizar('published', e.target.checked)}
        />
        Publicado no site público
      </label>

      {(erroLocal || erroApi) && (
        <Aviso tipo="erro" titulo="Não foi possível salvar">
          {erroLocal || erroApi}
        </Aviso>
      )}

      <div className="ot-dialogo__acoes">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={aoFechar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="ot-btn ot-btn--primario" disabled={salvando} aria-busy={salvando}>
          <Icone nome="check" /> {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

function PublicarRapido({ setores, indicadores, aoSalvarIndicador, aoRecarregarIndicadores }) {
  const { avisar } = useAvisos()
  const periodos = useMemo(() => gerarPeriodosRecentes(6), [])
  const [metrica, setMetrica] = useState(METRICAS_INDICADOR[0].campo)
  const [periodo, setPeriodo] = useState(periodos[0].valor)
  const [setorId, setSetorId] = useState('')
  const [valor, setValor] = useState('')
  const [mostrar, setMostrar] = useState(true)
  const [erro, setErro] = useState('')
  const [erroApi, setErroApi] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [arquivo, setArquivo] = useState(null)
  const [arrastando, setArrastando] = useState(false)
  const [carregandoPrevia, setCarregandoPrevia] = useState(false)
  const [confirmandoImportacao, setConfirmandoImportacao] = useState(false)
  const [previaImportacao, setPreviaImportacao] = useState(null)
  const entradaArquivo = useRef(null)

  const metricaAtual = METRICAS_INDICADOR.find((m) => m.campo === metrica) || METRICAS_INDICADOR[0]
  const periodoAtual = periodos.find((p) => p.valor === periodo) || periodos[0]

  const publicar = async (e) => {
    e.preventDefault()
    setErroApi('')

    const limpo = valor.trim()
    const numeroConvertido =
      metricaAtual.tipo === 'percentual'
        ? Number(limpo.replace(',', '.'))
        : Number(limpo.replace(/\./g, '').replace(',', '.'))

    if (!limpo || Number.isNaN(numeroConvertido) || numeroConvertido < 0) {
      setErro('Digite um número, como 1.982.')
      document.getElementById('valor-rapido')?.focus()
      return
    }
    if (metricaAtual.tipo === 'percentual' && numeroConvertido > 100) {
      setErro('A taxa de ocupação deve estar entre 0 e 100.')
      document.getElementById('valor-rapido')?.focus()
      return
    }
    if (metricaAtual.tipo === 'inteiro' && !Number.isInteger(numeroConvertido)) {
      setErro('Informe um número inteiro, sem casas decimais.')
      document.getElementById('valor-rapido')?.focus()
      return
    }

    setErro('')
    setEnviando(true)
    const sectorIdNumerico = setorId ? Number(setorId) : null

    try {
      // Checks if a monthly record already exists for the (sector_id, reference_date) key
      const existente = indicadores.find(
        (item) =>
          item.reference_date === periodo &&
          (item.sector_id ?? null) === sectorIdNumerico,
      )

      let salvo
      if (existente) {
        salvo = await atualizarIndicador(existente.id, {
          [metrica]: numeroConvertido,
          published: mostrar,
          source: existente.source || 'OT-SRS / SMCELT',
        })
      } else {
        try {
          salvo = await criarIndicador({
            sector_id: sectorIdNumerico,
            reference_date: periodo,
            [metrica]: numeroConvertido,
            published: mostrar,
            source: 'OT-SRS / SMCELT',
          })
        } catch (erroCriacao) {
          // Handles 409 conflict when the existing monthly record was not in the current filtered list
          if (erroCriacao?.status === 409) {
            const busca = await listarIndicadores(
              {
                from: periodo,
                to: periodo,
                ...(sectorIdNumerico ? { sector_id: sectorIdNumerico } : {}),
                limit: 50,
              },
              { permitirRascunhos: true },
            )
            const correspondente = busca.data.find(
              (item) =>
                item.reference_date === periodo &&
                (item.sector_id ?? null) === sectorIdNumerico,
            )
            if (!correspondente) throw erroCriacao
            salvo = await atualizarIndicador(correspondente.id, {
              [metrica]: numeroConvertido,
              published: mostrar,
              source: correspondente.source || 'OT-SRS / SMCELT',
            })
          } else {
            throw erroCriacao
          }
        }
      }

      if (salvo) {
        aoSalvarIndicador(salvo)
      }
      setValor('')
      avisar(mostrar ? 'Publicado no site' : 'Salvo sem publicar', {
        texto: `${metricaAtual.rotulo} · ${periodoAtual.rotulo}: ${numero(numeroConvertido)}.`,
      })
    } catch (causa) {
      setErroApi(causa?.message || 'Não foi possível salvar o indicador.')
    } finally {
      setEnviando(false)
    }
  }

  const receberArquivo = (f) => {
    if (!f) return
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      avisar('Formato não aceito', { texto: 'Envie uma planilha CSV ou XLSX.', tipo: 'erro' })
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      avisar('Arquivo grande demais', { texto: 'O limite é 10 MB.', tipo: 'erro' })
      return
    }
    setArquivo(f)
    setErroApi('')
  }

  const conferirPlanilha = async () => {
    if (!arquivo) return
    setCarregandoPrevia(true)
    setErroApi('')
    try {
      const previa = await previsualizarImportacaoIndicadores(arquivo)
      setPreviaImportacao(previa)
    } catch (causa) {
      avisar('Falha ao conferir planilha', {
        texto: causa?.message || 'Não foi possível validar o arquivo enviado.',
        tipo: 'erro',
      })
    } finally {
      setCarregandoPrevia(false)
    }
  }

  const confirmarImportacao = async () => {
    if (!previaImportacao?.preview_id) return
    setConfirmandoImportacao(true)
    try {
      const resultado = await confirmarImportacaoIndicadores(previaImportacao.preview_id)
      setPreviaImportacao(null)
      setArquivo(null)
      aoRecarregarIndicadores()
      avisar('Planilha importada', {
        texto: `${resultado?.imported_rows ?? previaImportacao.valid_rows} linha(s) importada(s) com sucesso.`,
      })
    } catch (causa) {
      avisar('Erro na importação', {
        texto: causa?.message || 'Não foi possível confirmar a importação.',
        tipo: 'erro',
      })
    } finally {
      setConfirmandoImportacao(false)
    }
  }

  return (
    <section className="ot-cartao publicar" aria-labelledby="titulo-publicar">
      <div className="publicar__cab">
        <div>
          <h2 className="titulo-2" id="titulo-publicar">Publicar dado rápido</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Atualize um indicador do site sem sair do painel.</p>
        </div>
        <label className="ot-check">
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} /> Mostrar no site assim que publicar
        </label>
      </div>
      <form className="pilha" style={{ gap: 16 }} onSubmit={publicar} noValidate>
        <div className="publicar__campos">
          <Campo id="indicador-rapido" rotulo="Indicador">
            <select id="indicador-rapido" className="ot-selecao" value={metrica} onChange={(e) => setMetrica(e.target.value)}>
              {METRICAS_INDICADOR.map((item) => (
                <option key={item.campo} value={item.campo}>{item.rotulo}</option>
              ))}
            </select>
          </Campo>
          <Campo id="periodo-rapido" rotulo="Período">
            <select id="periodo-rapido" className="ot-selecao" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {periodos.map((p) => (
                <option key={p.valor} value={p.valor}>{p.rotulo}</option>
              ))}
            </select>
          </Campo>
          <Campo id="valor-rapido" rotulo="Valor" erro={erro}>
            <input
              id="valor-rapido"
              className="ot-entrada ot-num"
              inputMode="decimal"
              placeholder="Ex.: 1.982"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value)
                setErro('')
                if (erroApi) setErroApi('')
              }}
              aria-invalid={!!erro}
            />
          </Campo>
          <div className="publicar__botao">
            <button
              type="submit"
              className="ot-btn ot-btn--primario ot-btn--largo"
              disabled={enviando}
              aria-busy={enviando}
            >
              {enviando ? (
                <>
                  <span className="girando" aria-hidden="true" /> Salvando…
                </>
              ) : (
                <>
                  <Icone nome="upload" /> Publicar
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 340 }}>
          <Campo id="setor-rapido" rotulo="Setor" extra="(opcional)">
            <select
              id="setor-rapido"
              className="ot-selecao"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              <option value="">Todos os setores (global)</option>
              {setores.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.nome}</option>
              ))}
            </select>
          </Campo>
        </div>

        {erroApi && (
          <Aviso tipo="erro" titulo="Não foi possível salvar o indicador">
            {erroApi}
          </Aviso>
        )}
      </form>

      <div
        className="ot-drop"
        data-arrastando={arrastando}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); receberArquivo(e.dataTransfer.files[0]) }}
      >
        <Icone nome={arquivo ? 'arquivo' : 'nuvem'} tamanho="l" />
        {arquivo ? (
          <div style={{ flex: 1 }}>
            <strong>{arquivo.name}</strong>
            <br />
            <span className="corpo-s suave">{(arquivo.size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB · pronto para conferir</span>
          </div>
        ) : (
          <div>
            <strong>Ou envie uma planilha com vários indicadores</strong>
            <br />
            <span className="corpo-s suave">Arraste para cá. CSV ou XLSX, até 10 MB. Você confere tudo antes de publicar.</span>
          </div>
        )}
        {arquivo ? (
          <div className="linha-acoes">
            <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => setArquivo(null)} disabled={carregandoPrevia}>
              Trocar
            </button>
            <button
              type="button"
              className="ot-btn ot-btn--solido ot-btn--p"
              onClick={conferirPlanilha}
              disabled={carregandoPrevia}
              aria-busy={carregandoPrevia}
            >
              {carregandoPrevia ? 'Validando…' : 'Conferir dados'}
            </button>
          </div>
        ) : (
          <button type="button" className="ot-btn ot-btn--secundario ot-btn--p" onClick={() => entradaArquivo.current?.click()}>Escolher arquivo</button>
        )}
        <input ref={entradaArquivo} type="file" accept=".csv,.xlsx" hidden onChange={(e) => { receberArquivo(e.target.files[0]); e.target.value = '' }} />
      </div>

      <Dialogo
        aberto={!!previaImportacao}
        aoFechar={() => !confirmandoImportacao && setPreviaImportacao(null)}
        titulo="Conferir importação de indicadores"
        largura={640}
        acoes={
          previaImportacao && (
            <>
              <button
                type="button"
                className="ot-btn ot-btn--secundario"
                onClick={() => setPreviaImportacao(null)}
                disabled={confirmandoImportacao}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ot-btn ot-btn--primario"
                disabled={!previaImportacao.valid || confirmandoImportacao}
                aria-busy={confirmandoImportacao}
                onClick={confirmarImportacao}
              >
                <Icone nome="check" /> {confirmandoImportacao ? 'Importando…' : 'Confirmar importação'}
              </button>
            </>
          )
        }
      >
        {previaImportacao && (
          <>
            <p className="corpo">
              Arquivo <strong>{previaImportacao.file_name}</strong>: {previaImportacao.valid_rows} de{' '}
              {previaImportacao.total_rows} linha(s) válidas.
            </p>
            {previaImportacao.valid ? (
              <Aviso tipo="sucesso" titulo="Tudo certo para importar">
                Os indicadores serão gravados no banco ao confirmar.
              </Aviso>
            ) : (
              <Aviso tipo="erro" titulo="Corrija os erros antes de confirmar">
                {previaImportacao.errors?.slice(0, 5).map((item) => (
                  <span key={item.row} style={{ display: 'block' }}>
                    Linha {item.row}:{' '}
                    {Array.isArray(item.details)
                      ? item.details.map((d) => `${d.field}: ${d.message}`).join('; ')
                      : 'Linha inválida.'}
                  </span>
                ))}
              </Aviso>
            )}
          </>
        )}
      </Dialogo>
    </section>
  )
}

export default function VisaoGeral() {
  useTitulo('Painel da Prefeitura')
  const { sessao } = useSessao()
  const {
    pendentes,
    totalPendentes,
    painelAdmin,
    carregando: carregandoEnvios,
    erro: erroEnvios,
    recarregar: recarregarEnvios,
  } = useEnvios()
  const { avisar } = useAvisos()
  const [revisando, setRevisando] = useState(null)
  const atrasados = painelAdmin?.overdue_validation ?? pendentes.filter((e) => e.atrasado).length
  const taxaResposta = painelAdmin?.response_rate
  const periodoResposta = painelAdmin?.current_period
    ? formatarReferenciaLonga(`${painelAdmin.current_period}-01`)
    : ''

  const ehPrefeitura = sessao?.perfil === 'prefeitura'
  const [setores, setSetores] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [carregandoIndicadores, setCarregandoIndicadores] = useState(true)
  const [erroIndicadores, setErroIndicadores] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('todos')
  const [filtroSetor, setFiltroSetor] = useState('todos')
  const [recarregamento, setRecarregamento] = useState(0)

  const [editandoIndicador, setEditandoIndicador] = useState(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const [processandoId, setProcessandoId] = useState(null)

  const recarregarIndicadores = useCallback(() => {
    setRecarregamento((valor) => valor + 1)
  }, [])

  // Loads sectors and all indicators (including drafts for city hall) from the real API
  useEffect(() => {
    if (!ehPrefeitura) return
    const controlador = new AbortController()
    let ativo = true

    async function carregar() {
      setCarregandoIndicadores(true)
      setErroIndicadores('')
      try {
        const [listaSetores, respostaIndicadores] = await Promise.all([
          listarSetores({ signal: controlador.signal }),
          listarIndicadores(
            {
              ...(filtroSetor !== 'todos' ? { sector_id: Number(filtroSetor) } : {}),
              ...(filtroSituacao === 'publicados'
                ? { published: true }
                : filtroSituacao === 'rascunhos'
                  ? { published: false }
                  : {}),
              limit: 100,
            },
            { permitirRascunhos: true, signal: controlador.signal },
          ),
        ])
        if (!ativo) return
        setSetores(listaSetores)
        setIndicadores(respostaIndicadores.data)
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErroIndicadores(causa?.message || 'Não foi possível carregar os indicadores cadastrados.')
      } finally {
        if (ativo) setCarregandoIndicadores(false)
      }
    }

    carregar()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [ehPrefeitura, filtroSetor, filtroSituacao, recarregamento])

  const mesclarIndicadorNaLista = useCallback(
    (salvo) => {
      setIndicadores((listaAtual) => {
        const correspondeSetor =
          filtroSetor === 'todos' || Number(filtroSetor) === (salvo.sector_id ?? null)
        const correspondeSituacao =
          filtroSituacao === 'todos' ||
          (filtroSituacao === 'publicados' && salvo.published) ||
          (filtroSituacao === 'rascunhos' && !salvo.published)

        const semAntigo = listaAtual.filter((item) => item.id !== salvo.id)
        if (!correspondeSetor || !correspondeSituacao) {
          return semAntigo
        }
        return [salvo, ...semAntigo].sort((a, b) =>
          String(b.reference_date || '').localeCompare(String(a.reference_date || '')),
        )
      })
    },
    [filtroSetor, filtroSituacao],
  )

  const salvarEdicaoIndicador = async (id, payload) => {
    setSalvandoEdicao(true)
    setErroEdicao('')
    try {
      const atualizado = await atualizarIndicador(id, payload)
      if (atualizado) mesclarIndicadorNaLista(atualizado)
      setEditandoIndicador(null)
      avisar('Indicador atualizado', {
        texto: `${formatarReferencia(atualizado?.reference_date)} foi atualizado.`,
      })
    } catch (causa) {
      setErroEdicao(causa?.message || 'Não foi possível atualizar o indicador.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const alternarPublicacao = async (item) => {
    setProcessandoId(item.id)
    try {
      const atualizado = await atualizarIndicador(item.id, { published: !item.published })
      if (atualizado) mesclarIndicadorNaLista(atualizado)
      avisar(atualizado?.published ? 'Indicador publicado' : 'Movido para rascunho', {
        texto: `${formatarReferencia(item.reference_date)} · ${item.sector?.name || 'Global'}.`,
      })
    } catch (causa) {
      avisar('Erro ao atualizar situação', {
        texto: causa?.message || 'Não foi possível alterar o status do indicador.',
        tipo: 'erro',
      })
    } finally {
      setProcessandoId(null)
    }
  }

  const removerIndicador = async (item) => {
    setProcessandoId(item.id)
    try {
      await excluirIndicador(item.id)
      setIndicadores((lista) => lista.filter((atual) => atual.id !== item.id))
      avisar('Indicador excluído', {
        texto: `${formatarReferencia(item.reference_date)} · ${item.sector?.name || 'Global'}.`,
        tipo: 'info',
      })
    } catch (causa) {
      avisar('Erro ao excluir indicador', {
        texto: causa?.message || 'Não foi possível excluir o indicador.',
        tipo: 'erro',
      })
    } finally {
      setProcessandoId(null)
    }
  }

  const ultimoPublicado = useMemo(
    () => indicadores.find((item) => item.published),
    [indicadores],
  )
  const metaResposta = painelAdmin?.response_rate_target ?? 75
  const historicoResposta = useMemo(() => {
    const serie = Array.isArray(painelAdmin?.response_rate_history)
      ? painelAdmin.response_rate_history
      : []
    return serie.map((item, indice) => {
      const [, mesStr] = String(item.period || '').split('-')
      const mesIndice = Number(mesStr) - 1
      const nomeMes = MESES_CURTOS[mesIndice] || item.period
      return {
        id: item.period || String(indice),
        nome: nomeMes,
        valor: Math.round(Number(item.rate) || 0),
        hex: indice === serie.length - 1 ? '#6C5CE0' : '#B986ED',
      }
    })
  }, [painelAdmin?.response_rate_history])

  const dataUltimoPublicado = formatarDataSegura(
    ultimoPublicado?.updated_at || ultimoPublicado?.reference_date,
  )

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Painel da Prefeitura · SMCELT" titulo={`${saudacao()}, equipe de Turismo`} cor="var(--ciano)">
        <a href="#titulo-publicar" className="ot-btn ot-btn--primario" onClick={(e) => { e.preventDefault(); document.getElementById('valor-rapido')?.focus() }}>
          <Icone nome="mais" /> Publicar novo dado
        </a>
      </TopoPainel>

      <div className="grade-4 grade-4--compacta">
        <Link to="/prefeitura/envios" className="ot-mini ot-mini--link">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Envios para validar</span>
          <span className="ot-mini__v ot-num">{carregandoEnvios ? '…' : totalPendentes}</span>
          {atrasados > 0 ? (
            <span className="ot-selo ot-selo--analise" style={{ alignSelf: 'flex-start' }}><Icone nome="relogio" />{atrasados} há mais de 3 dias</span>
          ) : (
            <span className="corpo-s suave">Nenhum atrasado</span>
          )}
        </Link>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>
            Taxa de resposta{periodoResposta ? ` · ${periodoResposta.split(' ')[0]}` : ''}
          </span>
          <span className="ot-mini__v ot-num">
            {carregandoEnvios ? '…' : taxaResposta == null ? '—' : `${Math.round(taxaResposta)}%`}
          </span>
          <span className="corpo-s suave">
            {painelAdmin
              ? `${painelAdmin.establishments_submitted ?? 0} de ${painelAdmin.establishments_expected ?? 0} estabelecimentos`
              : 'Sem dados do período'}
          </span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Último dado publicado</span>
          <span className="ot-mini__v ot-mini__v--texto">
            {carregandoIndicadores ? 'Carregando…' : dataUltimoPublicado || 'Nenhum dado'}
          </span>
          <span className="corpo-s suave">
            {ultimoPublicado
              ? `${formatarReferenciaLonga(ultimoPublicado.reference_date)}${ultimoPublicado.sector ? ` · ${ultimoPublicado.sector.name}` : ''}`
              : 'Publique um indicador abaixo'}
          </span>
        </div>
        <div className="ot-mini" style={{ background: 'var(--amarelo)' }}>
          <span className="corpo-s" style={{ fontWeight: 700 }}>Próximo relatório</span>
          <span className="ot-mini__v ot-mini__v--texto">OT nº 005/2026</span>
          <span className="corpo-s">Previsto para 30 out.</span>
        </div>
      </div>

      <div className="painel__grade painel__grade--larga">
        <section className="ot-cartao" style={{ padding: '28px 28px 12px' }}>
          <div className="ot-cartao__cab">
            <div>
              <h2 className="titulo-2">Aguardando validação</h2>
              <p className="corpo-s suave">Os mais antigos primeiro.</p>
            </div>
            <Link to="/prefeitura/envios" className="ot-btn ot-btn--fantasma ot-btn--p">Ver todos <Icone nome="seta" tamanho="s" /></Link>
          </div>
          {carregandoEnvios ? (
            <div className="ot-vazio" role="status" aria-live="polite">
              <span className="girando" aria-hidden="true" />
              <p className="corpo suave">Carregando envios…</p>
            </div>
          ) : erroEnvios ? (
            <Aviso tipo="erro" style={{ marginBottom: 16 }} titulo="Não foi possível carregar os envios">
              {erroEnvios}{' '}
              <button type="button" className="link-botao" onClick={recarregarEnvios}>
                Tentar novamente
              </button>
            </Aviso>
          ) : pendentes.length ? (
            <TabelaEnvios lista={[...pendentes].reverse().slice(0, 4)} aoRevisar={setRevisando} compacta />
          ) : (
            <div className="ot-vazio">
              <span className="ot-vazio__icone ot-bolha" style={{ background: 'var(--ciano)' }}><Icone nome="check-circulo" tamanho="l" /></span>
              <h3 className="titulo-3">Tudo validado!</h3>
            </div>
          )}
        </section>

        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Taxa de resposta</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Estabelecimentos que enviaram dados, por mês (%)</p>
          <div className="grafico__corpo">
            {carregandoEnvios ? (
              <div className="ot-vazio" role="status" aria-live="polite">
                <span className="girando" aria-hidden="true" />
                <p className="corpo suave">Carregando histórico…</p>
              </div>
            ) : historicoResposta.length > 0 ? (
              <BarrasVerticais
                descricao="Taxa de resposta mensal dos estabelecimentos nos últimos 6 meses"
                itens={historicoResposta}
              />
            ) : (
              <p className="corpo suave" style={{ padding: '32px 0' }}>
                Sem histórico de taxa de resposta disponível.
              </p>
            )}
          </div>
          <p className="ot-fonte">Meta para 2026: {metaResposta}% de resposta.</p>
        </section>
      </div>

      <PublicarRapido
        setores={setores}
        indicadores={indicadores}
        aoSalvarIndicador={mesclarIndicadorNaLista}
        aoRecarregarIndicadores={recarregarIndicadores}
      />

      <section className="ot-cartao" style={{ padding: '28px 28px 12px', marginTop: 24 }} aria-labelledby="titulo-gestao-indicadores">
        <div className="estab__barra">
          <div>
            <h2 className="titulo-2" id="titulo-gestao-indicadores">Indicadores cadastrados</h2>
            <p className="corpo-s suave">Gerencie dados publicados e rascunhos visíveis apenas para a Prefeitura.</p>
          </div>
          <div className="estab__filtros">
            <select
              className="ot-selecao"
              aria-label="Filtrar indicadores por setor"
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
            >
              <option value="todos">Todos os setores</option>
              {setores.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.nome}</option>
              ))}
            </select>
            <select
              className="ot-selecao"
              aria-label="Filtrar indicadores por situação"
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
            >
              <option value="todos">Todos os status</option>
              <option value="publicados">Publicados</option>
              <option value="rascunhos">Rascunhos</option>
            </select>
          </div>
        </div>

        {carregandoIndicadores && (
          <div className="ot-vazio" role="status" aria-live="polite">
            <span className="girando" aria-hidden="true" />
            <p className="corpo suave">Carregando indicadores…</p>
          </div>
        )}

        {!carregandoIndicadores && erroIndicadores && (
          <Aviso tipo="erro" style={{ marginBottom: 16 }} titulo="Não foi possível carregar os indicadores">
            {erroIndicadores}{' '}
            <button type="button" className="link-botao" onClick={recarregarIndicadores}>
              Tentar novamente
            </button>
          </Aviso>
        )}

        {!carregandoIndicadores && !erroIndicadores && indicadores.length === 0 && (
          <div className="ot-vazio">
            <span className="ot-vazio__icone ot-bolha"><Icone nome="grafico" tamanho="l" /></span>
            <h3 className="titulo-3">Nenhum indicador encontrado</h3>
            <p className="corpo suave">
              {filtroSetor !== 'todos' || filtroSituacao !== 'todos'
                ? 'Ajuste os filtros ou cadastre um novo dado acima.'
                : 'Use o formulário acima para publicar ou salvar o primeiro rascunho.'}
            </p>
            {(filtroSetor !== 'todos' || filtroSituacao !== 'todos') && (
              <button
                type="button"
                className="ot-btn ot-btn--secundario"
                onClick={() => {
                  setFiltroSetor('todos')
                  setFiltroSituacao('todos')
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!carregandoIndicadores && !erroIndicadores && indicadores.length > 0 && (
          <div className="ot-tabela-moldura">
            <table className="ot-tabela ot-tabela--cartoes">
              <thead>
                <tr>
                  <th>Período · setor</th>
                  <th className="ot-num">Visitantes</th>
                  <th className="ot-num">Leitos</th>
                  <th className="ot-num">Empregos</th>
                  <th className="ot-num">Ocupação</th>
                  <th>Situação</th>
                  <th><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {indicadores.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{formatarReferencia(item.reference_date)}</strong>
                      <span className="ot-tabela__sub">{item.sector?.name || 'Global'}</span>
                    </td>
                    <td className="ot-num" data-rotulo="Visitantes">{numero(item.visitors_count)}</td>
                    <td className="ot-num" data-rotulo="Leitos">{numero(item.beds_count)}</td>
                    <td className="ot-num" data-rotulo="Empregos">{numero(item.jobs_count)}</td>
                    <td className="ot-num" data-rotulo="Ocupação">
                      {item.occupancy_rate == null ? '—' : `${Math.round(item.occupancy_rate)}%`}
                    </td>
                    <td data-rotulo="Situação">
                      {item.published ? (
                        <Selo situacao="publicado">Publicado</Selo>
                      ) : (
                        <Selo situacao="analise" icone="lapis">Rascunho</Selo>
                      )}
                    </td>
                    <td className="ot-tabela__acoes">
                      <button
                        type="button"
                        className="ot-btn ot-btn--fantasma ot-btn--p"
                        disabled={processandoId === item.id}
                        onClick={() => {
                          setErroEdicao('')
                          setEditandoIndicador(item)
                        }}
                      >
                        <Icone nome="lapis" tamanho="s" /> Editar
                      </button>
                      <button
                        type="button"
                        className="ot-btn ot-btn--secundario ot-btn--p"
                        disabled={processandoId === item.id}
                        onClick={() => alternarPublicacao(item)}
                      >
                        {item.published ? 'Rascunho' : 'Publicar'}
                      </button>
                      <button
                        type="button"
                        className="ot-btn ot-btn--perigo ot-btn--p"
                        disabled={processandoId === item.id}
                        onClick={() => removerIndicador(item)}
                        aria-label={`Excluir indicador de ${formatarReferencia(item.reference_date)}`}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialogo
        aberto={!!editandoIndicador}
        aoFechar={() => !salvandoEdicao && setEditandoIndicador(null)}
        titulo="Editar indicador"
        largura={640}
      >
        {editandoIndicador && (
          <FormularioEdicaoIndicador
            key={editandoIndicador.id}
            indicador={editandoIndicador}
            salvando={salvandoEdicao}
            erroApi={erroEdicao}
            aoSalvar={salvarEdicaoIndicador}
            aoFechar={() => setEditandoIndicador(null)}
          />
        )}
      </Dialogo>

      <RevisarEnvio envio={revisando} aoFechar={() => setRevisando(null)} />
    </div>
  )
}
