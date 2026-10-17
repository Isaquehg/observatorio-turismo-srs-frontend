import { useState } from 'react'
import Icone from '../../componentes/Icone'
import { CartaoRelatorio, ResumoRelatorio, useResumo } from '../../componentes/Cartoes'
import { GraficoLinha } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { ANOS, dadosPorAno } from '../../dados/indicadores'
import { relatorios } from '../../dados/relatorios'
import { baixarCsv, mesAno, MESES_CURTOS } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'

const ANO = ANOS[ANOS.length - 1]

export default function RelatoriosGerenciais() {
  useTitulo('Relatórios gerenciais')
  const { envios } = useEnvios()
  const { avisar } = useAvisos()
  const { aberto, abrir, fechar } = useResumo()

  // Meses que já têm envios, do mais recente para o mais antigo
  const meses = [...new Set(envios.map((e) => e.ano * 100 + e.mes))].sort((a, b) => b - a)
  // Abre no mês mais recente que já tem algo publicado
  const [mes, setMes] = useState(() => meses.find((m) => envios.some((e) => e.ano * 100 + e.mes === m && e.situacao === 'publicado')) ?? meses[0])
  const doMes = envios.filter((e) => e.ano * 100 + e.mes === mes)
  const validos = doMes.filter((e) => e.situacao === 'publicado' && e.ocupacao != null)
  const rotuloMes = mesAno(Math.floor(mes / 100), mes % 100)
  const resumo = [
    ['Envios recebidos', doMes.length],
    ['Publicados', validos.length],
    ['Em análise', doMes.filter((e) => e.situacao === 'analise').length],
    ['Devolvidos', doMes.filter((e) => e.situacao === 'recusado').length],
    ['Ocupação média publicada', validos.length ? `${Math.round(validos.reduce((a, e) => a + e.ocupacao, 0) / validos.length)}%` : '—'],
    ['Diárias vendidas', validos.reduce((a, e) => a + (e.diarias || 0), 0).toLocaleString('pt-BR')],
  ]

  const gerar = () => {
    baixarCsv(`relatorio-mensal-${Math.floor(mes / 100)}-${String(mes % 100).padStart(2, '0')}.csv`, [
      ['Relatório mensal do Observatório', rotuloMes],
      [],
      ...resumo,
      [],
      ['Estabelecimento', 'Tipo', 'Ocupação (%)', 'Leitos', 'Diárias', 'Situação'],
      ...doMes.map((e) => [e.nome, e.tipo, e.ocupacao ?? '', e.leitos ?? '', e.diarias ?? '', e.situacao]),
    ])
    avisar('Relatório gerado', { texto: `O consolidado de ${rotuloMes} foi baixado em CSV.` })
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Prefeitura" titulo="Relatórios gerenciais" cor="var(--ciano)" />

      <div className="painel__grade">
        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Ocupação média da cidade</h2>
          <p className="corpo-s suave">Mês a mês, {ANO} comparado a {ANO - 1}</p>
          <div className="ot-legenda-grafico" style={{ marginTop: 12 }}>
            <span><i style={{ background: 'var(--roxo)' }} />{ANO}</span>
            <span><i style={{ background: 'var(--lilas)', height: 4 }} />{ANO - 1}</span>
          </div>
          <div className="grafico__corpo">
            <GraficoLinha
              descricao={`Ocupação média mensal da cidade em ${ANO} e ${ANO - 1}`}
              rotulos={MESES_CURTOS}
              series={[
                { nome: String(ANO), valores: dadosPorAno[ANO].ocupacaoMensal, cor: '#6C5CE0', area: '#B986ED' },
                { nome: String(ANO - 1), valores: dadosPorAno[ANO - 1].ocupacaoMensal, cor: '#B986ED' },
              ]}
            />
          </div>
        </section>

        <section className="ot-cartao gerar">
          <h2 className="titulo-3">Gerar relatório do mês</h2>
          <p className="corpo-s suave">Consolidado dos envios, pronto para planilha.</p>
          <label className="ot-rotulo" htmlFor="mes-relatorio" style={{ marginTop: 16 }}>Mês de referência</label>
          <select id="mes-relatorio" className="ot-selecao" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {meses.map((m) => <option key={m} value={m}>{mesAno(Math.floor(m / 100), m % 100)}</option>)}
          </select>
          <dl className="gerar__resumo">
            {resumo.map(([rotulo, valor]) => (
              <div key={rotulo}><dt>{rotulo}</dt><dd className="ot-num">{valor}</dd></div>
            ))}
          </dl>
          <button type="button" className="ot-btn ot-btn--primario ot-btn--largo" onClick={gerar}>
            <Icone nome="download" /> Baixar relatório de {rotuloMes}
          </button>
        </section>
      </div>

      <section style={{ marginTop: 'var(--esp-6)' }}>
        <h2 className="titulo-2" style={{ marginBottom: 16 }}>Relatórios publicados</h2>
        <div className="pilha" style={{ gap: 16 }}>
          {relatorios.slice(0, 5).map((r) => <CartaoRelatorio key={r.id} relatorio={r} aoAbrir={abrir} />)}
        </div>
      </section>
      <ResumoRelatorio relatorio={aberto} aoFechar={fechar} />
    </div>
  )
}
