import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Aviso, Selo } from '../../componentes/Basicos'
import { GraficoLinha } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useSessao } from '../../contexto/Sessao'
import { MESES_CURTOS, mesAno, numero, baixarCsv } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { historicoCompleto } from './prazo'
import { TopoPainel } from './InicioComerciante'
import '../painel.css'

const SITUACAO_TEXTO = {
  publicado: 'Publicado',
  analise: 'Em análise',
  recusado: 'Devolvido',
  rascunho: 'Rascunho',
}

export default function Historico() {
  useTitulo('Histórico e comparação')
  const { sessao } = useSessao()
  const { envios, estabelecimento, carregando, erro, recarregar } = useEnvios()
  const historico = historicoCompleto(envios)
  const cronologico = [...historico].reverse()
  const rotulos = cronologico.map((h) => `${MESES_CURTOS[h.mes - 1]}/${String(h.ano).slice(-2)}`)
  const publicados = historico.filter((h) => h.situacao === 'publicado' && h.ocupacao != null)
  const comparaveis = publicados.filter((h) => h.mediaCidade != null)
  const acimaDaCidade = comparaveis.filter((h) => h.ocupacao > h.mediaCidade).length
  const mediaPropria = publicados.length
    ? Math.round(publicados.reduce((a, h) => a + h.ocupacao, 0) / publicados.length)
    : null
  const melhorMes = publicados.length
    ? publicados.reduce((a, b) => (b.ocupacao > a.ocupacao ? b : a))
    : null
  const nomeArquivo = (estabelecimento?.trade_name || sessao?.nome || 'estabelecimento')
    .toLowerCase()
    .replace(/\s+/g, '-')

  const exportar = () =>
    baixarCsv(`historico-${nomeArquivo}.csv`, [
      ['Mês', 'Ocupação (%)', 'Diárias', 'Hóspedes', 'Funcionários', 'Média da cidade (%)', 'Situação'],
      ...cronologico.map((h) => [
        mesAno(h.ano, h.mes),
        h.ocupacao ?? '',
        h.diarias ?? '',
        h.hospedes ?? '',
        h.funcionarios ?? '',
        h.mediaCidade ?? '',
        SITUACAO_TEXTO[h.situacao] || h.situacao,
      ]),
    ])

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo="Histórico e comparação">
        <button
          type="button"
          className="ot-btn ot-btn--secundario"
          onClick={exportar}
          disabled={historico.length === 0}
        >
          <Icone nome="download" /> Exportar CSV
        </button>
      </TopoPainel>

      {carregando && (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando histórico de envios…</p>
        </div>
      )}

      {!carregando && erro && (
        <Aviso tipo="erro" titulo="Não foi possível carregar o histórico">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={recarregar}>
            Tentar novamente
          </button>
        </Aviso>
      )}

      {!carregando && !erro && historico.length === 0 && (
        <div className="ot-cartao ot-vazio">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="grafico" tamanho="l" /></span>
          <h2 className="titulo-3">Nenhum envio registrado ainda</h2>
          <p className="corpo suave" style={{ maxWidth: '42ch' }}>
            Envie seus dados mensais para acompanhar a evolução e comparar sua ocupação com a cidade.
          </p>
          <Link to="/comerciante/enviar" className="ot-btn ot-btn--primario">
            Enviar dados agora <Icone nome="seta" />
          </Link>
        </div>
      )}

      {!carregando && !erro && historico.length > 0 && (
        <>
          <div className="grade-3">
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Sua ocupação média</span>
              <span className="ot-mini__v ot-num">{mediaPropria == null ? '—' : `${mediaPropria}%`}</span>
              <span className="corpo-s suave">nos meses publicados</span>
            </div>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Acima da média da cidade</span>
              <span className="ot-mini__v ot-num">
                {comparaveis.length > 0 ? `${acimaDaCidade} de ${comparaveis.length}` : '—'}
              </span>
              <span className="corpo-s suave">
                {comparaveis.length > 0 ? 'meses comparáveis' : 'aguardando média municipal'}
              </span>
            </div>
            <div className="ot-mini" style={{ background: 'var(--rosa)' }}>
              <span className="corpo-s" style={{ fontWeight: 700 }}>Melhor mês</span>
              <span className="ot-mini__v ot-mini__v--texto">
                {melhorMes ? `${mesAno(melhorMes.ano, melhorMes.mes)} · ${melhorMes.ocupacao}%` : '—'}
              </span>
            </div>
          </div>

          <section className="ot-cartao grafico" style={{ marginTop: 24 }}>
            <div className="ot-cartao__cab">
              <div>
                <h2 className="titulo-3">Sua ocupação mês a mês</h2>
                <p className="corpo-s suave">Comparada com o seu setor e com a cidade toda</p>
              </div>
            </div>
            <div className="ot-legenda-grafico">
              <span><i style={{ background: 'var(--roxo)' }} />Seu estabelecimento</span>
              <span><i style={{ background: 'var(--lilas)', height: 4 }} />Média do setor</span>
              <span><i style={{ background: 'var(--azul-ceu)', height: 4 }} />Média da cidade</span>
            </div>
            <div className="grafico__corpo">
              {cronologico.length >= 2 ? (
                <GraficoLinha
                  descricao="Ocupação mensal do seu estabelecimento comparada com as médias"
                  rotulos={rotulos}
                  series={[
                    { nome: 'Seu estabelecimento', valores: cronologico.map((h) => h.ocupacao), cor: '#6C5CE0' },
                    { nome: 'Setor', valores: cronologico.map((h) => h.mediaTipo ?? null), cor: '#B986ED' },
                    { nome: 'Cidade', valores: cronologico.map((h) => h.mediaCidade ?? null), cor: '#27B7FD' },
                  ]}
                />
              ) : (
                <p className="corpo suave" style={{ padding: '32px 0' }}>
                  O gráfico de evolução aparece a partir do segundo mês enviado.
                </p>
              )}
            </div>
            <p className="ot-fonte">Meses sem linha: envio devolvido, em análise ou com menos de 5 participantes aprovados. Médias calculadas pelo OT-SRS.</p>
          </section>

          <section className="ot-cartao" style={{ marginTop: 24, padding: '28px 28px 12px' }}>
            <h2 className="titulo-3" style={{ marginBottom: 8 }}>Todos os envios</h2>
            <div className="ot-tabela-moldura">
              <table className="ot-tabela ot-tabela--cartoes">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th className="ot-num">Ocupação</th>
                    <th className="ot-num">Diárias</th>
                    <th className="ot-num">Hóspedes</th>
                    <th>Enviado em</th>
                    <th>Situação</th>
                    <th><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id || `${h.ano}-${h.mes}`}>
                      <td>
                        <strong>{mesAno(h.ano, h.mes)}</strong>
                        {h.motivo && <span className="ot-tabela__sub" style={{ color: 'var(--erro)' }}>{h.motivo}</span>}
                      </td>
                      <td className="ot-num" data-rotulo="Ocupação">{h.ocupacao == null ? '—' : `${h.ocupacao}%`}</td>
                      <td className="ot-num" data-rotulo="Diárias">{numero(h.diarias)}</td>
                      <td className="ot-num" data-rotulo="Hóspedes">{numero(h.hospedes)}</td>
                      <td data-rotulo="Enviado em">{h.enviadoEm}</td>
                      <td data-rotulo="Situação">
                        {h.situacao === 'rascunho' ? (
                          <Selo situacao="analise" icone="lapis">Rascunho</Selo>
                        ) : (
                          <Selo situacao={h.situacao} />
                        )}
                      </td>
                      <td className="ot-tabela__acoes">
                        {h.situacao === 'recusado' && (
                          <Link
                            className="ot-btn ot-btn--perigo ot-btn--p"
                            to={`/comerciante/enviar?id=${h.id}&ano=${h.ano}&mes=${h.mes}`}
                          >
                            <Icone nome="lapis" tamanho="s" /> Corrigir
                          </Link>
                        )}
                        {h.situacao === 'rascunho' && (
                          <Link
                            className="ot-btn ot-btn--secundario ot-btn--p"
                            to={`/comerciante/enviar?id=${h.id}&ano=${h.ano}&mes=${h.mes}`}
                          >
                            <Icone nome="lapis" tamanho="s" /> Continuar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
