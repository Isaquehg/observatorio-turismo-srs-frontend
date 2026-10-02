import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Selo } from '../../componentes/Basicos'
import { GraficoLinha } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { MEU_NEGOCIO } from '../../dados/painel'
import { MESES_CURTOS, mesAno, numero, baixarCsv } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { historicoCompleto } from './prazo'
import { TopoPainel } from './InicioComerciante'
import '../painel.css'

const SITUACAO_TEXTO = { publicado: 'Publicado', analise: 'Em análise', recusado: 'Devolvido' }

export default function Historico() {
  useTitulo('Histórico e comparação')
  const { envios } = useEnvios()
  const historico = historicoCompleto(envios)
  const cronologico = [...historico].reverse()
  const rotulos = cronologico.map((h) => MESES_CURTOS[h.mes - 1])
  const publicados = historico.filter((h) => h.ocupacao != null && h.mediaCidade != null)
  const acimaDaCidade = publicados.filter((h) => h.ocupacao > h.mediaCidade).length
  const mediaPropria = Math.round(publicados.reduce((a, h) => a + h.ocupacao, 0) / publicados.length)

  const exportar = () =>
    baixarCsv(`historico-${MEU_NEGOCIO.nome.toLowerCase().replace(/\s+/g, '-')}.csv`, [
      ['Mês', 'Ocupação (%)', 'Diárias', 'Hóspedes', 'Funcionários', 'Média da cidade (%)', 'Situação'],
      ...cronologico.map((h) => [mesAno(h.ano, h.mes), h.ocupacao ?? '', h.diarias ?? '', h.hospedes ?? '', h.funcionarios ?? '', h.mediaCidade ?? '', SITUACAO_TEXTO[h.situacao]]),
    ])

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo="Histórico e comparação">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={exportar}>
          <Icone nome="download" /> Exportar CSV
        </button>
      </TopoPainel>

      <div className="grade-3">
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Sua ocupação média</span>
          <span className="ot-mini__v ot-num">{mediaPropria}%</span>
          <span className="corpo-s suave">nos meses publicados de 2026</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Acima da média da cidade</span>
          <span className="ot-mini__v ot-num">{acimaDaCidade} de {publicados.length}</span>
          <span className="corpo-s suave">meses</span>
        </div>
        <div className="ot-mini" style={{ background: 'var(--rosa)' }}>
          <span className="corpo-s" style={{ fontWeight: 700 }}>Melhor mês</span>
          <span className="ot-mini__v ot-mini__v--texto">
            {(() => {
              const m = publicados.reduce((a, b) => (b.ocupacao > a.ocupacao ? b : a))
              return `${mesAno(m.ano, m.mes)} · ${m.ocupacao}%`
            })()}
          </span>
        </div>
      </div>

      <section className="ot-cartao grafico" style={{ marginTop: 24 }}>
        <div className="ot-cartao__cab">
          <div>
            <h2 className="titulo-3">Sua ocupação mês a mês</h2>
            <p className="corpo-s suave">Comparada com as pousadas e com a cidade toda, em 2026</p>
          </div>
        </div>
        <div className="ot-legenda-grafico">
          <span><i style={{ background: 'var(--roxo)' }} />Sua pousada</span>
          <span><i style={{ background: 'var(--lilas)', height: 4 }} />Média das pousadas</span>
          <span><i style={{ background: 'var(--azul-ceu)', height: 4 }} />Média da cidade</span>
        </div>
        <div className="grafico__corpo">
          <GraficoLinha
            descricao="Ocupação mensal da sua pousada comparada com as médias"
            rotulos={rotulos}
            series={[
              { nome: 'Sua pousada', valores: cronologico.map((h) => h.ocupacao), cor: '#6C5CE0' },
              { nome: 'Pousadas', valores: cronologico.map((h) => h.mediaTipo ?? null), cor: '#B986ED' },
              { nome: 'Cidade', valores: cronologico.map((h) => h.mediaCidade ?? null), cor: '#27B7FD' },
            ]}
          />
        </div>
        <p className="ot-fonte">Meses sem linha: envio devolvido ou ainda em análise. Médias calculadas pelo OT-SRS.</p>
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
                <tr key={`${h.ano}-${h.mes}`}>
                  <td>
                    <strong>{mesAno(h.ano, h.mes)}</strong>
                    {h.motivo && <span className="ot-tabela__sub" style={{ color: 'var(--erro)' }}>{h.motivo}</span>}
                  </td>
                  <td className="ot-num" data-rotulo="Ocupação">{h.ocupacao == null ? '—' : `${h.ocupacao}%`}</td>
                  <td className="ot-num" data-rotulo="Diárias">{numero(h.diarias)}</td>
                  <td className="ot-num" data-rotulo="Hóspedes">{numero(h.hospedes)}</td>
                  <td data-rotulo="Enviado em">{h.enviadoEm}</td>
                  <td data-rotulo="Situação"><Selo situacao={h.situacao} /></td>
                  <td className="ot-tabela__acoes">
                    {h.situacao === 'recusado' && (
                      <Link className="ot-btn ot-btn--perigo ot-btn--p" to={`/comerciante/enviar?ano=${h.ano}&mes=${h.mes}`}>
                        <Icone nome="lapis" tamanho="s" /> Corrigir
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
