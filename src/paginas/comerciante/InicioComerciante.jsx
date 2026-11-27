import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Adesivo } from '../../componentes/Adesivo'
import { Aviso, Selo, Sobretitulo } from '../../componentes/Basicos'
import { BarraComparacao } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useSessao } from '../../contexto/Sessao'
import { formatarDataSegura } from '../../util/indicadoresApi'
import { iniciais, MESES_LONGOS, mesAno, mesAnoLongo, numero } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { periodoAtual, historicoCompleto } from './prazo'
import '../painel.css'

export function TopoPainel({ sobretitulo, titulo, children, cor = 'var(--rosa)' }) {
  const { sessao } = useSessao()
  const sigla = sessao.perfil === 'prefeitura' ? 'ST' : iniciais(sessao.nome || '') || 'OT'
  return (
    <header className="painel__topo">
      <div>
        <Sobretitulo>{sobretitulo}</Sobretitulo>
        <h1 className="titulo-1">{titulo}</h1>
      </div>
      <div className="painel__topo-acoes">
        {children}
        <span className="ot-usuario">
          <span className="ot-usuario__avatar" style={{ '--cor': cor }}>{sigla}</span>
          {sessao.nome}
        </span>
      </div>
    </header>
  )
}

function resolverPeriodoPainel(painelComerciante) {
  const padrao = periodoAtual()
  if (!painelComerciante?.current_period) return padrao

  const [ano, mes] = String(painelComerciante.current_period).split('-').map(Number)
  if (!ano || !mes) return padrao

  const prazo = painelComerciante.submission_deadline
    ? new Date(`${painelComerciante.submission_deadline}T23:59:00`)
    : padrao.prazo
  const dias = Math.ceil((prazo - new Date()) / 86400000)
  return {
    ano,
    mes,
    prazo,
    diasRestantes: Math.max(dias, 0),
    encerrado: dias < 0,
  }
}

export default function InicioComerciante() {
  useTitulo('Área do comerciante')
  const { sessao } = useSessao()
  const { envios, estabelecimento, painelComerciante, carregando, erro, recarregar } = useEnvios()
  const historico = historicoCompleto(envios)
  const periodo = resolverPeriodoPainel(painelComerciante)

  const nomeNegocio = estabelecimento?.trade_name || sessao?.nome || 'Meu estabelecimento'
  const tipoNegocio = (estabelecimento?.type || 'Estabelecimento').toLowerCase()
  const enviadoAgora = historico.find(
    (h) => h.ano === periodo.ano && h.mes === periodo.mes && h.situacao !== 'rascunho',
  )
  const rascunhoAgora = historico.find(
    (h) => h.ano === periodo.ano && h.mes === periodo.mes && h.situacao === 'rascunho',
  )
  const ultimoPublicado = historico.find((h) => h.situacao === 'publicado' && h.ocupacao != null)
  const devolvido = historico.find((h) => h.situacao === 'recusado')
  const nomeMes = MESES_LONGOS[periodo.mes - 1]
  const enviosDoAno = historico.filter((h) => h.ano === periodo.ano && h.situacao !== 'rascunho')
  const publicadosDoAno = enviosDoAno.filter((h) => h.situacao === 'publicado').length

  const validadeCadastur = formatarDataSegura(estabelecimento?.cadastur_expires_at)
  const cadasturAtivo = painelComerciante?.cadastur_active ?? estabelecimento?.cadastur_status === 'active'
  const diferencaTipo =
    ultimoPublicado && ultimoPublicado.mediaTipo != null
      ? ultimoPublicado.ocupacao - ultimoPublicado.mediaTipo
      : null

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo={`Olá, ${nomeNegocio}`} />

      {carregando && (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando seus envios…</p>
        </div>
      )}

      {!carregando && erro && (
        <Aviso tipo="erro" titulo="Não foi possível carregar seus envios">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={recarregar}>
            Tentar novamente
          </button>
        </Aviso>
      )}

      {!carregando && !erro && (
        <>
          {enviadoAgora ? (
            <div className="faixa faixa--ok">
              <img src="ilustracoes/comerciante.svg" alt="" className="faixa__arte" />
              <div className="faixa__texto">
                <p className="titulo-2">Pronto! Os dados de {nomeMes} estão com a Prefeitura</p>
                <p className="corpo" style={{ marginTop: 6 }}>Avisamos por e-mail assim que a equipe da SMCELT revisar. Normalmente leva até 3 dias úteis.</p>
              </div>
              <Selo situacao={enviadoAgora.situacao} className="faixa__selo" />
              <Adesivo tipo="brilho" cor="#FFFFFF" tamanho={34} style={{ right: 28, top: 20 }} />
            </div>
          ) : (
            <div className="faixa">
              <img src="ilustracoes/comerciante.svg" alt="" className="faixa__arte" />
              <div className="faixa__texto">
                <p className="titulo-2">
                  Falta pouco: envie os dados de <span className="ot-marca ot-marca--bloco" style={{ background: 'var(--superficie)' }}>{nomeMes}</span>
                </p>
                <p className="corpo" style={{ marginTop: 6 }}>
                  {periodo.encerrado
                    ? 'O prazo terminou, mas ainda dá para enviar.'
                    : <>Prazo até <strong>10 de {MESES_LONGOS[periodo.prazo.getMonth()]}</strong>. Leva cerca de 3 minutos.</>}
                </p>
                <Link
                  to={
                    rascunhoAgora
                      ? `/comerciante/enviar?id=${rascunhoAgora.id}&ano=${rascunhoAgora.ano}&mes=${rascunhoAgora.mes}`
                      : '/comerciante/enviar'
                  }
                  className="ot-btn ot-btn--solido faixa__botao"
                >
                  {rascunhoAgora ? 'Continuar rascunho' : 'Enviar agora'} <Icone nome="seta" />
                </Link>
              </div>
              {!periodo.encerrado && (
                <div className="faixa__prazo" aria-label={`${periodo.diasRestantes} dias restantes`}>
                  <span className="ot-num">{periodo.diasRestantes}</span>
                  <span>dias<br />restantes</span>
                </div>
              )}
              <Adesivo tipo="explosao" cor="var(--amarelo)" tamanho={70} style={{ right: -20, bottom: -26 }} />
            </div>
          )}

          <div className="grade-4 grade-4--compacta" style={{ marginTop: 24 }}>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>
                {ultimoPublicado ? `Ocupação · ${MESES_LONGOS[ultimoPublicado.mes - 1]}` : 'Última ocupação'}
              </span>
              <span className="ot-mini__v ot-num">
                {ultimoPublicado ? `${ultimoPublicado.ocupacao}%` : '—'}
              </span>
              <span className="corpo-s suave">
                {ultimoPublicado?.mediaCidade != null
                  ? `Cidade: ${ultimoPublicado.mediaCidade}%`
                  : 'Média municipal indisponível'}
              </span>
            </div>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Hóspedes no mês</span>
              <span className="ot-mini__v ot-num">
                {ultimoPublicado ? numero(ultimoPublicado.hospedes) : '—'}
              </span>
              <span className="corpo-s suave">
                {ultimoPublicado ? mesAno(ultimoPublicado.ano, ultimoPublicado.mes) : 'Sem envio publicado'}
              </span>
            </div>
            <div className="ot-mini">
              <span className="corpo-s" style={{ fontWeight: 700 }}>Diárias vendidas</span>
              <span className="ot-mini__v ot-num">
                {ultimoPublicado ? numero(ultimoPublicado.diarias) : '—'}
              </span>
              <span className="corpo-s suave">
                {estabelecimento?.rooms_count != null
                  ? `${estabelecimento.rooms_count} quartos`
                  : 'Capacidade não informada'}
              </span>
            </div>
            <div className="ot-mini" style={{ background: 'var(--amarelo)' }}>
              <span className="corpo-s" style={{ fontWeight: 700 }}>Envios em dia</span>
              <span className="ot-mini__v ot-num">
                {publicadosDoAno}/{enviosDoAno.length}
              </span>
              <span className="corpo-s">em {periodo.ano}</span>
            </div>
          </div>

          <div className="painel__grade">
            <section className="ot-cartao" style={{ padding: 28 }}>
              <h2 className="titulo-3">Você e a cidade</h2>
              {ultimoPublicado ? (
                <>
                  <p className="corpo-s suave" style={{ marginTop: 4 }}>
                    Ocupação em {mesAnoLongo(ultimoPublicado.ano, ultimoPublicado.mes)}
                  </p>
                  <BarraComparacao rotulo="Seu estabelecimento" valor={ultimoPublicado.ocupacao} cor="var(--roxo)" />
                  <BarraComparacao rotulo="Média do setor" valor={ultimoPublicado.mediaTipo} cor="var(--lilas)" />
                  <BarraComparacao rotulo="Média da cidade" valor={ultimoPublicado.mediaCidade} cor="var(--azul-ceu)" />
                  {diferencaTipo != null ? (
                    <Aviso
                      tipo={diferencaTipo >= 0 ? 'sucesso' : 'info'}
                      icone="estrela"
                      style={{ marginTop: 20 }}
                      titulo={
                        diferencaTipo >= 0
                          ? `${diferencaTipo} pontos acima da média do setor`
                          : `${Math.abs(diferencaTipo)} pontos abaixo da média do setor`
                      }
                    >
                      Comparação calculada com os envios aprovados de {mesAnoLongo(ultimoPublicado.ano, ultimoPublicado.mes)} para {tipoNegocio}.
                    </Aviso>
                  ) : (
                    <Aviso tipo="info" style={{ marginTop: 20 }} titulo="Comparativo protegido por sigilo">
                      As médias do setor e da cidade aparecem quando há ao menos 5 estabelecimentos com envios aprovados no mês.
                    </Aviso>
                  )}
                  <Link className="ot-btn ot-btn--fantasma ot-btn--p" to="/comerciante/historico" style={{ marginTop: 12, marginLeft: -12 }}>
                    Ver comparação completa <Icone nome="seta" tamanho="s" />
                  </Link>
                </>
              ) : (
                <div className="ot-vazio" style={{ paddingBlock: 32 }}>
                  <span className="ot-vazio__icone ot-bolha"><Icone nome="grafico" tamanho="l" /></span>
                  <h3 className="titulo-3">Sem envios aprovados ainda</h3>
                  <p className="corpo suave">
                    Assim que a SMCELT aprovar seu primeiro envio mensal, o comparativo com a cidade aparece aqui.
                  </p>
                </div>
              )}
            </section>

            <div className="pilha" style={{ gap: 20 }}>
              <section className="ot-cartao" style={{ padding: 28 }}>
                <h2 className="titulo-3">Últimos envios</h2>
                {historico.length > 0 ? (
                  <ul className="historico">
                    {historico.slice(0, 4).map((h) => (
                      <li key={h.id || `${h.ano}-${h.mes}`}>
                        <div>
                          <strong>{mesAno(h.ano, h.mes)}</strong>
                          <span className="corpo-s suave" style={{ display: 'block' }}>
                            Ocupação {h.ocupacao == null ? '—' : `${h.ocupacao}%`} · enviado em {h.enviadoEm}
                          </span>
                        </div>
                        {h.situacao === 'rascunho' ? (
                          <Selo situacao="analise" icone="lapis">Rascunho</Selo>
                        ) : (
                          <Selo situacao={h.situacao} />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="corpo suave" style={{ marginTop: 12 }}>
                    Você ainda não enviou nenhum mês.
                  </p>
                )}
                {devolvido && (
                  <Aviso
                    tipo="erro"
                    style={{ marginTop: 12, fontSize: '1rem', lineHeight: 1.5 }}
                    titulo={`${MESES_LONGOS[devolvido.mes - 1].replace(/^./, (l) => l.toUpperCase())} foi devolvido`}
                  >
                    {devolvido.motivo}{' '}
                    <Link to={`/comerciante/enviar?id=${devolvido.id}&ano=${devolvido.ano}&mes=${devolvido.mes}`}>
                      Corrigir envio
                    </Link>
                  </Aviso>
                )}
              </section>
              <section className="ot-cartao cadastur-mini">
                <span className="ot-indicador__icone" style={{ '--cor': 'var(--ciano)' }}><Icone nome="escudo" /></span>
                <div style={{ flex: 1 }}>
                  <strong>{cadasturAtivo ? 'Cadastur ativo' : 'Cadastur pendente'}</strong>
                  <p className="corpo-s suave">
                    {validadeCadastur ? `Válido até ${validadeCadastur}` : 'Consulte a situação no guia abaixo'}
                  </p>
                </div>
                <Link className="ot-btn ot-btn--fantasma ot-btn--p" to="/comerciante/guia">Ver guia</Link>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
