import { useEffect, useMemo, useRef, useState } from 'react'
import Icone from '../../componentes/Icone'
import { Aviso, Campo, Dialogo } from '../../componentes/Basicos'
import { CartaoRelatorio, ResumoRelatorio, useResumo } from '../../componentes/Cartoes'
import { GraficoLinha } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { CATEGORIAS_RELATORIO } from '../../dados/relatorios'
import { buscarDashboard, montarSerieOcupacaoMensal } from '../../util/indicadoresApi'
import {
  atualizarRelatorio,
  buscarRelatorioMensalAdmin,
  CATEGORIA_UI_PARA_API,
  criarRelatorio,
  excluirRelatorio,
  listarRelatorios,
  uploadPdfRelatorio,
} from '../../util/relatoriosApi'
import { formatarPeriodoIso } from '../../util/enviosApi'
import { periodoAtual } from '../comerciante/prazo'
import { baixarCsv, mesAno, MESES_CURTOS } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'

const SITUACAO_MENSAL = {
  approved: 'Publicado',
  submitted: 'Em análise',
  returned: 'Devolvido',
}

function hojeIso() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function rotuloPeriodo(periodIso) {
  if (!periodIso) return '—'
  const [ano, mes] = String(periodIso).split('-').map(Number)
  if (!ano || !mes) return periodIso
  return mesAno(ano, mes)
}

function ordenarRelatorios(lista) {
  return [...lista].sort((a, b) => b.data.localeCompare(a.data) || (b.id || 0) - (a.id || 0))
}

function ModalFormularioRelatorio({ relatorio, aberto, aoFechar, aoConcluir }) {
  const editando = Boolean(relatorio)
  const entradaArquivoRef = useRef(null)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('boletim')
  const [dataPublicacao, setDataPublicacao] = useState(hojeIso)
  const [paginas, setPaginas] = useState('')
  const [resumo, setResumo] = useState('')
  const [achadosTexto, setAchadosTexto] = useState('')
  const [destaque, setDestaque] = useState(false)
  const [arquivoPdf, setArquivoPdf] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!aberto) return
    setErro('')
    setArquivoPdf(null)
    if (relatorio) {
      setTitulo(relatorio.titulo || '')
      setCategoria(relatorio.categoria || 'boletim')
      setDataPublicacao(relatorio.data || hojeIso())
      setPaginas(relatorio.paginas == null ? '' : String(relatorio.paginas))
      setResumo(relatorio.resumo || '')
      setAchadosTexto(Array.isArray(relatorio.achados) ? relatorio.achados.join('\n') : '')
      setDestaque(Boolean(relatorio.destaque))
    } else {
      setTitulo('')
      setCategoria('boletim')
      setDataPublicacao(hojeIso())
      setPaginas('')
      setResumo('')
      setAchadosTexto('')
      setDestaque(false)
    }
  }, [aberto, relatorio])

  const escolherArquivo = (file) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setErro('Envie um arquivo em formato PDF.')
      return
    }
    setArquivoPdf(file)
    setErro('')
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErro('')

    if (!titulo.trim()) {
      setErro('Informe o título do relatório.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPublicacao)) {
      setErro('Informe uma data de publicação válida.')
      return
    }
    if (!editando && !arquivoPdf) {
      setErro('Selecione o arquivo PDF do relatório para enviar ao S3.')
      return
    }

    let paginasNumero = null
    if (paginas.trim() !== '') {
      const parsed = Number(paginas)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setErro('O número de páginas deve ser um inteiro positivo.')
        return
      }
      paginasNumero = parsed
    }

    const achados = achadosTexto
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean)

    setSalvando(true)
    try {
      let arquivoEnviado = null
      // Uploads the PDF to S3 via multipart/form-data before saving or updating the metadata record
      if (arquivoPdf) {
        arquivoEnviado = await uploadPdfRelatorio(arquivoPdf)
      }

      const payload = {
        title: titulo.trim(),
        summary: resumo.trim() || null,
        category: CATEGORIA_UI_PARA_API[categoria] || 'bulletin',
        pages: paginasNumero,
        highlights: achados.length > 0 ? achados : null,
        featured: destaque,
        published_at: dataPublicacao,
        ...(arquivoEnviado
          ? {
              file_url: arquivoEnviado.file_url,
              file_size_bytes: arquivoEnviado.file_size_bytes,
            }
          : {}),
      }

      const salvo = editando
        ? await atualizarRelatorio(relatorio.id, payload)
        : await criarRelatorio(payload)

      aoConcluir(salvo, editando)
      aoFechar()
    } catch (causa) {
      const primeiroDetalhe = Array.isArray(causa?.detalhes)
        ? causa.detalhes.find((d) => d?.message)?.message
        : ''
      setErro(primeiroDetalhe || causa?.message || 'Não foi possível salvar o relatório.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={() => !salvando && aoFechar()}
      titulo={editando ? 'Editar relatório' : 'Publicar relatório PDF'}
      largura={640}
      acoes={
        <>
          <button
            type="button"
            className="ot-btn ot-btn--secundario"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-relatorio-pdf"
            className="ot-btn ot-btn--primario"
            disabled={salvando}
            aria-busy={salvando}
          >
            <Icone nome={editando ? 'check' : 'upload'} />{' '}
            {salvando
              ? 'Salvando…'
              : editando
                ? 'Salvar alterações'
                : 'Publicar relatório'}
          </button>
        </>
      }
    >
      <form id="form-relatorio-pdf" onSubmit={enviar} className="pilha" style={{ gap: 16 }} noValidate>
        <Campo id="rel-titulo" rotulo="Título do relatório">
          <input
            id="rel-titulo"
            className="ot-entrada"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Relatório OT nº 005/2026 — Ocupação hoteleira"
            required
          />
        </Campo>

        <div className="form-grade" style={{ marginTop: 0 }}>
          <Campo id="rel-categoria" rotulo="Categoria">
            <select
              id="rel-categoria"
              className="ot-selecao"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS_RELATORIO.map((c) => (
                <option key={c.id} value={c.id}>{c.rotulo}</option>
              ))}
            </select>
          </Campo>

          <Campo id="rel-data" rotulo="Data de publicação">
            <input
              id="rel-data"
              type="date"
              className="ot-entrada"
              value={dataPublicacao}
              onChange={(e) => setDataPublicacao(e.target.value)}
              required
            />
          </Campo>

          <Campo id="rel-paginas" rotulo="Páginas" extra="(opcional)">
            <input
              id="rel-paginas"
              className="ot-entrada ot-num"
              inputMode="numeric"
              value={paginas}
              onChange={(e) => setPaginas(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Ex.: 24"
            />
          </Campo>

          <Campo
            id="rel-arquivo"
            rotulo={editando ? 'Substituir arquivo PDF' : 'Arquivo PDF'}
            extra={editando ? '(opcional)' : '(até 15 MB)'}
          >
            <div className="linha-acoes" style={{ gap: 8 }}>
              <button
                type="button"
                className="ot-btn ot-btn--secundario ot-btn--p"
                onClick={() => entradaArquivoRef.current?.click()}
                disabled={salvando}
              >
                <Icone nome="upload" tamanho="s" /> {arquivoPdf ? 'Trocar PDF' : 'Escolher PDF'}
              </button>
              <span className="corpo-s suave" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {arquivoPdf ? arquivoPdf.name : editando ? 'Mantém o PDF atual' : 'Nenhum arquivo selecionado'}
              </span>
              <input
                ref={entradaArquivoRef}
                id="rel-arquivo"
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  escolherArquivo(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </Campo>
        </div>

        <Campo id="rel-resumo" rotulo="Resumo" extra="(opcional)">
          <textarea
            id="rel-resumo"
            className="ot-entrada"
            rows={3}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="Breve descrição do conteúdo do documento."
          />
        </Campo>

        <Campo
          id="rel-achados"
          rotulo="Principais achados"
          extra="(opcional)"
          ajuda="Um destaque por linha."
        >
          <textarea
            id="rel-achados"
            className="ot-entrada"
            rows={3}
            value={achadosTexto}
            onChange={(e) => setAchadosTexto(e.target.value)}
          />
        </Campo>

        <label className="ot-check">
          <input
            type="checkbox"
            checked={destaque}
            onChange={(e) => setDestaque(e.target.checked)}
          />
          <span>Destacar como novo na página de relatórios</span>
        </label>

        {erro && <Aviso tipo="erro" titulo="Não foi possível salvar">{erro}</Aviso>}
      </form>
    </Dialogo>
  )
}

export default function RelatoriosGerenciais() {
  useTitulo('Relatórios gerenciais')
  const { envios } = useEnvios()
  const { avisar } = useAvisos()
  const { aberto, abrir, fechar } = useResumo()

  const [carregandoOcupacao, setCarregandoOcupacao] = useState(true)
  const [erroOcupacao, setErroOcupacao] = useState('')
  const [anoOcupacao, setAnoOcupacao] = useState(null)
  const [serieOcupacao, setSerieOcupacao] = useState({ atual: [], anterior: [] })

  const periodoPadrao = useMemo(() => {
    const ref = periodoAtual()
    return formatarPeriodoIso(ref.ano, ref.mes)
  }, [])
  const [periodoMensal, setPeriodoMensal] = useState(periodoPadrao)
  const [relatorioMensal, setRelatorioMensal] = useState(null)
  const [carregandoMensal, setCarregandoMensal] = useState(true)

  const [relatorios, setRelatorios] = useState([])
  const [carregandoRelatorios, setCarregandoRelatorios] = useState(true)
  const [erroRelatorios, setErroRelatorios] = useState('')
  const [recarregamentoRelatorios, setRecarregamentoRelatorios] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoRelatorio, setEditandoRelatorio] = useState(null)
  const [excluindoId, setExcluindoId] = useState(null)

  // Loads published city-wide occupancy series for the latest available year from GET /api/dashboard
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregarOcupacao() {
      setCarregandoOcupacao(true)
      setErroOcupacao('')
      try {
        const inicial = await buscarDashboard({}, { signal: controlador.signal })
        if (!ativo) return
        const anosDisponiveis = Array.isArray(inicial?.available_years)
          ? [...inicial.available_years].sort((a, b) => b - a)
          : []

        if (anosDisponiveis.length === 0) {
          setAnoOcupacao(null)
          setSerieOcupacao({ atual: [], anterior: [] })
          return
        }

        const anoRecente = anosDisponiveis[0]
        const dadosAno = await buscarDashboard({ year: anoRecente }, { signal: controlador.signal })
        if (!ativo) return
        setAnoOcupacao(anoRecente)
        setSerieOcupacao(montarSerieOcupacaoMensal(dadosAno?.occupancy_monthly))
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErroOcupacao(causa?.message || 'Não foi possível carregar a ocupação da cidade.')
      } finally {
        if (ativo) setCarregandoOcupacao(false)
      }
    }

    carregarOcupacao()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [])

  // Loads the consolidated monthly report summary from GET /api/admin/reports/monthly
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    setCarregandoMensal(true)
    buscarRelatorioMensalAdmin(periodoMensal, { signal: controlador.signal })
      .then((dados) => {
        if (!ativo) return
        setRelatorioMensal(dados)
      })
      .catch(() => {
        if (ativo) setRelatorioMensal(null)
      })
      .finally(() => {
        if (ativo) setCarregandoMensal(false)
      })

    return () => {
      ativo = false
      controlador.abort()
    }
  }, [periodoMensal])

  // Loads published PDF reports from GET /api/reports
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregarRelatorios() {
      setCarregandoRelatorios(true)
      setErroRelatorios('')
      try {
        const resposta = await listarRelatorios({ limit: 100 }, { signal: controlador.signal })
        if (!ativo) return
        setRelatorios(ordenarRelatorios(resposta.data))
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErroRelatorios(causa?.message || 'Não foi possível carregar os relatórios publicados.')
      } finally {
        if (ativo) setCarregandoRelatorios(false)
      }
    }

    carregarRelatorios()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [recarregamentoRelatorios])

  const temOcupacao = serieOcupacao.atual.some((v) => v != null)
  const temOcupacaoAnterior = serieOcupacao.anterior.some((v) => v != null)

  // Combines periods from the monthly report endpoint with loaded submissions as fallback
  const periodosDisponiveis = useMemo(() => {
    const daApi = Array.isArray(relatorioMensal?.available_periods)
      ? relatorioMensal.available_periods
      : []
    const dosEnvios = envios.map((e) => formatarPeriodoIso(e.ano, e.mes))
    return [...new Set([periodoMensal, ...daApi, ...dosEnvios])].filter(Boolean).sort((a, b) =>
      b.localeCompare(a),
    )
  }, [relatorioMensal?.available_periods, envios, periodoMensal])

  const resumoMensal = useMemo(() => {
    if (relatorioMensal?.summary) {
      const s = relatorioMensal.summary
      return [
        ['Envios recebidos', s.received ?? 0],
        ['Publicados', s.approved ?? 0],
        ['Em análise', s.in_review ?? 0],
        ['Devolvidos', s.returned ?? 0],
        [
          'Ocupação média publicada',
          s.average_occupancy_rate == null ? '—' : `${Math.round(s.average_occupancy_rate)}%`,
        ],
        ['Diárias vendidas', (s.room_nights_sold ?? 0).toLocaleString('pt-BR')],
      ]
    }
    const [anoNum, mesNum] = periodoMensal.split('-').map(Number)
    const doMes = envios.filter((e) => e.ano === anoNum && e.mes === mesNum)
    const validos = doMes.filter((e) => e.situacao === 'publicado' && e.ocupacao != null)
    return [
      ['Envios recebidos', doMes.length],
      ['Publicados', validos.length],
      ['Em análise', doMes.filter((e) => e.situacao === 'analise').length],
      ['Devolvidos', doMes.filter((e) => e.situacao === 'recusado').length],
      [
        'Ocupação média publicada',
        validos.length
          ? `${Math.round(validos.reduce((a, e) => a + e.ocupacao, 0) / validos.length)}%`
          : '—',
      ],
      ['Diárias vendidas', validos.reduce((a, e) => a + (e.diarias || 0), 0).toLocaleString('pt-BR')],
    ]
  }, [relatorioMensal, envios, periodoMensal])

  const rotuloMes = rotuloPeriodo(periodoMensal)

  const gerar = () => {
    const linhasItens = Array.isArray(relatorioMensal?.items)
      ? relatorioMensal.items.map((item) => [
          item.establishment,
          item.type || '',
          item.occupancy_rate == null ? '' : Math.round(item.occupancy_rate),
          item.beds_available ?? '',
          item.room_nights_sold ?? '',
          SITUACAO_MENSAL[item.status] || item.status,
        ])
      : []

    baixarCsv(`relatorio-mensal-${periodoMensal}.csv`, [
      ['Relatório mensal do Observatório', rotuloMes],
      [],
      ...resumoMensal,
      [],
      ['Estabelecimento', 'Tipo', 'Ocupação (%)', 'Leitos', 'Diárias', 'Situação'],
      ...linhasItens,
    ])
    avisar('Relatório gerado', { texto: `O consolidado de ${rotuloMes} foi baixado em CSV.` })
  }

  const abrirNovo = () => {
    setEditandoRelatorio(null)
    setModalAberto(true)
  }

  const abrirEdicao = (relatorio) => {
    setEditandoRelatorio(relatorio)
    setModalAberto(true)
  }

  const concluirFormulario = (salvo, foiEdicao) => {
    if (salvo) {
      setRelatorios((lista) =>
        ordenarRelatorios([salvo, ...lista.filter((item) => item.id !== salvo.id)]),
      )
    }
    avisar(foiEdicao ? 'Relatório atualizado' : 'Relatório publicado', {
      texto: foiEdicao
        ? 'As alterações já estão disponíveis na página de relatórios.'
        : 'O PDF foi enviado ao S3 e publicado no Observatório.',
    })
  }

  const excluir = async (relatorio) => {
    setExcluindoId(relatorio.id)
    try {
      await excluirRelatorio(relatorio.id)
      setRelatorios((lista) => lista.filter((item) => item.id !== relatorio.id))
      avisar('Relatório excluído', {
        texto: `“${relatorio.titulo}” foi removido do acervo e do S3.`,
        tipo: 'info',
      })
    } catch (causa) {
      avisar('Não foi possível excluir', {
        texto: causa?.message || 'Tente novamente em instantes.',
        tipo: 'erro',
      })
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Prefeitura" titulo="Relatórios gerenciais" cor="var(--ciano)">
        <button type="button" className="ot-btn ot-btn--primario" onClick={abrirNovo}>
          <Icone nome="upload" /> Publicar relatório PDF
        </button>
      </TopoPainel>

      <div className="painel__grade">
        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Ocupação média da cidade</h2>
          <p className="corpo-s suave">
            {anoOcupacao
              ? temOcupacaoAnterior
                ? `Mês a mês, ${anoOcupacao} comparado a ${anoOcupacao - 1}`
                : `Mês a mês, ${anoOcupacao}`
              : 'Mês a mês, indicadores publicados'}
          </p>
          {temOcupacao && anoOcupacao && (
            <div className="ot-legenda-grafico" style={{ marginTop: 12 }}>
              <span><i style={{ background: 'var(--roxo)' }} />{anoOcupacao}</span>
              {temOcupacaoAnterior && (
                <span><i style={{ background: 'var(--lilas)', height: 4 }} />{anoOcupacao - 1}</span>
              )}
            </div>
          )}
          <div className="grafico__corpo">
            {carregandoOcupacao ? (
              <div className="ot-vazio" role="status" aria-live="polite">
                <span className="girando" aria-hidden="true" />
                <p className="corpo suave">Carregando indicadores…</p>
              </div>
            ) : erroOcupacao ? (
              <Aviso tipo="erro" titulo="Erro ao carregar ocupação">{erroOcupacao}</Aviso>
            ) : temOcupacao && anoOcupacao ? (
              <GraficoLinha
                descricao={`Ocupação média mensal da cidade em ${anoOcupacao}`}
                rotulos={MESES_CURTOS}
                series={[
                  { nome: String(anoOcupacao), valores: serieOcupacao.atual, cor: '#6C5CE0', area: '#B986ED' },
                  ...(temOcupacaoAnterior
                    ? [{ nome: String(anoOcupacao - 1), valores: serieOcupacao.anterior, cor: '#B986ED' }]
                    : []),
                ]}
              />
            ) : (
              <p className="corpo suave" style={{ padding: '32px 0' }}>
                Ainda não há dados mensais de ocupação publicados.
              </p>
            )}
          </div>
        </section>

        <section className="ot-cartao gerar">
          <h2 className="titulo-3">Gerar relatório do mês</h2>
          <p className="corpo-s suave">Consolidado dos envios, pronto para planilha.</p>
          <label className="ot-rotulo" htmlFor="mes-relatorio" style={{ marginTop: 16 }}>Mês de referência</label>
          <select
            id="mes-relatorio"
            className="ot-selecao"
            value={periodoMensal}
            onChange={(e) => setPeriodoMensal(e.target.value)}
            disabled={periodosDisponiveis.length === 0}
          >
            {periodosDisponiveis.map((p) => (
              <option key={p} value={p}>{rotuloPeriodo(p)}</option>
            ))}
          </select>
          <dl className="gerar__resumo">
            {resumoMensal.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <dd className="ot-num">{carregandoMensal ? '…' : valor}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            className="ot-btn ot-btn--primario ot-btn--largo"
            onClick={gerar}
            disabled={carregandoMensal}
          >
            <Icone nome="download" /> Baixar relatório de {rotuloMes}
          </button>
        </section>
      </div>

      <section style={{ marginTop: 'var(--esp-6)' }}>
        <div className="ot-cartao__cab" style={{ marginBottom: 16 }}>
          <h2 className="titulo-2">Relatórios publicados</h2>
          <button type="button" className="ot-btn ot-btn--secundario ot-btn--p" onClick={abrirNovo}>
            <Icone nome="mais" tamanho="s" /> Novo relatório
          </button>
        </div>

        {carregandoRelatorios ? (
          <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
            <span className="girando" aria-hidden="true" />
            <p className="corpo suave">Carregando relatórios publicados…</p>
          </div>
        ) : erroRelatorios ? (
          <Aviso tipo="erro" titulo="Não foi possível carregar os relatórios">
            {erroRelatorios}{' '}
            <button
              type="button"
              className="link-botao"
              onClick={() => setRecarregamentoRelatorios((v) => v + 1)}
            >
              Tentar novamente
            </button>
          </Aviso>
        ) : relatorios.length === 0 ? (
          <div className="ot-cartao ot-vazio">
            <span className="ot-vazio__icone ot-bolha"><Icone nome="arquivo" tamanho="l" /></span>
            <h3 className="titulo-3">Nenhum relatório publicado</h3>
            <p className="corpo suave">Envie o primeiro PDF pelo botão acima para disponibilizá-lo no portal.</p>
          </div>
        ) : (
          <div className="pilha" style={{ gap: 16 }}>
            {relatorios.map((r) => (
              <CartaoRelatorio
                key={r.id}
                relatorio={r}
                aoAbrir={abrir}
                acoesExtras={
                  <>
                    <button
                      type="button"
                      className="ot-btn ot-btn--fantasma ot-btn--p"
                      disabled={excluindoId === r.id}
                      onClick={() => abrirEdicao(r)}
                      aria-label={`Editar ${r.titulo}`}
                    >
                      <Icone nome="lapis" tamanho="s" /> Editar
                    </button>
                    <button
                      type="button"
                      className="ot-btn ot-btn--perigo ot-btn--p"
                      disabled={excluindoId === r.id}
                      aria-busy={excluindoId === r.id}
                      onClick={() => excluir(r)}
                      aria-label={`Excluir ${r.titulo}`}
                    >
                      <Icone nome="x" tamanho="s" /> {excluindoId === r.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      <ModalFormularioRelatorio
        relatorio={editandoRelatorio}
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoConcluir={concluirFormulario}
      />

      <ResumoRelatorio relatorio={aberto} aoFechar={fechar} />
    </div>
  )
}
