import { useEffect, useState } from 'react'
import Icone from '../../componentes/Icone'
import { Aviso, Dialogo, Selo } from '../../componentes/Basicos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { mesAno, numero } from '../../util/formatar'

const MOTIVOS_PRONTOS = [
  'Ocupação acima de 100%: confira diárias e quartos.',
  'O número de leitos estava maior que a capacidade cadastrada.',
  'Faltou informar o número de funcionários.',
]

// Diálogo de revisão: mostra o envio e permite aprovar ou devolver com motivo
export default function RevisarEnvio({ envio, aoFechar, modoInicial = 'ver' }) {
  const { despachar } = useEnvios()
  const { avisar } = useAvisos()
  const [modo, setModo] = useState(modoInicial)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    setModo(modoInicial)
    setMotivo(envio?.problema === 'Acima de 100%' ? MOTIVOS_PRONTOS[0] : '')
    setErro('')
  }, [envio, modoInicial])

  if (!envio) return <Dialogo aberto={false} aoFechar={aoFechar} />

  const aprovar = () => {
    despachar({ tipo: 'aprovar', id: envio.id })
    avisar(`${envio.nome} aprovado`, { texto: 'O dado entra no próximo cálculo dos indicadores.' })
    aoFechar()
  }

  const devolver = () => {
    if (motivo.trim().length < 10) {
      setErro('Explique o motivo em poucas palavras — o estabelecimento vai ler isso.')
      return
    }
    despachar({ tipo: 'devolver', id: envio.id, motivo: motivo.trim() })
    avisar(`Envio devolvido para ${envio.nome}`, { texto: 'O estabelecimento recebe o motivo por e-mail.', tipo: 'alerta' })
    aoFechar()
  }

  const quartosPorNoite = Math.round(envio.diarias / 30)

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={modo === 'devolver' ? 'Devolver para correção' : envio.nome}
      largura={600}
      acoes={
        envio.situacao !== 'analise' ? (
          <button type="button" className="ot-btn ot-btn--secundario" onClick={aoFechar}>Fechar</button>
        ) : modo === 'devolver' ? (
          <>
            <button type="button" className="ot-btn ot-btn--secundario" onClick={() => setModo('ver')}>Voltar</button>
            <button type="button" className="ot-btn ot-btn--perigo" onClick={devolver}><Icone nome="devolver" /> Devolver envio</button>
          </>
        ) : (
          <>
            <button type="button" className="ot-btn ot-btn--perigo" onClick={() => setModo('devolver')}><Icone nome="devolver" /> Devolver</button>
            <button type="button" className="ot-btn ot-btn--solido" onClick={aprovar} disabled={!!envio.problema}>
              <Icone nome="check" /> Aprovar
            </button>
          </>
        )
      }
    >
      {modo === 'ver' ? (
        <>
          <div className="linha-acoes">
            <Selo situacao={envio.situacao} />
            <span className="corpo-s suave">{envio.tipo} · {mesAno(envio.ano, envio.mes)} · recebido {envio.recebido.toLowerCase()}</span>
          </div>
          <dl className="ficha">
            <div><dt>Taxa de ocupação</dt><dd className="ot-num" data-alerta={envio.ocupacao > 100}>{envio.ocupacao}%</dd></div>
            <div><dt>Diárias vendidas</dt><dd className="ot-num">{numero(envio.diarias)}</dd></div>
            <div><dt>Leitos</dt><dd className="ot-num">{numero(envio.leitos)}</dd></div>
            <div><dt>Quartos ocupados por noite</dt><dd className="ot-num">{quartosPorNoite}</dd></div>
          </dl>
          {envio.problema && (
            <Aviso tipo="erro" titulo="Revise antes de aprovar">
              A ocupação passou de 100%. Provavelmente as diárias foram somadas por hóspede, e não por quarto.
            </Aviso>
          )}
          {envio.motivo && <Aviso tipo="alerta" titulo="Motivo da devolução">{envio.motivo}</Aviso>}
          {!envio.problema && envio.situacao === 'analise' && (
            <Aviso tipo="sucesso" titulo="Nada fora do esperado">Os números estão dentro da faixa dos meses anteriores.</Aviso>
          )}
        </>
      ) : (
        <>
          <p className="corpo suave">O estabelecimento recebe este texto e pode corrigir o envio pela área do comerciante.</p>
          <div className="pilha" style={{ gap: 8 }}>
            <span className="ot-rotulo">Motivos comuns</span>
            <div className="linha-acoes" style={{ gap: 8 }}>
              {MOTIVOS_PRONTOS.map((m) => (
                <button key={m} type="button" className="ot-chip" aria-pressed={motivo === m} onClick={() => { setMotivo(m); setErro('') }} style={{ whiteSpace: 'normal', textAlign: 'left', paddingBlock: 8 }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="ot-campo">
            <label className="ot-rotulo" htmlFor="motivo-devolucao">Motivo da devolução</label>
            <textarea id="motivo-devolucao" className="ot-entrada" value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro('') }} aria-invalid={!!erro} />
            {erro && <span className="ot-ajuda ot-ajuda--erro"><Icone nome="alerta" tamanho="s" /> {erro}</span>}
          </div>
        </>
      )}
    </Dialogo>
  )
}
