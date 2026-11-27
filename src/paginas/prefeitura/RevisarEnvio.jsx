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

// Review dialog: fetches full backend details + consistency alerts and allows approve/return
export default function RevisarEnvio({ envio, aoFechar, modoInicial = 'ver' }) {
  const { carregarDetalhesAdmin, aprovarEnvio, devolverEnvio } = useEnvios()
  const { avisar } = useAvisos()
  const [modo, setModo] = useState(modoInicial)
  const [motivo, setMotivo] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [erro, setErro] = useState('')
  const [erroApi, setErroApi] = useState('')
  const [detalhe, setDetalhe] = useState(envio)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  const [enviandoAcao, setEnviandoAcao] = useState(false)

  useEffect(() => {
    setModo(modoInicial)
    setMotivo('')
    setJustificativa('')
    setErro('')
    setErroApi('')
    setDetalhe(envio)
  }, [envio, modoInicial])

  // Fetches real consistency alerts from GET /api/admin/submissions/:id when opening the dialog
  useEffect(() => {
    if (!envio?.id) return
    let ativo = true
    setCarregandoDetalhes(true)

    carregarDetalhesAdmin(envio.id)
      .then((completo) => {
        if (!ativo || !completo) return
        setDetalhe(completo)
      })
      .catch(() => {
        // Keeps the summary data already loaded from the list if details fail
      })
      .finally(() => {
        if (ativo) setCarregandoDetalhes(false)
      })

    return () => {
      ativo = false
    }
  }, [envio?.id, carregarDetalhesAdmin])

  if (!envio) return <Dialogo aberto={false} aoFechar={aoFechar} />

  const atual = detalhe || envio
  const alertas = Array.isArray(atual.alertas) ? atual.alertas : []
  const temBloqueante =
    Boolean(atual.temAlertasBloqueantes) || alertas.some((a) => a.severity === 'blocking')

  const aprovar = async (comRessalva = false) => {
    if (temBloqueante && !comRessalva) {
      setErro('')
      setErroApi('')
      setModo('aprovar-ressalva')
      return
    }
    if (comRessalva && justificativa.trim().length < 10) {
      setErro('Informe uma justificativa com ao menos 10 caracteres para aprovar com ressalvas.')
      return
    }

    setEnviandoAcao(true)
    setErroApi('')
    try {
      await aprovarEnvio(
        atual.id,
        comRessalva ? { override: true, justification: justificativa.trim() } : undefined,
      )
      avisar(`${atual.nome} aprovado`, { texto: 'O dado entra no próximo cálculo dos indicadores.' })
      aoFechar()
    } catch (causa) {
      if (causa?.codigo === 'SUBMISSION_HAS_BLOCKING_ALERTS') {
        setModo('aprovar-ressalva')
        setErroApi(causa.message)
      } else {
        setErroApi(causa?.message || 'Não foi possível aprovar o envio.')
      }
    } finally {
      setEnviandoAcao(false)
    }
  }

  const devolver = async () => {
    if (motivo.trim().length < 10) {
      setErro('Explique o motivo em poucas palavras (mínimo de 10 caracteres) — o estabelecimento vai ler isso.')
      return
    }
    setEnviandoAcao(true)
    setErroApi('')
    try {
      await devolverEnvio(atual.id, motivo.trim())
      avisar(`Envio devolvido para ${atual.nome}`, { texto: 'O estabelecimento recebe o motivo por e-mail.', tipo: 'alerta' })
      aoFechar()
    } catch (causa) {
      setErroApi(causa?.message || 'Não foi possível devolver o envio.')
    } finally {
      setEnviandoAcao(false)
    }
  }

  const dias = new Date(atual.ano, atual.mes, 0).getDate() || 30
  const quartosPorNoite = atual.diarias != null ? Math.round(atual.diarias / dias) : null

  return (
    <Dialogo
      aberto
      aoFechar={() => !enviandoAcao && aoFechar()}
      titulo={
        modo === 'devolver'
          ? 'Devolver para correção'
          : modo === 'aprovar-ressalva'
            ? 'Aprovar com justificativa'
            : atual.nome
      }
      largura={600}
      acoes={
        atual.situacao !== 'analise' ? (
          <button type="button" className="ot-btn ot-btn--secundario" onClick={aoFechar}>Fechar</button>
        ) : modo === 'devolver' ? (
          <>
            <button type="button" className="ot-btn ot-btn--secundario" disabled={enviandoAcao} onClick={() => setModo('ver')}>Voltar</button>
            <button type="button" className="ot-btn ot-btn--perigo" disabled={enviandoAcao} aria-busy={enviandoAcao} onClick={devolver}>
              <Icone nome="devolver" /> {enviandoAcao ? 'Devolvendo…' : 'Devolver envio'}
            </button>
          </>
        ) : modo === 'aprovar-ressalva' ? (
          <>
            <button type="button" className="ot-btn ot-btn--secundario" disabled={enviandoAcao} onClick={() => { setErro(''); setErroApi(''); setModo('ver') }}>Voltar</button>
            <button type="button" className="ot-btn ot-btn--solido" disabled={enviandoAcao} aria-busy={enviandoAcao} onClick={() => aprovar(true)}>
              <Icone nome="check" /> {enviandoAcao ? 'Aprovando…' : 'Confirmar aprovação'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ot-btn ot-btn--perigo" disabled={enviandoAcao} onClick={() => setModo('devolver')}>
              <Icone nome="devolver" /> Devolver
            </button>
            <button type="button" className="ot-btn ot-btn--solido" disabled={enviandoAcao} aria-busy={enviandoAcao} onClick={() => aprovar(false)}>
              <Icone nome="check" /> {enviandoAcao ? 'Aprovando…' : 'Aprovar'}
            </button>
          </>
        )
      }
    >
      {modo === 'ver' ? (
        <>
          <div className="linha-acoes">
            <Selo situacao={atual.situacao} />
            <span className="corpo-s suave">{atual.tipo} · {mesAno(atual.ano, atual.mes)} · recebido {atual.recebido}</span>
          </div>
          <dl className="ficha">
            <div><dt>Taxa de ocupação</dt><dd className="ot-num" data-alerta={atual.ocupacao != null && atual.ocupacao >= 95}>{atual.ocupacao == null ? '—' : `${atual.ocupacao}%`}</dd></div>
            <div><dt>Diárias vendidas</dt><dd className="ot-num">{numero(atual.diarias)}</dd></div>
            <div><dt>Leitos</dt><dd className="ot-num">{numero(atual.leitos)}</dd></div>
            <div><dt>Quartos ocupados por noite</dt><dd className="ot-num">{quartosPorNoite == null ? '—' : numero(quartosPorNoite)}</dd></div>
            {atual.hospedes != null && <div><dt>Hóspedes</dt><dd className="ot-num">{numero(atual.hospedes)}</dd></div>}
            {atual.funcionarios != null && <div><dt>Funcionários</dt><dd className="ot-num">{numero(atual.funcionarios)}</dd></div>}
          </dl>
          {atual.observacoes && (
            <Aviso tipo="info" titulo="Observações do estabelecimento">{atual.observacoes}</Aviso>
          )}
          {carregandoDetalhes && (
            <p className="corpo-s suave" role="status">Verificando alertas de consistência…</p>
          )}
          {!carregandoDetalhes && alertas.length > 0 && (
            <Aviso
              tipo={temBloqueante ? 'erro' : 'alerta'}
              titulo={`Alertas de consistência (${alertas.length})`}
            >
              {alertas.map((alerta) => (
                <span key={`${alerta.code}-${alerta.field || 'geral'}`} style={{ display: 'block' }}>
                  {alerta.severity === 'blocking' ? 'Bloqueante: ' : ''}
                  {alerta.message}
                </span>
              ))}
            </Aviso>
          )}
          {atual.motivo && <Aviso tipo="alerta" titulo="Motivo da devolução">{atual.motivo}</Aviso>}
          {!carregandoDetalhes && alertas.length === 0 && atual.situacao === 'analise' && (
            <Aviso tipo="sucesso" titulo="Nada fora do esperado">Os números estão dentro da faixa dos meses anteriores.</Aviso>
          )}
          {erroApi && <Aviso tipo="erro" titulo="Erro na operação">{erroApi}</Aviso>}
        </>
      ) : modo === 'aprovar-ressalva' ? (
        <>
          <Aviso tipo="alerta" titulo="Este envio possui alertas bloqueantes">
            A aprovação exige uma justificativa registrada para auditoria, ou devolva o envio ao estabelecimento para correção.
          </Aviso>
          <div className="ot-campo">
            <label className="ot-rotulo" htmlFor="justificativa-aprovacao">Justificativa da aprovação</label>
            <textarea
              id="justificativa-aprovacao"
              className="ot-entrada"
              value={justificativa}
              onChange={(e) => { setJustificativa(e.target.value); setErro('') }}
              aria-invalid={!!erro}
            />
            {erro && <span className="ot-ajuda ot-ajuda--erro"><Icone nome="alerta" tamanho="s" /> {erro}</span>}
          </div>
          {erroApi && <Aviso tipo="erro" titulo="Erro na operação">{erroApi}</Aviso>}
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
          {erroApi && <Aviso tipo="erro" titulo="Erro na operação">{erroApi}</Aviso>}
        </>
      )}
    </Dialogo>
  )
}
