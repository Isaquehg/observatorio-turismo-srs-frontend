import { useState } from 'react'
import Icone from '../../componentes/Icone'
import { Selo } from '../../componentes/Basicos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { naoEnviaram } from '../../dados/painel'
import { mesAno, normalizar } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import RevisarEnvio from './RevisarEnvio'
import '../painel.css'

export function TabelaEnvios({ lista, aoRevisar, compacta = false }) {
  const { despachar } = useEnvios()
  const { avisar } = useAvisos()

  const aprovar = (e) => {
    despachar({ tipo: 'aprovar', id: e.id })
    avisar(`${e.nome} aprovado`, { texto: 'O dado entra no próximo cálculo dos indicadores.' })
  }

  return (
    <div className="ot-tabela-moldura">
      <table className="ot-tabela ot-tabela--cartoes">
        <thead>
          <tr>
            <th>Estabelecimento</th>
            <th>Período · recebido</th>
            <th className="ot-num">Ocupação</th>
            {!compacta && <th>Situação</th>}
            <th><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.nome}</strong>
                <span className="ot-tabela__sub">{e.tipo}</span>
                {compacta && e.problema && <Selo situacao="recusado" icone="alerta" className="selo-linha">{e.problema}</Selo>}
              </td>
              <td data-rotulo="Período">
                {mesAno(e.ano, e.mes)}
                {!compacta && <span className="ot-tabela__sub">{e.recebido}</span>}
              </td>
              <td className="ot-num" data-rotulo="Ocupação" style={e.problema ? { color: 'var(--erro)', fontWeight: 700 } : undefined}>
                {e.ocupacao == null ? '—' : `${e.ocupacao}%`}
              </td>
              {!compacta && (
                <td data-rotulo="Situação">
                  {e.problema && e.situacao === 'analise' ? (
                    <Selo situacao="recusado" icone="alerta">{e.problema}</Selo>
                  ) : (
                    <Selo situacao={e.situacao} />
                  )}
                  {e.atrasado && e.situacao === 'analise' && <span className="ot-tabela__sub">Há mais de 3 dias</span>}
                </td>
              )}
              <td className="ot-tabela__acoes">
                <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => aoRevisar(e)}>
                  {e.situacao === 'analise' ? 'Revisar' : 'Detalhes'}
                </button>
                {e.situacao === 'analise' && (
                  <button type="button" className="ot-btn ot-btn--solido ot-btn--p" disabled={!!e.problema} onClick={() => aprovar(e)} aria-label={`Aprovar envio de ${e.nome}`}>
                    <Icone nome="check" tamanho="s" /> Aprovar
                  </button>
                )}
                {e.situacao !== 'analise' && !compacta && (
                  <button
                    type="button"
                    className="ot-btn ot-btn--fantasma ot-btn--p"
                    onClick={() => {
                      despachar({ tipo: 'reabrir', id: e.id })
                      avisar('Envio reaberto', { texto: `${e.nome} voltou para a fila de validação.`, tipo: 'info' })
                    }}
                  >
                    Reabrir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Envios() {
  useTitulo('Validar envios')
  const { envios, pendentes } = useEnvios()
  const { avisar } = useAvisos()
  const [aba, setAba] = useState('analise')
  const [busca, setBusca] = useState('')
  const [revisando, setRevisando] = useState(null)

  const abas = [
    { id: 'analise', rotulo: 'Para validar', total: pendentes.length },
    { id: 'publicado', rotulo: 'Aprovados', total: envios.filter((e) => e.situacao === 'publicado').length },
    { id: 'recusado', rotulo: 'Devolvidos', total: envios.filter((e) => e.situacao === 'recusado').length },
    { id: 'faltam', rotulo: 'Não enviaram', total: naoEnviaram.length },
  ]

  const termo = normalizar(busca.trim())
  const lista = envios.filter((e) => e.situacao === aba && (!termo || normalizar(e.nome).includes(termo)))
  const faltam = naoEnviaram.filter((n) => !termo || normalizar(n).includes(termo))
  const atual = revisando && envios.find((e) => e.id === revisando.id)

  // Setas do teclado trocam de aba (padrão de tablist)
  const aoTeclar = (ev) => {
    const i = abas.findIndex((a) => a.id === aba)
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[ev.key]
    if (!passo) return
    const prox = abas[(i + passo + abas.length) % abas.length]
    setAba(prox.id)
    ev.currentTarget.querySelector(`#aba-${prox.id}`)?.focus()
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Painel da Prefeitura · SMCELT" titulo="Validar envios" cor="var(--ciano)" />

      <section className="ot-cartao" style={{ padding: '28px 28px 12px' }}>
        <div className="ot-cartao__cab" style={{ flexWrap: 'wrap' }}>
          <div>
            <h2 className="titulo-2">Envios dos estabelecimentos</h2>
            <p className="corpo-s suave">Nada é publicado antes da aprovação da equipe.</p>
          </div>
          <div className="ot-entrada-icone" style={{ width: 'min(100%, 320px)' }}>
            <Icone nome="busca" />
            <input className="ot-entrada" type="search" placeholder="Buscar estabelecimento" aria-label="Buscar estabelecimento" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>

        <div className="ot-abas" role="tablist" aria-label="Situação dos envios" onKeyDown={aoTeclar}>
          {abas.map((a) => (
            <button
              key={a.id}
              id={`aba-${a.id}`}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              aria-controls="painel-envios"
              tabIndex={aba === a.id ? 0 : -1}
              onClick={() => setAba(a.id)}
            >
              {a.rotulo} <span className="ot-num">({a.total})</span>
            </button>
          ))}
        </div>

        <div id="painel-envios" role="tabpanel" aria-labelledby={`aba-${aba}`}>
          {aba === 'faltam' ? (
            <>
              <ul className="faltam">
                {faltam.map((n) => (
                  <li key={n}>
                    <span>{n}</span>
                    <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => avisar('Lembrete enviado', { texto: `${n} recebe um e-mail com o link de envio.` })}>
                      <Icone nome="sino" tamanho="s" /> Lembrar
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ padding: '16px 0 12px' }}>
                <button type="button" className="ot-btn ot-btn--secundario" onClick={() => avisar('Lembretes enviados', { texto: `${faltam.length} estabelecimentos vão receber o aviso por e-mail.` })}>
                  <Icone nome="sino" /> Lembrar todos ({faltam.length})
                </button>
              </div>
            </>
          ) : lista.length ? (
            <TabelaEnvios lista={lista} aoRevisar={setRevisando} />
          ) : (
            <div className="ot-vazio">
              <span className="ot-vazio__icone ot-bolha" style={{ background: 'var(--ciano)' }}><Icone nome="check-circulo" tamanho="l" /></span>
              <h3 className="titulo-3">{aba === 'analise' && !termo ? 'Tudo validado!' : 'Nada por aqui'}</h3>
              <p className="corpo suave">{aba === 'analise' && !termo ? 'Não há envios esperando revisão. Bom trabalho.' : 'Nenhum envio corresponde a essa busca.'}</p>
            </div>
          )}
        </div>
        <p className="ot-fonte" style={{ margin: '12px 0 8px' }}>Estabelecimentos e valores de exemplo para o protótipo.</p>
      </section>

      <RevisarEnvio envio={atual} aoFechar={() => setRevisando(null)} />
    </div>
  )
}
