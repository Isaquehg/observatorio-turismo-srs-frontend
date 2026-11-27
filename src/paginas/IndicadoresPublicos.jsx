import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Aviso, Migalhas, Selo } from '../componentes/Basicos'
import { Indicador } from '../componentes/Cartoes'
import { GraficoLinha, Rosca } from '../componentes/Graficos'
import { useSessao } from '../contexto/Sessao'
import {
  buscarDashboard,
  calcularOcupacaoMedia,
  formatarDataSegura,
  formatarVisitantesCurto,
  montarSerieOcupacaoMensal,
  normalizarOrigens,
} from '../util/indicadoresApi'
import { numero, variacao, diferenca, MESES_CURTOS, MESES_LONGOS } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const COM_LOGIN = [
  { icone: 'filtro', texto: 'Indicadores completos, com filtros por ano e por setor' },
  { icone: 'arquivo', texto: 'Relatórios e pesquisas em PDF' },
  { icone: 'download', texto: 'Séries históricas em CSV' },
  { icone: 'mapa', texto: 'Dicas de onde ficar, comer e passear (turistas)' },
]

export default function IndicadoresPublicos() {
  useTitulo('Indicadores públicos')
  const { sessao } = useSessao()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [dados, setDados] = useState(null)

  // Loads published public dashboard aggregates and previous-year comparison from GET /api/dashboard
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const inicial = await buscarDashboard({}, { signal: controlador.signal })
        if (!ativo) return

        const anos = Array.isArray(inicial?.available_years)
          ? [...inicial.available_years].sort((a, b) => b - a)
          : []

        if (anos.length === 0) {
          setDados({
            anoPrincipal: null,
            anoAnterior: null,
            atual: null,
            anterior: null,
            atualizadoEm: inicial?.last_updated || inicial?.reference_date || null,
          })
          return
        }

        const anoPrincipal = anos[0]
        const anoAnterior = anos.includes(anoPrincipal - 1) ? anoPrincipal - 1 : null

        const [atual, anterior] = await Promise.all([
          buscarDashboard({ year: anoPrincipal }, { signal: controlador.signal }),
          anoAnterior
            ? buscarDashboard({ year: anoAnterior }, { signal: controlador.signal })
            : Promise.resolve(null),
        ])

        if (!ativo) return
        setDados({
          anoPrincipal,
          anoAnterior,
          atual,
          anterior,
          atualizadoEm:
            atual?.last_updated ||
            atual?.reference_date ||
            inicial?.last_updated ||
            inicial?.reference_date ||
            null,
        })
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os indicadores públicos.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [tentativa])

  const dataAtualizacao = formatarDataSegura(dados?.atualizadoEm)
  const atual = dados?.atual
  const anterior = dados?.anterior
  const anoPrincipal = dados?.anoPrincipal
  const anoAnterior = dados?.anoAnterior

  const resumoAtual = atual?.annual_summary || atual?.summary || null
  const resumoAnterior = anterior?.annual_summary || anterior?.summary || null
  const ocupacaoAtual = atual
    ? calcularOcupacaoMedia(atual.occupancy_monthly, resumoAtual?.occupancy_rate)
    : null
  const ocupacaoAnterior = anterior
    ? calcularOcupacaoMedia(anterior.occupancy_monthly, resumoAnterior?.occupancy_rate)
    : null

  const { atual: ocupacaoMensal, anterior: ocupacaoMensalAnterior } = montarSerieOcupacaoMensal(
    atual?.occupancy_monthly,
  )
  const temOcupacao = ocupacaoMensal.some((v) => v != null)
  const temOcupacaoAnterior = ocupacaoMensalAnterior.some((v) => v != null)
  const origens = normalizarOrigens(atual?.origin_distribution)

  const serieVisitantes = (atual?.highlights || [])
    .map((h) => h.visitors)
    .filter((v) => typeof v === 'number')
  const serieOcupacao = ocupacaoMensal.filter((v) => v != null)
  const serieEmpregos = (atual?.highlights || [])
    .map((h) => h.jobs)
    .filter((v) => typeof v === 'number')

  const cartoes = resumoAtual
    ? [
        {
          rotulo: 'Visitantes estimados',
          valor: formatarVisitantesCurto(resumoAtual.visitors),
          icone: 'mala',
          cor: 'var(--azul-ceu)',
          variacao: resumoAnterior ? variacao(resumoAtual.visitors, resumoAnterior.visitors) : null,
          serie: serieVisitantes,
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
          rotulo: 'Meios de hospedagem',
          valor: numero(resumoAtual.accommodations ?? 0),
          icone: 'predio',
          cor: 'var(--ciano)',
          variacao: resumoAnterior
            ? diferenca(resumoAtual.accommodations ?? 0, resumoAnterior.accommodations ?? 0)
            : null,
          serie: null,
        },
        {
          rotulo: 'Empregos no setor',
          valor: numero(resumoAtual.jobs ?? 0),
          icone: 'pessoas',
          cor: 'var(--lilas)',
          variacao: resumoAnterior ? variacao(resumoAtual.jobs ?? 0, resumoAnterior.jobs ?? 0) : null,
          serie: serieEmpregos,
        },
      ]
    : []

  const fatos = []
  if (resumoAtual && anoPrincipal) {
    if (temOcupacao) {
      let indicePico = -1
      let valorPico = -1
      ocupacaoMensal.forEach((valor, indice) => {
        if (valor != null && valor > valorPico) {
          valorPico = valor
          indicePico = indice
        }
      })
      if (indicePico >= 0) {
        fatos.push({
          chave: 'pico',
          valor: `${valorPico}%`,
          texto: `foi a ocupação em ${MESES_LONGOS[indicePico]}, o mês mais movimentado de ${anoPrincipal}.`,
        })
      }
    }

    if (origens.length > 0) {
      const origemPrincipal = origens.reduce(
        (maior, item) => (item.valor > maior.valor ? item : maior),
        origens[0],
      )
      fatos.push({
        chave: 'origem',
        valor: `${origemPrincipal.valor}%`,
        texto: `dos visitantes vieram da principal região de origem: ${origemPrincipal.nome}.`,
      })
    }

    fatos.push({
      chave: 'leitos',
      valor: numero(resumoAtual.beds ?? 0),
      texto: `leitos disponíveis em ${numero(resumoAtual.accommodations ?? 0)} hotéis, pousadas, hostels e chalés.`,
    })
  }

  return (
    <div className="container pag surgir">
      <div className="pag__cab">
        <div>
          <Migalhas atual="Indicadores públicos" />
          <h1 className="display-l pag__titulo">
            Indicadores <span className="ot-marca ot-marca--ciano">públicos</span>
          </h1>
          <p className="corpo-l pag__abertura">
            Um retrato do turismo em Santa Rita do Sapucaí, aberto para qualquer pessoa. Não precisa de conta.
          </p>
        </div>
        {dataAtualizacao && (
          <div className="pag__cab-lado">
            <Selo situacao="publicado">Atualizado em {dataAtualizacao}</Selo>
          </div>
        )}
      </div>

      {carregando && (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando indicadores públicos…</p>
        </div>
      )}

      {!carregando && erro && (
        <Aviso tipo="erro" titulo="Não foi possível carregar os indicadores">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={() => setTentativa((t) => t + 1)}>
            Tentar novamente
          </button>
        </Aviso>
      )}

      {!carregando && !erro && !atual && (
        <div className="ot-cartao ot-vazio">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="grafico" tamanho="l" /></span>
          <h2 className="titulo-3">Nenhum indicador publicado ainda</h2>
          <p className="corpo suave" style={{ maxWidth: '42ch' }}>
            Assim que a SMCELT publicar os primeiros indicadores, eles aparecem automaticamente aqui.
          </p>
        </div>
      )}

      {!carregando && !erro && atual && resumoAtual && (
        <>
          <div className="grade-4">
            {cartoes.map((c) => (
              <Indicador
                key={c.rotulo}
                {...c}
                comparacao={anoAnterior ? `vs. ${anoAnterior}` : `em ${anoPrincipal}`}
              />
            ))}
          </div>

          <div className="indicadores__grade">
            <section className="ot-cartao grafico col-7">
              <div className="ot-cartao__cab">
                <div>
                  <h2 className="titulo-3">Ocupação dos hotéis e pousadas</h2>
                  <p className="corpo-s suave">
                    {temOcupacaoAnterior
                      ? `Média de cada mês, em ${anoPrincipal} e ${anoPrincipal - 1}`
                      : `Média de cada mês, em ${anoPrincipal}`}
                  </p>
                </div>
              </div>
              {temOcupacao && (
                <div className="ot-legenda-grafico">
                  <span><i style={{ background: 'var(--roxo)' }} />{anoPrincipal}</span>
                  {temOcupacaoAnterior && (
                    <span><i style={{ background: 'var(--lilas)', height: 4 }} />{anoPrincipal - 1}</span>
                  )}
                </div>
              )}
              <div className="grafico__corpo">
                {temOcupacao ? (
                  <GraficoLinha
                    descricao={`Taxa de ocupação hoteleira mês a mês em ${anoPrincipal}`}
                    rotulos={MESES_CURTOS}
                    series={[
                      { nome: String(anoPrincipal), valores: ocupacaoMensal, cor: '#6C5CE0', area: '#B986ED' },
                      ...(temOcupacaoAnterior
                        ? [{ nome: String(anoPrincipal - 1), valores: ocupacaoMensalAnterior, cor: '#B986ED' }]
                        : []),
                    ]}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Ainda não há registros mensais de ocupação publicados para {anoPrincipal}.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: OT-SRS / SMCELT</p>
            </section>

            <section className="ot-cartao grafico col-5">
              <div className="ot-cartao__cab">
                <div>
                  <h2 className="titulo-3">De onde vêm os visitantes</h2>
                  <p className="corpo-s suave">Pesquisa de perfil do turista, {anoPrincipal}</p>
                </div>
              </div>
              <div className="grafico__corpo" style={{ display: 'flex', alignItems: 'center' }}>
                {origens.length > 0 ? (
                  <Rosca
                    descricao={`Origem dos visitantes em ${anoPrincipal}`}
                    centro={formatarVisitantesCurto(resumoAtual.visitors)}
                    subcentro="visitantes"
                    fatias={origens}
                  />
                ) : (
                  <p className="corpo suave" style={{ padding: '32px 0' }}>
                    Distribuição por origem indisponível para {anoPrincipal}.
                  </p>
                )}
              </div>
              <p className="ot-fonte">Fonte: OT-SRS / SMCELT</p>
            </section>
          </div>

          {fatos.length > 0 && (
            <section className="secao" style={{ paddingTop: 'var(--esp-7)' }}>
              <div className="secao__cab">
                <div>
                  <h2 className="titulo-1">O que esses números dizem</h2>
                </div>
              </div>
              <ul className="fatos">
                {fatos.map((f) => (
                  <li key={f.chave} className="fatos__item">
                    <span className="numero ot-num">{f.valor}</span>
                    <p className="corpo suave">{f.texto}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!sessao && (
        <section className="mais-dados">
          <div className="mais-dados__texto">
            <h2 className="titulo-2">Quer ir mais fundo?</h2>
            <p className="corpo" style={{ marginTop: 8 }}>Com uma conta gratuita você também acessa:</p>
            <ul className="mais-dados__lista">
              {COM_LOGIN.map((item) => (
                <li key={item.texto}><Icone nome={item.icone} tamanho="s" /> {item.texto}</li>
              ))}
            </ul>
          </div>
          <Link className="ot-btn ot-btn--solido ot-btn--g" to="/entrar?perfil=turista" state={{ voltarPara: '/indicadores' }}>
            Entrar para ver mais <Icone nome="seta" />
          </Link>
        </section>
      )}

      <p className="ot-fonte" style={{ marginTop: 'var(--esp-5)' }}>
        Fonte: OT-SRS / SMCELT.
      </p>
    </div>
  )
}
