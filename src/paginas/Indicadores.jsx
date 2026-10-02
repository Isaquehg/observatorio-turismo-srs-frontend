import { useMemo, useState } from 'react'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Migalhas, Selo } from '../componentes/Basicos'
import { Indicador } from '../componentes/Cartoes'
import { GraficoLinha, Rosca, BarrasHorizontais, BarrasVerticais } from '../componentes/Graficos'
import { ANOS, SETORES, ATUALIZADO_EM, ORIGENS, TIPOS_HOSPEDAGEM, dadosPorAno, resumoDoAno, serie } from '../dados/indicadores'
import { numero, variacao, diferenca, dataCurta, MESES_CURTOS, baixarCsv } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import { useAvisos } from '../contexto/Avisos'
import './publico.css'

function CabecalhoGrafico({ titulo, subtitulo, aoBaixar }) {
  return (
    <div className="ot-cartao__cab">
      <div>
        <h3 className="titulo-3">{titulo}</h3>
        <p className="corpo-s suave">{subtitulo}</p>
      </div>
      <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={aoBaixar} aria-label={`Baixar dados de ${titulo.toLowerCase()} em CSV`}>
        <Icone nome="download" tamanho="s" /> CSV
      </button>
    </div>
  )
}

export default function Indicadores() {
  useTitulo('Indicadores')
  const { avisar } = useAvisos()
  const [ano, setAno] = useState(2025)
  const [setor, setSetor] = useState('todos')

  const d = dadosPorAno[ano]
  const anoAnterior = ano - 1
  const temAnterior = !!dadosPorAno[anoAnterior]
  const atual = resumoDoAno(ano, setor)
  const anterior = temAnterior ? resumoDoAno(anoAnterior, setor) : null
  const nomeSetor = SETORES.find((s) => s.id === setor)?.nome

  const cartoes = useMemo(
    () => [
      { rotulo: 'Leitos disponíveis', valor: numero(atual.leitos), icone: 'cama', cor: 'var(--ciano)', variacao: anterior && variacao(atual.leitos, anterior.leitos), serie: serie('leitos', ano) },
      { rotulo: 'Ocupação média', valor: atual.ocupacao, unidade: '%', icone: 'ocupacao', cor: 'var(--amarelo)', variacao: anterior && diferenca(atual.ocupacao, anterior.ocupacao, ' p.p.'), serie: serie('ocupacao', ano) },
      { rotulo: setor === 'todos' ? 'Empresas do turismo' : `Empresas · ${nomeSetor}`, valor: numero(atual.empresas), icone: 'loja', cor: 'var(--rosa)', variacao: anterior && variacao(atual.empresas, anterior.empresas), serie: serie('empresas', ano, setor) },
      { rotulo: setor === 'todos' ? 'Empregos no setor' : `Empregos · ${nomeSetor}`, valor: numero(atual.empregos), icone: 'pessoas', cor: 'var(--lilas)', variacao: anterior && variacao(atual.empregos, anterior.empregos), serie: serie('empregos', ano, setor) },
    ],
    [atual, anterior, ano, setor, nomeSetor],
  )

  const csv = {
    ocupacao: () =>
      baixarCsv(`ocupacao-hoteleira-${ano}.csv`, [
        ['Mês', `Ocupação ${ano} (%)`, ...(temAnterior ? [`Ocupação ${anoAnterior} (%)`] : [])],
        ...MESES_CURTOS.map((m, i) => [m, d.ocupacaoMensal[i], ...(temAnterior ? [dadosPorAno[anoAnterior].ocupacaoMensal[i]] : [])]),
      ]),
    origem: () => baixarCsv(`origem-visitantes-${ano}.csv`, [['Origem', 'Participação (%)'], ...ORIGENS.map((o, i) => [o.nome, d.origem[i]])]),
    leitos: () => baixarCsv(`leitos-por-tipo-${ano}.csv`, [['Tipo', 'Leitos'], ...TIPOS_HOSPEDAGEM.map((t, i) => [t.nome, d.leitosPorTipo[i]])]),
    empregos: () => baixarCsv(`empregos-por-setor-${ano}.csv`, [['Setor', 'Empregos', 'Empresas'], ...SETORES.map((s) => [s.nome, d.empregos[s.id], d.empresas[s.id]])]),
    categorias: () =>
      baixarCsv(`hospedagem-por-categoria-${ano}.csv`, [
        ['Categoria', 'Estabelecimentos', 'Leitos', 'Ocupação média (%)', 'Situação'],
        ...TIPOS_HOSPEDAGEM.map((t, i) => [t.nome, ...d.categorias[i].slice(0, 3).map((v) => v ?? ''), d.categorias[i][3] === 'publicado' ? 'Publicado' : 'Em análise']),
      ]),
  }

  const baixarTudo = () => {
    baixarCsv(`indicadores-turismo-srs-${ANOS[0]}-${ANOS[ANOS.length - 1]}.csv`, [
      ['Ano', 'Leitos', 'Meios de hospedagem', 'Ocupação média (%)', 'Empresas do turismo', 'Empregos no setor', 'Visitantes estimados'],
      ...ANOS.map((a) => {
        const r = resumoDoAno(a)
        return [a, r.leitos, r.hospedagens, r.ocupacao, r.empresas, r.empregos, dadosPorAno[a].visitantes]
      }),
    ])
    avisar('Download iniciado', { texto: 'A planilha abre direto no Excel ou no LibreOffice.' })
  }

  return (
    <div className="container pag surgir">
      <div className="pag__cab">
        <div>
          <Migalhas atual="Indicadores" />
          <h1 className="display-l pag__titulo">
            Indicadores <span className="ot-marca">turísticos</span>
          </h1>
          <p className="corpo-l pag__abertura">Hospedagem, leitos, empresas e empregos do setor. Filtre por ano e por setor; tudo pode ser baixado.</p>
        </div>
        <div className="pag__cab-lado">
          <Selo situacao="publicado">Atualizado em {dataCurta(ATUALIZADO_EM)}</Selo>
          <button type="button" className="ot-btn ot-btn--secundario" onClick={baixarTudo}>
            <Icone nome="download" /> Baixar tudo (CSV)
          </button>
        </div>
      </div>

      <div className="ot-filtros" role="group" aria-label="Filtros">
        <div className="ot-filtros__grupo">
          <span className="ot-filtros__rotulo" id="rotulo-periodo"><Icone nome="calendario" tamanho="s" /> Período</span>
          <div className="ot-segmentado" role="group" aria-labelledby="rotulo-periodo">
            {ANOS.map((a) => (
              <button key={a} type="button" aria-pressed={ano === a} onClick={() => setAno(a)}>{a}</button>
            ))}
          </div>
        </div>
        <span className="ot-filtros__divisor" aria-hidden="true" />
        <div className="ot-filtros__grupo">
          <span className="ot-filtros__rotulo" id="rotulo-setor"><Icone nome="filtro" tamanho="s" /> Setor</span>
          <div className="ot-filtros__chips" role="group" aria-labelledby="rotulo-setor">
            <button type="button" className="ot-chip" aria-pressed={setor === 'todos'} onClick={() => setSetor('todos')}>Todos</button>
            {SETORES.map((s) => (
              <button key={s.id} type="button" className="ot-chip" aria-pressed={setor === s.id} onClick={() => setSetor(s.id)}>
                <span className="ot-ponto" style={{ background: s.cor }} />
                {s.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Mostrando {ano}{setor !== 'todos' ? `, setor ${nomeSetor}` : ''}.
      </p>

      <div className="grade-4" style={{ marginTop: 24 }}>
        {cartoes.map((c) => (
          <Indicador key={c.icone} {...c} comparacao={anterior ? `vs. ${anoAnterior}` : 'primeiro ano da série'} />
        ))}
      </div>

      <div className="indicadores__grade">
        <section className="ot-cartao grafico col-7">
          <CabecalhoGrafico titulo="Taxa de ocupação hoteleira" subtitulo="Média mensal dos meios de hospedagem que enviaram dados" aoBaixar={csv.ocupacao} />
          <div className="ot-legenda-grafico">
            <span><i style={{ background: 'var(--roxo)' }} />{ano}</span>
            {temAnterior && <span><i style={{ background: 'var(--lilas)', height: 4 }} />{anoAnterior}</span>}
          </div>
          <div className="grafico__corpo">
            <GraficoLinha
              key={ano}
              descricao={`Taxa de ocupação hoteleira mês a mês em ${ano}`}
              rotulos={MESES_CURTOS}
              series={[
                { nome: String(ano), valores: d.ocupacaoMensal, cor: '#6C5CE0', area: '#B986ED' },
                ...(temAnterior ? [{ nome: String(anoAnterior), valores: dadosPorAno[anoAnterior].ocupacaoMensal, cor: '#B986ED' }] : []),
              ]}
            />
          </div>
          <p className="ot-fonte">Fonte: OT-SRS · valores ilustrativos</p>
        </section>

        <section className="ot-cartao grafico col-5">
          <CabecalhoGrafico titulo="De onde vêm os visitantes" subtitulo={`Pesquisa de perfil do turista, ${ano}`} aoBaixar={csv.origem} />
          <div className="grafico__corpo" style={{ display: 'flex', alignItems: 'center' }}>
            <Rosca
              key={ano}
              descricao={`Origem dos visitantes em ${ano}`}
              centro={`${Math.round(d.visitantes / 1000)} mil`}
              subcentro="visitantes"
              fatias={ORIGENS.map((o, i) => ({ ...o, valor: d.origem[i] }))}
            />
          </div>
          <p className="ot-fonte">Fonte: OT-SRS · valores ilustrativos</p>
        </section>

        <section className="ot-cartao grafico col-6">
          <CabecalhoGrafico titulo="Leitos por tipo de hospedagem" subtitulo={`${numero(atual.leitos)} leitos em ${d.hospedagens} estabelecimentos`} aoBaixar={csv.leitos} />
          <div className="grafico__corpo">
            <BarrasHorizontais
              key={ano}
              descricao={`Leitos por tipo de hospedagem em ${ano}`}
              itens={TIPOS_HOSPEDAGEM.map((t, i) => ({ ...t, valor: d.leitosPorTipo[i] }))}
            />
          </div>
          <p className="ot-fonte">Fonte: OT-SRS · valores ilustrativos</p>
        </section>

        <section className="ot-cartao grafico col-6">
          <CabecalhoGrafico titulo="Empregos formais por setor" subtitulo={`Postos de trabalho ligados ao turismo, ${ano}`} aoBaixar={csv.empregos} />
          <div className="grafico__corpo">
            <BarrasVerticais
              key={ano}
              descricao={`Empregos formais por setor em ${ano}`}
              destaque={setor === 'todos' ? null : setor}
              itens={SETORES.map((s) => ({ id: s.id, nome: s.nome, hex: s.hex, valor: d.empregos[s.id] }))}
            />
          </div>
          <p className="ot-fonte">Fonte: RAIS / OT-SRS · valores ilustrativos</p>
        </section>
      </div>

      <section className="ot-cartao" style={{ marginTop: 24, padding: '28px 28px 12px' }}>
        <CabecalhoGrafico titulo="Meios de hospedagem por categoria" subtitulo="Dados enviados pelos estabelecimentos e validados pela SMCELT" aoBaixar={csv.categorias} />
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
              {TIPOS_HOSPEDAGEM.map((t, i) => {
                const [est, leitos, ocup, situacao] = d.categorias[i]
                return (
                  <tr key={t.nome}>
                    <td><strong>{t.nome}</strong></td>
                    <td className="ot-num" data-rotulo="Estabelecimentos">{est}</td>
                    <td className="ot-num" data-rotulo="Leitos">{numero(leitos)}</td>
                    <td className="ot-num" data-rotulo="Ocupação média">{ocup == null ? '—' : `${ocup}%`}</td>
                    <td data-rotulo="Situação"><Selo situacao={situacao} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="ot-fonte" style={{ marginTop: 8 }}>
        “—” indica que ainda não há envios suficientes para calcular a média. Valores ilustrativos para o protótipo.
      </p>

      <section className="dados-abertos" id="dados-abertos">
        <span className="dados-abertos__icone ot-bolha"><Icone nome="arquivo" tamanho="l" /></span>
        <div className="dados-abertos__texto">
          <h2 className="titulo-2">Dados abertos, do jeito que você precisar</h2>
          <p className="corpo" style={{ marginTop: 6 }}>
            A série completa de {ANOS[0]} a {ANOS[ANOS.length - 1]} em CSV, separada por ponto e vírgula. Pode usar, cruzar e citar — só mencione a fonte.
          </p>
        </div>
        <button type="button" className="ot-btn ot-btn--secundario ot-btn--g" onClick={baixarTudo}>
          <Icone nome="download" /> Baixar série completa
        </button>
        <Adesivo tipo="brilho" cor="#FFFFFF" tamanho={64} />
      </section>
    </div>
  )
}
