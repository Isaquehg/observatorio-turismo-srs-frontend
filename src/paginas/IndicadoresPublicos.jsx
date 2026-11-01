import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Migalhas, Selo } from '../componentes/Basicos'
import { Indicador } from '../componentes/Cartoes'
import { GraficoLinha, Rosca } from '../componentes/Graficos'
import { ANOS, ATUALIZADO_EM, ORIGENS, dadosPorAno, resumoDoAno, serie } from '../dados/indicadores'
import { useSessao } from '../contexto/Sessao'
import { numero, variacao, diferenca, dataCurta, MESES_CURTOS, MESES_LONGOS } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const ANO = ANOS[ANOS.length - 1]
const ANTERIOR = ANO - 1
// Gráficos e destaques usam o último ano fechado (o ano corrente ainda está em andamento)
const ANO_GRAFICO = ANO - 1
const ANTERIOR_GRAFICO = ANO_GRAFICO - 1

const COM_LOGIN = [
  { icone: 'filtro', texto: 'Indicadores completos, com filtros por ano e por setor' },
  { icone: 'arquivo', texto: 'Relatórios e pesquisas em PDF' },
  { icone: 'download', texto: 'Séries históricas em CSV' },
  { icone: 'mapa', texto: 'Dicas de onde ficar, comer e passear (turistas)' },
]

export default function IndicadoresPublicos() {
  useTitulo('Indicadores públicos')
  const { sessao } = useSessao()
  const d = dadosPorAno[ANO]
  const ant = dadosPorAno[ANTERIOR]
  const g = dadosPorAno[ANO_GRAFICO]
  const gAnt = dadosPorAno[ANTERIOR_GRAFICO]
  const atual = resumoDoAno(ANO)
  const anterior = resumoDoAno(ANTERIOR)

  const visitantes = ANOS.map((a) => dadosPorAno[a].visitantes)
  const cartoes = [
    { rotulo: 'Visitantes estimados', valor: `${Math.round(d.visitantes / 1000)} mil`, icone: 'mala', cor: 'var(--azul-ceu)', variacao: variacao(d.visitantes, ant.visitantes), serie: visitantes },
    { rotulo: 'Ocupação média', valor: atual.ocupacao, unidade: '%', icone: 'ocupacao', cor: 'var(--amarelo)', variacao: diferenca(atual.ocupacao, anterior.ocupacao, ' p.p.'), serie: serie('ocupacao', ANO) },
    { rotulo: 'Meios de hospedagem', valor: atual.hospedagens, icone: 'predio', cor: 'var(--ciano)', variacao: diferenca(atual.hospedagens, anterior.hospedagens), serie: serie('hospedagens', ANO) },
    { rotulo: 'Empregos no setor', valor: numero(atual.empregos), icone: 'pessoas', cor: 'var(--lilas)', variacao: variacao(atual.empregos, anterior.empregos), serie: serie('empregos', ANO) },
  ]

  const pico = g.ocupacaoMensal.indexOf(Math.max(...g.ocupacaoMensal))
  const origemPrincipal = g.origem.indexOf(Math.max(...g.origem))
  const fatos = [
    { valor: `${g.ocupacaoMensal[pico]}%`, texto: `foi a ocupação em ${MESES_LONGOS[pico]}, o mês mais movimentado de ${ANO_GRAFICO}.` },
    { valor: `${g.origem[origemPrincipal]}%`, texto: `dos visitantes vieram da principal região de origem: ${ORIGENS[origemPrincipal].nome}.` },
    { valor: numero(atual.leitos), texto: `leitos disponíveis em ${atual.hospedagens} hotéis, pousadas, hostels e chalés.` },
  ]

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
        <div className="pag__cab-lado">
          <Selo situacao="publicado">Atualizado em {dataCurta(ATUALIZADO_EM)}</Selo>
        </div>
      </div>

      <div className="grade-4">
        {cartoes.map((c) => (
          <Indicador key={c.rotulo} {...c} comparacao={`vs. ${ANTERIOR}`} />
        ))}
      </div>

      <div className="indicadores__grade">
        <section className="ot-cartao grafico col-7">
          <div className="ot-cartao__cab">
            <div>
              <h2 className="titulo-3">Ocupação dos hotéis e pousadas</h2>
              <p className="corpo-s suave">Média de cada mês, em {ANO_GRAFICO} e {ANTERIOR_GRAFICO}</p>
            </div>
          </div>
          <div className="ot-legenda-grafico">
            <span><i style={{ background: 'var(--roxo)' }} />{ANO_GRAFICO}</span>
            <span><i style={{ background: 'var(--lilas)', height: 4 }} />{ANTERIOR_GRAFICO}</span>
          </div>
          <div className="grafico__corpo">
            <GraficoLinha
              descricao={`Taxa de ocupação hoteleira mês a mês em ${ANO_GRAFICO}, comparada a ${ANTERIOR_GRAFICO}`}
              rotulos={MESES_CURTOS}
              series={[
                { nome: String(ANO_GRAFICO), valores: g.ocupacaoMensal, cor: '#6C5CE0', area: '#B986ED' },
                { nome: String(ANTERIOR_GRAFICO), valores: gAnt.ocupacaoMensal, cor: '#B986ED' },
              ]}
            />
          </div>
          <p className="ot-fonte">Fonte: OT-SRS · valores ilustrativos</p>
        </section>

        <section className="ot-cartao grafico col-5">
          <div className="ot-cartao__cab">
            <div>
              <h2 className="titulo-3">De onde vêm os visitantes</h2>
              <p className="corpo-s suave">Pesquisa de perfil do turista, {ANO_GRAFICO}</p>
            </div>
          </div>
          <div className="grafico__corpo" style={{ display: 'flex', alignItems: 'center' }}>
            <Rosca
              descricao={`Origem dos visitantes em ${ANO_GRAFICO}`}
              centro={`${Math.round(g.visitantes / 1000)} mil`}
              subcentro="visitantes"
              fatias={ORIGENS.map((o, i) => ({ ...o, valor: g.origem[i] }))}
            />
          </div>
          <p className="ot-fonte">Fonte: OT-SRS · valores ilustrativos</p>
        </section>
      </div>

      <section className="secao" style={{ paddingTop: 'var(--esp-7)' }}>
        <div className="secao__cab">
          <div>
            <h2 className="titulo-1">O que esses números dizem</h2>
          </div>
        </div>
        <ul className="fatos">
          {fatos.map((f) => (
            <li key={f.valor} className="fatos__item">
              <span className="numero ot-num">{f.valor}</span>
              <p className="corpo suave">{f.texto}</p>
            </li>
          ))}
        </ul>
      </section>

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
        Valores ilustrativos para o protótipo. Fonte prevista: OT-SRS / SMCELT.
      </p>
    </div>
  )
}
