import { useState } from 'react'
import Icone from '../../componentes/Icone'
import { Aviso, Selo } from '../../componentes/Basicos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { mesAno, normalizar } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import RevisarEnvio from './RevisarEnvio'
import '../painel.css'

export function TabelaEnvios({ lista, aoRevisar, compacta = false }) {
  const { aprovarEnvio, reabrirEnvio } = useEnvios()
  const { avisar } = useAvisos()
  const [processandoId, setProcessandoId] = useState(null)

  const aprovar = async (e) => {
    if (e.temAlertasBloqueantes) {
      aoRevisar(e)
      return
    }
    setProcessandoId(e.id)
    try {
      await aprovarEnvio(e.id)
      avisar(`${e.nome} aprovado`, { texto: 'O dado entra no próximo cálculo dos indicadores.' })
    } catch (causa) {
      if (causa?.codigo === 'SUBMISSION_HAS_BLOCKING_ALERTS') {
        aoRevisar(e)
        avisar('Atenção: alertas bloqueantes', {
          texto: causa.message,
          tipo: 'alerta',
        })
      } else {
        avisar('Não foi possível aprovar', {
          texto: causa?.message || 'Recarregue a página e tente novamente.',
          tipo: 'erro',
        })
      }
    } finally {
      setProcessandoId(null)
    }
  }

  const reabrir = async (e) => {
    setProcessandoId(e.id)
    try {
      await reabrirEnvio(e.id)
      avisar('Envio reaberto', { texto: `${e.nome} voltou para a fila de validação.`, tipo: 'info' })
    } catch (causa) {
      avisar('Não foi possível reabrir', {
        texto: causa?.message || 'Verifique se o envio já está completo para revisão.',
        tipo: 'erro',
      })
    } finally {
      setProcessandoId(null)
    }
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
                {compacta && e.atrasado && <Selo situacao="analise" icone="relogio" className="selo-linha">Há mais de 3 dias</Selo>}
              </td>
              <td data-rotulo="Período">
                {mesAno(e.ano, e.mes)}
                {!compacta && <span className="ot-tabela__sub">{e.recebido}</span>}
              </td>
              <td className="ot-num" data-rotulo="Ocupação" style={e.ocupacao != null && e.ocupacao >= 95 ? { color: 'var(--erro)', fontWeight: 700 } : undefined}>
                {e.ocupacao == null ? '—' : `${e.ocupacao}%`}
              </td>
              {!compacta && (
                <td data-rotulo="Situação">
                  <Selo situacao={e.situacao} />
                  {e.atrasado && e.situacao === 'analise' && <span className="ot-tabela__sub">Há mais de 3 dias</span>}
                </td>
              )}
              <td className="ot-tabela__acoes">
                <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" disabled={processandoId === e.id} onClick={() => aoRevisar(e)}>
                  {e.situacao === 'analise' ? 'Revisar' : 'Detalhes'}
                </button>
                {e.situacao === 'analise' && (
                  <button
                    type="button"
                    className="ot-btn ot-btn--solido ot-btn--p"
                    disabled={processandoId === e.id}
                    aria-busy={processandoId === e.id}
                    onClick={() => aprovar(e)}
                    aria-label={`Aprovar envio de ${e.nome}`}
                  >
                    <Icone nome="check" tamanho="s" /> Aprovar
                  </button>
                )}
                {e.situacao !== 'analise' && !compacta && (
                  <button
                    type="button"
                    className="ot-btn ot-btn--fantasma ot-btn--p"
                    disabled={processandoId === e.id}
                    onClick={() => reabrir(e)}
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
  const {
    envios,
    pendentes,
    faltantes,
    carregando,
    erro,
    recarregar,
    enviarLembrete,
  } = useEnvios()
  const { avisar } = useAvisos()
  const [aba, setAba] = useState('analise')
  const [busca, setBusca] = useState('')
  const [revisando, setRevisando] = useState(null)
  const [enviandoLembreteId, setEnviandoLembreteId] = useState(null)

  const abas = [
    { id: 'analise', rotulo: 'Para validar', total: pendentes.length },
    { id: 'publicado', rotulo: 'Aprovados', total: envios.filter((e) => e.situacao === 'publicado').length },
    { id: 'recusado', rotulo: 'Devolvidos', total: envios.filter((e) => e.situacao === 'recusado').length },
    { id: 'faltam', rotulo: 'Não enviaram', total: faltantes.length },
  ]

  const termo = normalizar(busca.trim())
  const lista = envios.filter(
    (e) =>
      e.situacao === aba &&
      (!termo || normalizar(`${e.nome} ${e.cnpj}`).includes(termo)),
  )
  const faltamFiltrados = faltantes.filter(
    (item) => !termo || normalizar(`${item.nome} ${item.cnpj}`).includes(termo),
  )
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

  const lembrarIndividual = async (item) => {
    setEnviandoLembreteId(item.id)
    try {
      const resultado = await enviarLembrete([item.id])
      const registro = resultado?.reminders?.[0]
      if (registro?.status === 'failed') {
        avisar('Lembrete não enviado', {
          texto: registro.error || `${item.nome} não possui e-mail vinculado.`,
          tipo: 'alerta',
        })
      } else {
        avisar('Lembrete enviado', {
          texto: `${item.nome} recebe um e-mail com o link de envio.`,
        })
      }
    } catch (causa) {
      avisar('Erro ao enviar lembrete', {
        texto: causa?.message || 'Não foi possível disparar o lembrete agora.',
        tipo: 'erro',
      })
    } finally {
      setEnviandoLembreteId(null)
    }
  }

  const lembrarTodos = async () => {
    setEnviandoLembreteId('todos')
    try {
      const resultado = await enviarLembrete()
      const total = resultado?.reminders?.length ?? faltamFiltrados.length
      avisar('Lembretes enviados', {
        texto: `${total} estabelecimento(s) programado(s) para receber o aviso por e-mail.`,
      })
    } catch (causa) {
      avisar('Erro ao enviar lembretes', {
        texto: causa?.message || 'Não foi possível disparar os lembretes em lote.',
        tipo: 'erro',
      })
    } finally {
      setEnviandoLembreteId(null)
    }
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
          {carregando ? (
            <div className="ot-vazio" role="status" aria-live="polite">
              <span className="girando" aria-hidden="true" />
              <p className="corpo suave">Carregando envios…</p>
            </div>
          ) : erro ? (
            <Aviso tipo="erro" style={{ marginBlock: 16 }} titulo="Não foi possível carregar os envios">
              {erro}{' '}
              <button type="button" className="link-botao" onClick={recarregar}>
                Tentar novamente
              </button>
            </Aviso>
          ) : aba === 'faltam' ? (
            faltamFiltrados.length > 0 ? (
              <>
                <ul className="faltam">
                  {faltamFiltrados.map((item) => (
                    <li key={item.id}>
                      <div>
                        <span>{item.nome}</span>
                        {item.ultimoLembrete && (
                          <span className="ot-tabela__sub">
                            Último lembrete: {item.ultimoLembrete.enviadoEm}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ot-btn ot-btn--fantasma ot-btn--p"
                        disabled={enviandoLembreteId === item.id || enviandoLembreteId === 'todos'}
                        onClick={() => lembrarIndividual(item)}
                      >
                        <Icone nome="sino" tamanho="s" /> Lembrar
                      </button>
                    </li>
                  ))}
                </ul>
                <div style={{ padding: '16px 0 12px' }}>
                  <button
                    type="button"
                    className="ot-btn ot-btn--secundario"
                    disabled={enviandoLembreteId !== null}
                    aria-busy={enviandoLembreteId === 'todos'}
                    onClick={lembrarTodos}
                  >
                    <Icone nome="sino" /> Lembrar todos ({faltamFiltrados.length})
                  </button>
                </div>
              </>
            ) : (
              <div className="ot-vazio">
                <span className="ot-vazio__icone ot-bolha" style={{ background: 'var(--ciano)' }}><Icone nome="check-circulo" tamanho="l" /></span>
                <h3 className="titulo-3">{termo ? 'Nada por aqui' : 'Todos enviaram!'}</h3>
                <p className="corpo suave">
                  {termo ? 'Nenhum estabelecimento corresponde a essa busca.' : 'Não há estabelecimentos pendentes para o período.'}
                </p>
              </div>
            )
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
      </section>

      <RevisarEnvio envio={atual} aoFechar={() => setRevisando(null)} />
    </div>
  )
}
