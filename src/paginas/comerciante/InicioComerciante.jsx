import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Adesivo } from '../../componentes/Adesivo'
import { Aviso, Selo, Sobretitulo } from '../../componentes/Basicos'
import { BarraComparacao } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useSessao } from '../../contexto/Sessao'
import { MEU_NEGOCIO } from '../../dados/painel'
import { MESES_LONGOS, mesAno, mesAnoLongo, numero } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { periodoAtual, historicoCompleto } from './prazo'
import '../painel.css'

export function TopoPainel({ sobretitulo, titulo, children, cor = 'var(--rosa)' }) {
  const { sessao } = useSessao()
  return (
    <header className="painel__topo">
      <div>
        <Sobretitulo>{sobretitulo}</Sobretitulo>
        <h1 className="titulo-1">{titulo}</h1>
      </div>
      <div className="painel__topo-acoes">
        {children}
        <span className="ot-usuario">
          <span className="ot-usuario__avatar" style={{ '--cor': cor }}>{sessao.perfil === 'prefeitura' ? 'ST' : 'RS'}</span>
          {sessao.nome}
        </span>
      </div>
    </header>
  )
}

export default function InicioComerciante() {
  useTitulo('Área do comerciante')
  const { envios } = useEnvios()
  const historico = historicoCompleto(envios)
  const periodo = periodoAtual()
  const enviadoAgora = historico.find((h) => h.ano === periodo.ano && h.mes === periodo.mes)
  const ultimoPublicado = historico.find((h) => h.situacao === 'publicado' && h.ocupacao != null)
  const devolvido = historico.find((h) => h.situacao === 'recusado')
  const nomeMes = MESES_LONGOS[periodo.mes - 1]

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo={`Olá, ${MEU_NEGOCIO.nome}`} />

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
              {periodo.encerrado ? 'O prazo terminou, mas ainda dá para enviar.' : <>Prazo até <strong>10 de {MESES_LONGOS[periodo.prazo.getMonth()]}</strong>. Leva cerca de 3 minutos.</>}
            </p>
            <Link to="/comerciante/enviar" className="ot-btn ot-btn--solido faixa__botao">
              Enviar agora <Icone nome="seta" />
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
          <span className="corpo-s" style={{ fontWeight: 700 }}>Ocupação · {MESES_LONGOS[ultimoPublicado.mes - 1]}</span>
          <span className="ot-mini__v ot-num">{ultimoPublicado.ocupacao}%</span>
          <span className="corpo-s suave">Cidade: {ultimoPublicado.mediaCidade}%</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Hóspedes no mês</span>
          <span className="ot-mini__v ot-num">{numero(ultimoPublicado.hospedes)}</span>
          <span className="corpo-s suave">{mesAno(ultimoPublicado.ano, ultimoPublicado.mes)}</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Diárias vendidas</span>
          <span className="ot-mini__v ot-num">{numero(ultimoPublicado.diarias)}</span>
          <span className="corpo-s suave">{MEU_NEGOCIO.quartos} quartos</span>
        </div>
        <div className="ot-mini" style={{ background: 'var(--amarelo)' }}>
          <span className="corpo-s" style={{ fontWeight: 700 }}>Envios em dia</span>
          <span className="ot-mini__v ot-num">{historico.filter((h) => h.situacao === 'publicado').length}/{historico.length}</span>
          <span className="corpo-s">em {periodo.ano}</span>
        </div>
      </div>

      <div className="painel__grade">
        <section className="ot-cartao" style={{ padding: 28 }}>
          <h2 className="titulo-3">Você e a cidade</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Ocupação em {mesAnoLongo(ultimoPublicado.ano, ultimoPublicado.mes)}</p>
          <BarraComparacao rotulo="Sua pousada" valor={ultimoPublicado.ocupacao} cor="var(--roxo)" />
          <BarraComparacao rotulo="Média das pousadas" valor={ultimoPublicado.mediaTipo} cor="var(--lilas)" />
          <BarraComparacao rotulo="Média da cidade" valor={ultimoPublicado.mediaCidade} cor="var(--azul-ceu)" />
          <Aviso tipo="sucesso" icone="estrela" style={{ marginTop: 20 }} titulo={`${ultimoPublicado.ocupacao - ultimoPublicado.mediaTipo} pontos acima das pousadas`}>
            Seu melhor resultado desde janeiro. Agosto costuma ser o mês mais cheio da cidade.
          </Aviso>
          <Link className="ot-btn ot-btn--fantasma ot-btn--p" to="/comerciante/historico" style={{ marginTop: 12, marginLeft: -12 }}>
            Ver comparação completa <Icone nome="seta" tamanho="s" />
          </Link>
        </section>

        <div className="pilha" style={{ gap: 20 }}>
          <section className="ot-cartao" style={{ padding: 28 }}>
            <h2 className="titulo-3">Últimos envios</h2>
            <ul className="historico">
              {historico.slice(0, 4).map((h) => (
                <li key={`${h.ano}-${h.mes}`}>
                  <div>
                    <strong>{mesAno(h.ano, h.mes)}</strong>
                    <span className="corpo-s suave" style={{ display: 'block' }}>
                      Ocupação {h.ocupacao == null ? '—' : `${h.ocupacao}%`} · enviado em {h.enviadoEm}
                    </span>
                  </div>
                  <Selo situacao={h.situacao} />
                </li>
              ))}
            </ul>
            {devolvido && (
              <Aviso tipo="erro" style={{ marginTop: 12, fontSize: '1rem', lineHeight: 1.5 }} titulo={`${MESES_LONGOS[devolvido.mes - 1].replace(/^./, (l) => l.toUpperCase())} foi devolvido`}>
                {devolvido.motivo} <Link to={`/comerciante/enviar?ano=${devolvido.ano}&mes=${devolvido.mes}`}>Corrigir envio</Link>
              </Aviso>
            )}
          </section>
          <section className="ot-cartao cadastur-mini">
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--ciano)' }}><Icone nome="escudo" /></span>
            <div style={{ flex: 1 }}>
              <strong>Cadastur ativo</strong>
              <p className="corpo-s suave">Válido até {MEU_NEGOCIO.cadasturValidade}</p>
            </div>
            <Link className="ot-btn ot-btn--fantasma ot-btn--p" to="/comerciante/guia">Ver guia</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
