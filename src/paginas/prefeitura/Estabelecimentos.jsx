import { useMemo, useState } from 'react'
import Icone from '../../componentes/Icone'
import { Selo } from '../../componentes/Basicos'
import { BarrasHorizontais, BarrasVerticais, Rosca } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { naoEnviaram } from '../../dados/painel'
import { baixarCsv, mesAno, normalizar, numero } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'

const TIPOS = [
  { id: 'Hotel', nome: 'Hotéis', hex: '#0A4AAD' },
  { id: 'Pousada', nome: 'Pousadas', hex: '#6C5CE0' },
  { id: 'Chalé', nome: 'Chalés e sítios', hex: '#B986ED' },
  { id: 'Hostel', nome: 'Hostels', hex: '#27B7FD' },
  { id: 'Aluguel', nome: 'Aluguel por temporada', hex: '#C750D6' },
]
const SITUACOES = [
  { id: 'publicado', nome: 'Publicado', hex: '#1C7C54' },
  { id: 'analise', nome: 'Em análise', hex: '#FADA77' },
  { id: 'recusado', nome: 'Devolvido', hex: '#B42318' },
  { id: 'pendente', nome: 'Não enviou', hex: '#B6B0C8' },
]

// Quem não enviou só tem o nome: o tipo sai da primeira palavra
function tipoPeloNome(nome) {
  const p = nome.split(' ')[0]
  if (p === 'Sítio' || p === 'Chalé' || p === 'Chalés') return 'Chalé'
  return TIPOS.some((t) => t.id === p) ? p : 'Pousada'
}

export default function Estabelecimentos() {
  useTitulo('Estabelecimentos')
  const { envios } = useEnvios()
  const [termo, setTermo] = useState('')
  const [filtro, setFiltro] = useState('todos')

  // Um registro por estabelecimento, com o envio mais recente
  const lista = useMemo(() => {
    const porNome = new Map()
    for (const e of envios) {
      const atual = porNome.get(e.nome)
      if (!atual || e.ano * 12 + e.mes > atual.ano * 12 + atual.mes) porNome.set(e.nome, e)
    }
    const comEnvio = [...porNome.values()].map((e) => ({ ...e, tipo: tipoPeloNome(e.tipo) }))
    const semEnvio = naoEnviaram.map((nome) => ({ nome, tipo: tipoPeloNome(nome), situacao: 'pendente' }))
    return [...comEnvio, ...semEnvio]
  }, [envios])

  const comEnvio = lista.filter((e) => e.situacao !== 'pendente')
  const validos = comEnvio.filter((e) => e.ocupacao != null && e.ocupacao <= 100)
  const ocupacaoMedia = validos.length ? Math.round(validos.reduce((a, e) => a + e.ocupacao, 0) / validos.length) : null
  const leitos = comEnvio.reduce((a, e) => a + (e.leitos || 0), 0)
  const taxaResposta = Math.round((comEnvio.length / lista.length) * 100)

  const porSituacao = SITUACOES.map((s) => ({ ...s, valor: lista.filter((e) => e.situacao === s.id).length })).filter((s) => s.valor > 0)
  const porTipo = TIPOS.map((t) => ({ ...t, valor: lista.filter((e) => e.tipo === t.id).length })).filter((t) => t.valor > 0)
  const ranking = [...validos].sort((a, b) => b.ocupacao - a.ocupacao).slice(0, 8)
    .map((e) => ({ nome: e.nome, valor: e.ocupacao, hex: TIPOS.find((t) => t.id === e.tipo)?.hex || '#6C5CE0' }))

  const visiveis = lista.filter((e) => (filtro === 'todos' || e.situacao === filtro) && (!termo || normalizar(e.nome).includes(normalizar(termo))))

  const exportar = () =>
    baixarCsv('estabelecimentos-observatorio.csv', [
      ['Estabelecimento', 'Tipo', 'Último envio', 'Ocupação (%)', 'Leitos', 'Situação'],
      ...lista.map((e) => [e.nome, e.tipo, e.mes ? mesAno(e.ano, e.mes) : '', e.ocupacao ?? '', e.leitos ?? '', SITUACOES.find((s) => s.id === e.situacao).nome]),
    ])

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Prefeitura" titulo="Estabelecimentos" cor="var(--ciano)">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={exportar}>
          <Icone nome="download" /> Exportar CSV
        </button>
      </TopoPainel>

      <div className="grade-4 grade-4--compacta">
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Cadastrados</span>
          <span className="ot-mini__v ot-num">{lista.length}</span>
          <span className="corpo-s suave">meios de hospedagem</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Taxa de resposta</span>
          <span className="ot-mini__v ot-num">{taxaResposta}%</span>
          <span className="corpo-s suave">{comEnvio.length} enviaram dados</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Ocupação média</span>
          <span className="ot-mini__v ot-num">{ocupacaoMedia ?? '—'}%</span>
          <span className="corpo-s suave">nos envios válidos</span>
        </div>
        <div className="ot-mini" style={{ background: 'var(--ciano)' }}>
          <span className="corpo-s" style={{ fontWeight: 700 }}>Leitos informados</span>
          <span className="ot-mini__v ot-num">{numero(leitos)}</span>
          <span className="corpo-s">por quem enviou</span>
        </div>
      </div>

      <div className="painel__grade painel__grade--tres">
        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Situação dos envios</h2>
          <p className="corpo-s suave">Último mês de cada estabelecimento</p>
          <div className="grafico__corpo" style={{ display: 'flex', alignItems: 'center' }}>
            <Rosca descricao="Estabelecimentos por situação do último envio" centro={lista.length} subcentro="estabelecimentos" sufixo="" fatias={porSituacao} />
          </div>
        </section>
        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Por tipo de hospedagem</h2>
          <p className="corpo-s suave">Todos os cadastrados</p>
          <div className="grafico__corpo">
            <BarrasVerticais descricao="Estabelecimentos por tipo de hospedagem" itens={porTipo} />
          </div>
        </section>
        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Maior ocupação</h2>
          <p className="corpo-s suave">Envios válidos mais recentes</p>
          <div className="grafico__corpo">
            <BarrasHorizontais descricao="Estabelecimentos com maior taxa de ocupação" itens={ranking} sufixo="%" />
          </div>
        </section>
      </div>

      <section className="ot-cartao" style={{ marginTop: 'var(--esp-5)', padding: '28px 28px 12px' }}>
        <div className="estab__barra">
          <h2 className="titulo-3">Todos os estabelecimentos</h2>
          <div className="estab__filtros">
            <div className="ot-entrada-icone">
              <Icone nome="busca" />
              <input className="ot-entrada" type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar pelo nome" aria-label="Buscar estabelecimento" />
            </div>
            <select className="ot-selecao" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por situação">
              <option value="todos">Todas as situações</option>
              {SITUACOES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="ot-tabela-moldura">
          <table className="ot-tabela ot-tabela--cartoes">
            <thead>
              <tr>
                <th>Estabelecimento</th>
                <th>Último envio</th>
                <th className="ot-num">Ocupação</th>
                <th className="ot-num">Leitos</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((e) => (
                <tr key={e.nome}>
                  <td><strong>{e.nome}</strong><span className="ot-tabela__sub">{e.tipo}</span></td>
                  <td data-rotulo="Último envio">{e.mes ? mesAno(e.ano, e.mes) : '—'}</td>
                  <td className="ot-num" data-rotulo="Ocupação">{e.ocupacao == null ? '—' : `${e.ocupacao}%`}</td>
                  <td className="ot-num" data-rotulo="Leitos">{e.leitos ?? '—'}</td>
                  <td data-rotulo="Situação">
                    {e.situacao === 'pendente' ? <Selo icone="relogio">Não enviou</Selo> : <Selo situacao={e.situacao} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visiveis.length === 0 && <p className="corpo suave" style={{ padding: '24px 0' }}>Nenhum estabelecimento encontrado.</p>}
        </div>
      </section>
    </div>
  )
}
