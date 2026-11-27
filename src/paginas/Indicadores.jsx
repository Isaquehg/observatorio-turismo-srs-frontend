import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Aviso, Migalhas, Selo } from '../componentes/Basicos'
import { Indicador } from '../componentes/Cartoes'
import { GraficoLinha, Rosca, BarrasHorizontais, BarrasVerticais } from '../componentes/Graficos'
import { useSessao } from '../contexto/Sessao'
import { useAvisos } from '../contexto/Avisos'
import {
  buscarDashboard,
  calcularOcupacaoMedia,
  formatarDataSegura,
  formatarVisitantesCurto,
  listarIndicadores,
  listarSetores,
  montarSerieOcupacaoMensal,
  normalizarCategoriasHospedagem,
  normalizarOrigens,
} from '../util/indicadoresApi'
import { numero, variacao, diferenca, MESES_CURTOS, baixarCsv } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'

function CabecalhoGrafico({ titulo, subtitulo, aoBaixar, desabilitado = false }) {
  return (
    <div className="ot-cartao__cab">
      <div>
        <h3 className="titulo-3">{titulo}</h3>
        <p className="corpo-s suave">{subtitulo}</p>
      </div>
      <button
        type="button"
        className="ot-btn ot-btn--fantasma ot-btn--p"
        onClick={aoBaixar}
        disabled={desabilitado}
        aria-label={`Baixar dados de ${titulo.toLowerCase()} em CSV`}
      >
        <Icone nome="download" tamanho="s" /> CSV
      </button>
    </div>
  )
}

export default function Indicadores() {
  useTitulo('Indicadores')
  const { sessao } = useSessao()
  const { avisar } = useAvisos()
  const ehPrefeitura = sessao?.perfil === 'prefeitura'

  const [setores, setSetores] = useState([])
  const [anos, setAnos] = useState([])
  const [ano, setAno] = useState(null)
  const [setor, setSetor] = useState('todos')
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  const [dashboardAno, setDashboardAno] = useState(null)
  const [dashboardFiltrado, setDashboardFiltrado] = useState(null)
  const [dashboardAnterior, setDashboardAnterior] = useState(null)
  const [rascunhos, setRascunhos] = useState([])
  const [baixandoTudo, setBaixandoTudo] = useState(false)

  // Initial load: fetches available sectors and published years from the API
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregarBase() {
      setCarregandoBase(true)
      setErro('')
      try {
        const [listaSetores, resumoInicial] = await Promise.all([
          listarSetores({ signal: controlador.signal }),
          buscarDashboard({}, { signal: controlador.signal }),
        ])
        if (!ativo) return

        const anosOrdenados = Array.isArray(resumoInicial?.available_years)
          ? [...resumoInicial.available_years].sort((a, b) => a - b)
          : []

        setSetores(listaSetores)
        setAnos(anosOrdenados)
        setAno((atual) =>
          atual != null && anosOrdenados.includes(atual)
            ? atual
            : anosOrdenados[anosOrdenados.length - 1] ?? null,
        )
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os indicadores.')
      } finally {
        if (ativo) setCarregandoBase(false)
      }
    }

    carregarBase()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [tentativa])

  // Fetches filtered dashboard aggregates whenever year, sector, or user role changes
  useEffect(() => {
    if (ano == null) {
      setDashboardAno(null)
      setDashboardFiltrado(null)
      setDashboardAnterior(null)
      setRascunhos([])
      return
    }

    const controlador = new AbortController()
    let ativo = true
    const anoAnterior = anos.includes(ano - 1) ? ano - 1 : null
    const sectorId = setor === 'todos' ? undefined : setor

    async function carregarDetalhes() {
      setCarregandoDados(true)
      setErro('')
      try {
        const [geralAno, filtradoAno, filtradoAnterior, respostaRascunhos] = await Promise.all([
          buscarDashboard({ year: ano }, { signal: controlador.signal }),
          sectorId
            ? buscarDashboard({ year: ano, sector_id: sectorId }, { signal: controlador.signal })
            : Promise.resolve(null),
          anoAnterior
            ? buscarDashboard(
                { year: anoAnterior, ...(sectorId ? { sector_id: sectorId } : {}) },
                { signal: controlador.signal },
              )
            : Promise.resolve(null),
          // Only city hall users may query unpublished draft indicators
          ehPrefeitura
            ? listarIndicadores(
                { year: ano, ...(sectorId ? { sector_id: sectorId } : {}), published: false, limit: 50 },
                { permitirRascunhos: true, signal: controlador.signal },
              ).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ])

        if (!ativo) return
        setDashboardAno(geralAno)
        setDashboardFiltrado(sectorId ? filtradoAno : geralAno)
        setDashboardAnterior(filtradoAnterior)
        setRascunhos(ehPrefeitura ? respostaRascunhos.data : [])
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os indicadores para este filtro.')
      } finally {
        if (ativo) setCarregandoDados(false)
      }
    }

    carregarDetalhes()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [ano, anos, setor, ehPrefeitura, tentativa])

  const anoAnterior = ano != null && anos.includes(ano - 1) ? ano - 1 : null
  const nomeSetor = setores.find((s) => s.id === setor)?.nome
  const d = dashboardFiltrado
  const resumoAtual = d?.annual_summary || d?.summary || null
  const resumoAnterior = dashboardAnterior?.annual_summary || dashboardAnterior?.summary || null

  const ocupacaoAtual = d ? calcularOcupacaoMedia(d.occupancy_monthly, resumoAtual?.occupancy_rate) : null
  const ocupacaoAnterior = dashboardAnterior
    ? calcularOcupacaoMedia(dashboardAnterior.occupancy_monthly, resumoAnterior?.occupancy_rate)
    : null

  const { atual: ocupacaoMensal, anterior: ocupacaoMensalAnterior } = montarSerieOcupacaoMensal(
    d?.occupancy_monthly,
  )
  const temOcupacao = ocupacaoMensal.some((v) => v != null)
  const temOcupacaoAnterior = ocupacaoMensalAnterior.some((v) => v != null)
  const origens = useMemo(() => normalizarOrigens(d?.origin_distribution), [d?.origin_distribution])
  const categorias = useMemo(
    () => normalizarCategoriasHospedagem(d?.accommodation_categories),
    [d?.accommodation_categories],
  )
  const leitosPorTipo = useMemo(() => {
    if (categorias.length > 0) {
      return categorias.map((c) => ({ nome: c.nome, hex: c.hex, valor: c.leitos }))
    }
    return normalizarCategoriasHospedagem(d?.beds_by_accommodation_type).map((c) => ({
      nome: c.nome,
      hex: c.hex,
      valor: c.leitos,
    }))
  }, [categorias, d?.beds_by_accommodation_type])

  // Maps city-wide jobs and companies by sector so the sector bar chart keeps all sectors visible
  const empregosPorSetor = useMemo(() => {
    const mapaEmpregos = new Map(
      (dashboardAno?.jobs_by_sector || []).map((item) => [item.sector_id, item.value]),
    )
    const mapaEmpresas = new Map(
      (dashboardAno?.companies_by_sector || []).map((item) => [item.sector_id, item.value]),
    )
    return setores
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        hex: s.hex,
        valor: mapaEmpregos.get(s.id) ?? 0,
        empresas: mapaEmpresas.get(s.id) ?? 0,
      }))
      .filter((item) => item.valor > 0 || item.empresas > 0)
  }, [dashboardAno?.jobs_by_sector, dashboardAno?.companies_by_sector, setores])

  const cartoes = useMemo(() => {
    if (!resumoAtual) return []
    const serieLeitos = (d?.highlights || []).map((h) => h.beds).filter((v) => typeof v === 'number')
    const serieOcupacao = ocupacaoMensal.filter((v) => v != null)
    const serieEmpresas = (d?.highlights || []).map((h) => h.companies).filter((v) => typeof v === 'number')
    const serieEmpregos = (d?.highlights || []).map((h) => h.jobs).filter((v) => typeof v === 'number')

    return [
      {
        rotulo: 'Leitos disponíveis',
        valor: numero(resumoAtual.beds ?? 0),
        icone: 'cama',
        cor: 'var(--ciano)',
        variacao: resumoAnterior ? variacao(resumoAtual.beds ?? 0, resumoAnterior.beds ?? 0) : null,
        serie: serieLeitos,
      },
      {
        rotulo: 'Ocupação média',
        valor: ocupacaoAtual ?? '—',
        unidade: ocupacaoAtual != null ? '%' : undefined,
        icone: 'ocupacao',
        cor: 'var(--amarelo)',
        variacao:
          ocupacaoAtual != null && ocupacaoAnterior != null
            ? diferenca(ocupacaoAtual, ocupacaoAnterior, ' p.p.')
            : null,
        serie: serieOcupacao,
      },
      {
        rotulo: setor === 'todos' ? 'Empresas do turismo' : `Empresas · ${nomeSetor}`,
        valor: numero(resumoAtual.companies ?? 0),
        icone: 'loja',
        cor: 'var(--rosa)',
        variacao: resumoAnterior
          ? variacao(resumoAtual.companies ?? 0, resumoAnterior.companies ?? 0)
          : null,
        serie: serieEmpresas,
      },
      {
        rotulo: setor === 'todos' ? 'Empregos no setor' : `Empregos · ${nomeSetor}`,
        valor: numero(resumoAtual.jobs ?? 0),
        icone: 'pessoas',
        cor: 'var(--lilas)',
        variacao: resumoAnterior ? variacao(resumoAtual.jobs ?? 0, resumoAnterior.jobs ?? 0) : null,
        serie: serieEmpregos,
      },
    ]
  }, [resumoAtual, resumoAnterior, d?.highlights, ocupacaoAtual, ocupacaoAnterior, ocupacaoMensal, setor, nomeSetor])

  const dataAtualizacao = formatarDataSegura(d?.last_updated || d?.reference_date)
  const temDados =
    !!resumoAtual &&
    ((d?.highlights?.length ?? 0) > 0 ||
      temOcupacao ||
      origens.length > 0 ||
      leitosPorTipo.length > 0 ||
      empregosPorSetor.length > 0)

  const csv = {
    ocupacao: () =>
      baixarCsv(`ocupacao-hoteleira-${ano}.csv`, [
        ['Mês', `Ocupação ${ano} (%)`, ...(temOcupacaoAnterior ? [`Ocupação ${ano - 1} (%)`] : [])],
        ...MESES_CURTOS.map((m, i) => [
          m,
          ocupacaoMensal[i] ?? '',
          ...(temOcupacaoAnterior ? [ocupacaoMensalAnterior[i] ?? ''] : []),
        ]),
      ]),
    origem: () =>
      baixarCsv(`origem-visitantes-${ano}.csv`, [
        ['Origem', 'Participação (%)'],
        ...origens.map((o) => [o.nome, o.valor]),
      ]),
    leitos: () =>
      baixarCsv(`leitos-por-tipo-${ano}.csv`, [
        ['Tipo', 'Leitos'],
        ...leitosPorTipo.map((t) => [t.nome, t.valor]),
      ]),
    empregos: () =>
      baixarCsv(`empregos-por-setor-${ano}.csv`, [
        ['Setor', 'Empregos', 'Empresas'],
        ...empregosPorSetor.map((s) => [s.nome, s.valor, s.empresas]),
      ]),
    categorias: () =>
      baixarCsv(`hospedagem-por-categoria-${ano}.csv`, [
        ['Categoria', 'Estabelecimentos', 'Leitos', 'Ocupação média (%)', 'Situação'],
        ...categorias.map((c) => [
          c.nome,
          c.estabelecimentos,
          c.leitos,
          c.ocupacao ?? '',
          c.situacao === 'publicado' ? 'Publicado' : 'Em análise',
        ]),
      ]),
  }

  const baixarTudo = async () => {
    if (anos.length === 0) return
    setBaixandoTudo(true)
    try {
      const seriesAnuais = await Promise.all(
        anos.map(async (anoItem) => ({
          ano: anoItem,
          dados: await buscarDashboard({ year: anoItem }),
        })),
      )
      baixarCsv(`indicadores-turismo-srs-${anos[0]}-${anos[anos.length - 1]}.csv`, [
        [
          'Ano',
          'Leitos',
          'Meios de hospedagem',
          'Ocupação média (%)',
          'Empresas do turismo',
          'Empregos no setor',
          'Visitantes estimados',
        ],
        ...seriesAnuais.map(({ ano: a, dados: item }) => {
          const r = item?.annual_summary || item?.summary || {}
          const ocup = calcularOcupacaoMedia(item?.occupancy_monthly, r.occupancy_rate)
          return [
            a,
            r.beds ?? 0,
            r.accommodations ?? 0,
            ocup ?? '',
            r.companies ?? 0,
            r.jobs ?? 0,
            r.visitors ?? 0,
          ]
        }),
      ])
      avisar('Download iniciado', { texto: 'A planilha abre direto no Excel ou no LibreOffice.' })
    } catch (causa) {
      avisar('Erro ao exportar série', {
        texto: causa?.message || 'Não foi possível gerar a planilha completa.',
        tipo: 'erro',
      })
    } finally {
      setBaixandoTudo(false)
    }
  }

  const recarregar = () => setTentativa((t) => t + 1)

  return (
    <div className="container pag surgir">
      <div className="pag__cab">
        <div>
          <Migalhas atual="Indicadores" />
          <h1 className="display-l pag__titulo">
            Indicadores <span className="ot-marca">turísticos</span>
          </h1>
          <p className="corpo-l pag__abertura">
            Hospedagem, leitos, empresas e empregos do setor. Filtre por ano e por setor; tudo pode ser baixado.
          </p>
        </div>
        <div className="pag__cab-lado">
          {dataAtualizacao && <Selo situacao="publicado">Atualizado em {dataAtualizacao}</Selo>}
          <button
            type="button"
            className="ot-btn ot-btn--secundario"
            onClick={baixarTudo}
            disabled={anos.length === 0 || baixandoTudo}
            aria-busy={baixandoTudo}
          >
            <Icone nome="download" /> Baixar tudo (CSV)
          </button>
        </div>
      </div>

      {anos.length > 0 && (
        <div className="ot-filtros" role="group" aria-label="Filtros">
          <div className="ot-filtros__grupo">
            <span className="ot-filtros__rotulo" id="rotulo-periodo">
              <Icone nome="calendario" tamanho="s" /> Período
            </span>
            <div className="ot-segmentado" role="group" aria-labelledby="rotulo-periodo">
              {anos.map((a) => (
                <button key={a} type="button" aria-pressed={ano === a} onClick={() => setAno(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <span className="ot-filtros__divisor" aria-hidden="true" />
          <div className="ot-filtros__grupo">
            <span className="ot-filtros__rotulo" id="rotulo-setor">
              <Icone nome="filtro" tamanho="s" /> Setor
            </span>
            <div className="ot-filtros__chips" role="group" aria-labelledby="rotulo-setor">
              <button
                type="button"
                className="ot-chip"
                aria-pressed={setor === 'todos'}
                onClick={() => setSetor('todos')}
              >
                Todos
              </button>
              {setores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="ot-chip"
                  aria-pressed={setor === s.id}
                  onClick={() => setSetor(s.id)}
                >
                  <span className="ot-ponto" style={{ background: s.cor }} />
                  {s.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {ano != null && (
        <p className="sr-only" aria-live="polite">
          Mostrando {ano}{setor !== 'todos' && nomeSetor ? `, setor ${nomeSetor}` : ''}.
        </p>
      )}

      {ehPrefeitura && rascunhos.length > 0 && (
        <Aviso
          tipo="alerta"
          icone="lapis"
          style={{ marginTop: 20 }}
          titulo={`${rascunhos.length} ${rascunhos.length === 1 ? 'indicador em rascunho' : 'indicadores em rascunho'} em ${ano}`}
        >
          Rascunhos ficam visíveis apenas para a equipe da Prefeitura e não entram nos gráficos públicos até serem publicados.{' '}
          <Link to="/prefeitura">Gerenciar no painel</Link>
        </Aviso>
      )}

      {(carregandoBase || (carregandoDados && !d)) && (
        <div className="ot-cartao ot-vazio" style={{ marginTop: 24 }} role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando indicadores…</p>
        </div>
      )}

      {!carregandoBase && erro && (
        <Aviso tipo="erro" style={{ marginTop: 24 }} titulo="Não foi possível carregar os indicadores">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={recarregar}>
            Tentar novamente
          </button>
        </Aviso>
      )}

      {!carregandoBase && !carregandoDados && !erro && !temDados && (
        <div className="ot-cartao ot-vazio" style={{ marginTop: 24 }}>
          <span className="ot-vazio__icone ot-bolha"><Icone nome="busca" tamanho="l" /></span>
          <h2 className="titulo-3">Nenhum indicador encontrado</h2>
          <p className="corpo suave" style={{ maxWidth: '42ch' }}>
            Não há dados publicados para o período ou setor selecionado.
          </p>
          {setor !== 'todos' && (
            <button type="button" className="ot-btn ot-btn--secundario" onClick={() => setSetor('todos')}>
              Limpar filtro de setor
            </button>
          )}
        </div>
      )}

      {!carregandoBase && !erro && temDados && resumoAtual && (
        <div aria-busy={carregandoDados} style={carregandoDados ? { opacity: 0.7 } : undefined}>
          <div className="grade-4" style={{ marginTop: 24 }}>
            {cartoes.map((c) => (
              <Indicador
                key={c.icone}
                {...c}
                comparacao={anoAnterior ? `vs. ${anoAnterior}` : 'primeiro ano da série'}
              />
            ))}
          </div>

          <div className="indicadores__grade">
            <section className="ot-cartao grafico col-7">
              <CabecalhoGrafico
                titulo="Taxa de ocupação hoteleira"
                subtitulo="Média mensal dos meios de hospedagem que enviaram dados"
                aoBaixar={csv.ocupacao}
                desabilitado={!temOcupacao}
              />
              {temOcupacao && (
                <div className="ot-legenda-grafico">
                  <span><i style={{ background: 'var(--roxo)' }} />{ano}</span>
                  {temOcupacaoAnterior && (
                    <span><i style={{ background: 'var(--lilas)', height: 4 }} />{ano - 1}</span>
                  )}
                </div>
              )}
              <div className="grafico__corpo">
                {temOcupacao ? (
                  <GraficoLinha
                    key={`${ano}-${setor}`}
                    descricao={`Taxa de ocupação hoteleira mês a mês em ${ano}`}
                    rotulos={MESES_CURTOS}
                    series={[
                      { nome: String(ano), valores: ocupacaoMensal, cor: '#6C5CE0', area: '#B986ED' },
                      ...(temOcupacaoAnterior
                        ? [{ nome: String(ano - 1), valores: ocupacaoMensalAnterior, cor: '#B986ED' }]
                        : []),
                    ]}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Sem dados mensais de ocupação publicados para este recorte.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: OT-SRS / SMCELT</p>
            </section>

            <section className="ot-cartao grafico col-5">
              <CabecalhoGrafico
                titulo="De onde vêm os visitantes"
                subtitulo={`Pesquisa de perfil do turista, ${ano}`}
                aoBaixar={csv.origem}
                desabilitado={origens.length === 0}
              />
              <div className="grafico__corpo" style={{ display: 'flex', alignItems: 'center' }}>
                {origens.length > 0 ? (
                  <Rosca
                    key={`${ano}-${setor}`}
                    descricao={`Origem dos visitantes em ${ano}`}
                    centro={formatarVisitantesCurto(resumoAtual.visitors)}
                    subcentro="visitantes"
                    fatias={origens}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Distribuição por origem indisponível para este recorte.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: OT-SRS / SMCELT</p>
            </section>

            <section className="ot-cartao grafico col-6">
              <CabecalhoGrafico
                titulo="Leitos por tipo de hospedagem"
                subtitulo={`${numero(resumoAtual.beds ?? 0)} leitos em ${numero(resumoAtual.accommodations ?? 0)} estabelecimentos`}
                aoBaixar={csv.leitos}
                desabilitado={leitosPorTipo.length === 0}
              />
              <div className="grafico__corpo">
                {leitosPorTipo.length > 0 ? (
                  <BarrasHorizontais
                    key={`${ano}-${setor}`}
                    descricao={`Leitos por tipo de hospedagem em ${ano}`}
                    itens={leitosPorTipo}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Detalhamento de leitos por tipo indisponível para este recorte.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: OT-SRS / SMCELT</p>
            </section>

            <section className="ot-cartao grafico col-6">
              <CabecalhoGrafico
                titulo="Empregos formais por setor"
                subtitulo={`Postos de trabalho ligados ao turismo, ${ano}`}
                aoBaixar={csv.empregos}
                desabilitado={empregosPorSetor.length === 0}
              />
              <div className="grafico__corpo">
                {empregosPorSetor.length > 0 ? (
                  <BarrasVerticais
                    key={ano}
                    descricao={`Empregos formais por setor em ${ano}`}
                    destaque={setor === 'todos' ? null : setor}
                    itens={empregosPorSetor}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Sem dados de empregos por setor publicados para {ano}.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: RAIS / OT-SRS</p>
            </section>
          </div>

          <section className="ot-cartao" style={{ marginTop: 24, padding: '28px 28px 12px' }}>
            <CabecalhoGrafico
              titulo="Meios de hospedagem por categoria"
              subtitulo="Dados enviados pelos estabelecimentos e validados pela SMCELT"
              aoBaixar={csv.categorias}
              desabilitado={categorias.length === 0}
            />
            {categorias.length > 0 ? (
              <div className="ot-tabela-moldura">
                <table className="ot-tabela ot-tabela--cartoes">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th className="ot-num">Estabelecimentos</th>
                      <th className="ot-num">Leitos</th>
                      <th className="ot-num">Ocupação média</th>
                      <th>Situação do dado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c) => (
                      <tr key={c.tipo}>
                        <td><strong>{c.nome}</strong></td>
                        <td className="ot-num" data-rotulo="Estabelecimentos">{numero(c.estabelecimentos)}</td>
                        <td className="ot-num" data-rotulo="Leitos">{numero(c.leitos)}</td>
                        <td className="ot-num" data-rotulo="Ocupação média">{c.ocupacao == null ? '—' : `${c.ocupacao}%`}</td>
                        <td data-rotulo="Situação"><Selo situacao={c.situacao} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="corpo suave" style={{ padding: '16px 0 20px' }}>
                Ainda não há detalhamento de meios de hospedagem por categoria para este recorte.
              </p>
            )}
          </section>
          <p className="ot-fonte" style={{ marginTop: 8 }}>
            “—” indica que ainda não há envios suficientes para calcular a média. Fonte: OT-SRS / SMCELT.
          </p>
        </div>
      )}

      {anos.length > 0 && (
        <section className="dados-abertos" id="dados-abertos">
          <span className="dados-abertos__icone ot-bolha"><Icone nome="arquivo" tamanho="l" /></span>
          <div className="dados-abertos__texto">
            <h2 className="titulo-2">Dados abertos, do jeito que você precisar</h2>
            <p className="corpo" style={{ marginTop: 6 }}>
              A série completa de {anos[0]} a {anos[anos.length - 1]} em CSV, separada por ponto e vírgula. Pode usar, cruzar e citar — só mencione a fonte.
            </p>
          </div>
          <button
            type="button"
            className="ot-btn ot-btn--secundario ot-btn--g"
            onClick={baixarTudo}
            disabled={baixandoTudo}
            aria-busy={baixandoTudo}
          >
            <Icone nome="download" /> Baixar série completa
          </button>
          <Adesivo tipo="brilho" cor="#FFFFFF" tamanho={64} />
        </section>
      )}
    </div>
  )
}
