import { useEffect, useMemo, useState } from 'react'
import Icone from '../../componentes/Icone'
import { Aviso, Selo } from '../../componentes/Basicos'
import { BarrasHorizontais, BarrasVerticais, Rosca } from '../../componentes/Graficos'
import { listarEstabelecimentosAdmin } from '../../util/enviosApi'
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

const STATUS_ULTIMO_ENVIO = {
  approved: 'publicado',
  submitted: 'analise',
  returned: 'recusado',
}

const LIMITE = 10

function normalizarEstabelecimentoAdmin(raw) {
  const ultimo = raw.latest_submission
  const [anoStr, mesStr] = String(ultimo?.reference_month || '').slice(0, 10).split('-')
  const ano = anoStr ? Number(anoStr) : null
  const mes = mesStr ? Number(mesStr) : null
  const situacao = ultimo ? STATUS_ULTIMO_ENVIO[ultimo.status] || 'pendente' : 'pendente'

  return {
    id: raw.id,
    nome: raw.trade_name,
    cnpj: raw.tax_id,
    tipo: raw.type || raw.sector?.name || 'Outro',
    ano,
    mes,
    ocupacao:
      typeof ultimo?.occupancy_rate === 'number' && !Number.isNaN(ultimo.occupancy_rate)
        ? Math.round(ultimo.occupancy_rate)
        : null,
    leitos: ultimo?.beds_available ?? raw.beds_count ?? null,
    situacao,
  }
}

export default function Estabelecimentos() {
  useTitulo('Estabelecimentos')
  const [estabelecimentos, setEstabelecimentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [termo, setTermo] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [todos, setTodos] = useState(false)

  // Fetches registered establishments and their latest submissions from GET /api/admin/establishments
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const resposta = await listarEstabelecimentosAdmin(
          { limit: 100 },
          { signal: controlador.signal },
        )
        if (!ativo) return
        setEstabelecimentos(resposta.data.map(normalizarEstabelecimentoAdmin))
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os estabelecimentos.')
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

  const lista = estabelecimentos
  const comEnvio = useMemo(() => lista.filter((e) => e.situacao !== 'pendente'), [lista])
  const validos = useMemo(
    () => comEnvio.filter((e) => e.ocupacao != null && e.ocupacao <= 100),
    [comEnvio],
  )
  const ocupacaoMedia = validos.length
    ? Math.round(validos.reduce((a, e) => a + e.ocupacao, 0) / validos.length)
    : null
  const leitos = comEnvio.reduce((a, e) => a + (e.leitos || 0), 0)
  const taxaResposta = lista.length ? Math.round((comEnvio.length / lista.length) * 100) : 0

  const porSituacao = useMemo(
    () => SITUACOES.map((s) => ({ ...s, valor: lista.filter((e) => e.situacao === s.id).length })).filter((s) => s.valor > 0),
    [lista],
  )
  const porTipo = useMemo(
    () => TIPOS.map((t) => ({ ...t, valor: lista.filter((e) => e.tipo === t.id).length })).filter((t) => t.valor > 0),
    [lista],
  )
  const ranking = useMemo(
    () =>
      [...validos]
        .sort((a, b) => b.ocupacao - a.ocupacao)
        .slice(0, 8)
        .map((e) => ({
          nome: e.nome,
          valor: e.ocupacao,
          hex: TIPOS.find((t) => t.id === e.tipo)?.hex || '#6C5CE0',
        })),
    [validos],
  )

  const filtrados = lista.filter(
    (e) =>
      (filtro === 'todos' || e.situacao === filtro) &&
      (!termo || normalizar(`${e.nome} ${e.cnpj}`).includes(normalizar(termo))),
  )
  const visiveis = todos ? filtrados : filtrados.slice(0, LIMITE)

  const exportar = () =>
    baixarCsv('estabelecimentos-observatorio.csv', [
      ['Estabelecimento', 'Tipo', 'Último envio', 'Ocupação (%)', 'Leitos', 'Situação'],
      ...lista.map((e) => [
        e.nome,
        e.tipo,
        e.mes ? mesAno(e.ano, e.mes) : '',
        e.ocupacao ?? '',
        e.leitos ?? '',
        SITUACOES.find((s) => s.id === e.situacao)?.nome || e.situacao,
      ]),
    ])

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Prefeitura" titulo="Estabelecimentos" cor="var(--ciano)">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={exportar} disabled={lista.length === 0}>
          <Icone nome="download" /> Exportar CSV
        </button>
      </TopoPainel>

      {carregando && (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando estabelecimentos…</p>
        </div>
      )}

      {!carregando && erro && (
        <Aviso tipo="erro" titulo="Não foi possível carregar os estabelecimentos">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={() => setTentativa((t) => t + 1)}>
            Tentar novamente
          </button>
        </Aviso>
      )}

      {!carregando && !erro && lista.length === 0 && (
        <div className="ot-cartao ot-vazio">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="predio" tamanho="l" /></span>
          <h2 className="titulo-3">Nenhum estabelecimento cadastrado</h2>
          <p className="corpo suave">Assim que estabelecimentos forem cadastrados na base, eles aparecem aqui.</p>
        </div>
      )}

      {!carregando && !erro && lista.length > 0 && (
        <>
          <div className="grade-4 grade-4--compacta">
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Cadastrados</span>
              <span className="ot-mini__v ot-num">{lista.length}</span>
              <span className="corpo-s suave">estabelecimentos na base da SMCELT</span>
            </div>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Taxa de resposta</span>
              <span className="ot-mini__v ot-num">{taxaResposta}%</span>
              <span className="corpo-s suave">{comEnvio.length} enviaram dados</span>
            </div>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Ocupação média</span>
              <span className="ot-mini__v ot-num">{ocupacaoMedia == null ? '—' : `${ocupacaoMedia}%`}</span>
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
                {porSituacao.length > 0 ? (
                  <Rosca descricao="Estabelecimentos por situação do último envio" centro={lista.length} subcentro="estabelecimentos" sufixo="" fatias={porSituacao} />
                ) : (
                  <p className="corpo suave" style={{ padding: '24px 0' }}>Sem dados para exibir.</p>
                )}
              </div>
            </section>
            <section className="ot-cartao grafico">
              <h2 className="titulo-3">Por tipo de hospedagem</h2>
              <p className="corpo-s suave">Todos os cadastrados</p>
              <div className="grafico__corpo">
                {porTipo.length > 0 ? (
                  <BarrasVerticais descricao="Estabelecimentos por tipo de hospedagem" itens={porTipo} />
                ) : (
                  <p className="corpo suave" style={{ padding: '24px 0' }}>Sem tipos de hospedagem categorizados.</p>
                )}
              </div>
            </section>
            <section className="ot-cartao grafico">
              <h2 className="titulo-3">Maior ocupação</h2>
              <p className="corpo-s suave">Envios válidos mais recentes</p>
              <div className="grafico__corpo">
                {ranking.length > 0 ? (
                  <BarrasHorizontais descricao="Estabelecimentos com maior taxa de ocupação" itens={ranking} sufixo="%" />
                ) : (
                  <p className="corpo suave" style={{ padding: '24px 0' }}>Nenhum envio com taxa de ocupação registrada.</p>
                )}
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
                    <tr key={e.id}>
                      <td><strong>{e.nome}</strong><span className="ot-tabela__sub">{e.tipo}</span></td>
                      <td data-rotulo="Último envio">{e.mes ? mesAno(e.ano, e.mes) : '—'}</td>
                      <td className="ot-num" data-rotulo="Ocupação">{e.ocupacao == null ? '—' : e.ocupacao > 100 ? <span title="Ocupação acima de 100%: o envio precisa de correção" style={{ color: 'var(--erro)', fontWeight: 700 }}><Icone nome="alerta" tamanho="s" /> {e.ocupacao}%</span> : `${e.ocupacao}%`}</td>
                      <td className="ot-num" data-rotulo="Leitos">{e.leitos ?? '—'}</td>
                      <td data-rotulo="Situação">
                        {e.situacao === 'pendente' ? <Selo icone="relogio">Não enviou</Selo> : <Selo situacao={e.situacao} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visiveis.length === 0 && <p className="corpo suave" style={{ padding: '24px 0' }}>Nenhum estabelecimento encontrado.</p>}
              {filtrados.length > LIMITE && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <button type="button" className="ot-btn ot-btn--secundario" onClick={() => setTodos((v) => !v)}>
                    {todos ? 'Mostrar menos' : `Mostrar todos (${filtrados.length})`}
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
