import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Aviso, Migalhas, Sobretitulo } from '../componentes/Basicos'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const PASSOS = [
  ['Separe os documentos', 'CNPJ ativo, alvará de funcionamento e dados do responsável.'],
  ['Acesse com sua conta gov.br', 'O cadastro é feito no site oficial do Ministério do Turismo.'],
  ['Escolha a atividade', 'Meio de hospedagem, agência, guia, transportadora, evento e outras.'],
  ['Acompanhe e renove', 'O certificado vale por 2 anos. Avisamos você antes de vencer.'],
]

const PERGUNTAS = [
  {
    p: 'Meu negócio é obrigado a ter Cadastur?',
    r: 'Meios de hospedagem, agências de turismo, transportadoras turísticas, organizadoras de eventos, parques temáticos, acampamentos e guias precisam do cadastro. Para restaurantes e bares, ele é opcional, mas traz visibilidade e acesso a programas do Ministério.',
  },
  {
    p: 'A FNRH Digital substitui a ficha de papel?',
    r: 'Sim. Com a FNRH Digital o hóspede preenche os dados antes de chegar, pelo celular, e a recepção só confirma. A ficha de papel deixa de ser necessária.',
  },
  {
    p: 'O Observatório envia meus dados ao governo federal?',
    r: 'Não. Os números que você envia ao Observatório ficam com a Prefeitura e só aparecem no site somados aos de outros estabelecimentos — ninguém vê os dados do seu negócio separados.',
  },
  {
    p: 'Quanto custa se cadastrar?',
    r: 'Nada. O Cadastur e a FNRH Digital são gratuitos. Desconfie de quem cobrar para fazer o cadastro por você.',
  },
]

export default function Cadastur() {
  useTitulo('Cadastur e FNRH')
  return (
    <div className="surgir">
      <section className="cad-hero">
        <div className="container cad-hero__grade">
          <div className="cad-hero__texto">
            <Migalhas atual="Cadastur e FNRH" />
            <h1 className="display-l" style={{ marginTop: 12 }}>
              Seu negócio <span className="ot-marca">regularizado</span>, sem complicação
            </h1>
            <p className="corpo-l" style={{ marginTop: 16, maxWidth: '44ch' }}>
              Um guia simples sobre o Cadastur e a Ficha Nacional de Registro de Hóspedes Digital — o que são, quem precisa e como fazer.
            </p>
            <div className="linha-acoes" style={{ marginTop: 28 }}>
              <a className="ot-btn ot-btn--solido ot-btn--g" href="#cadastur" onClick={(e) => { e.preventDefault(); document.getElementById('cadastur').scrollIntoView() }}>O que é Cadastur</a>
              <a className="ot-btn ot-btn--secundario ot-btn--g" href="#fnrh" onClick={(e) => { e.preventDefault(); document.getElementById('fnrh').scrollIntoView() }}>O que é FNRH Digital</a>
            </div>
          </div>
          <img src="ilustracoes/comerciante.svg" alt="" className="cad-hero__arte" />
        </div>
        <Adesivo tipo="estrela" cor="var(--amarelo)" tamanho={56} />
        <Adesivo tipo="anel" cor="#FFFFFF" tamanho={30} style={{ left: '46%', bottom: 48 }} />
      </section>

      <div className="container" style={{ paddingTop: 40 }}>
        <div className="grade-2">
          <article className="ot-cartao explica" id="cadastur">
            <span className="ot-indicador__icone explica__icone" style={{ '--cor': 'var(--ciano)' }}><Icone nome="escudo" tamanho="l" /></span>
            <Sobretitulo>Cadastur</Sobretitulo>
            <h2 className="titulo-1">O cadastro oficial de quem trabalha com turismo</h2>
            <p className="corpo suave">
              Sistema do Ministério do Turismo que reconhece prestadores de serviços turísticos. Com ele, seu negócio aparece em buscas oficiais, participa de programas e linhas de crédito do setor.
            </p>
            <ol className="passos-lista">
              {PASSOS.map(([t, d], i) => (
                <li key={t}>
                  <span className="passos-lista__num" aria-hidden="true">{i + 1}</span>
                  <div>
                    <strong className="titulo-3" style={{ fontSize: '1.25rem' }}>{t}</strong>
                    <p className="corpo-s suave" style={{ marginTop: 4 }}>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a className="ot-btn ot-btn--primario ot-btn--g" href="https://cadastur.turismo.gov.br" target="_blank" rel="noreferrer">
              Ir para o Cadastur <Icone nome="externo" />
            </a>
            <p className="ot-fonte">Você será levado ao site oficial cadastur.turismo.gov.br</p>
          </article>

          <article className="ot-cartao explica" id="fnrh">
            <span className="ot-indicador__icone explica__icone" style={{ '--cor': 'var(--amarelo)' }}><Icone nome="arquivo" tamanho="l" /></span>
            <Sobretitulo>FNRH Digital</Sobretitulo>
            <h2 className="titulo-1">A ficha do hóspede, agora sem papel</h2>
            <p className="corpo suave">
              A Ficha Nacional de Registro de Hóspedes Digital substitui a ficha de papel no check-in. O hóspede preenche antes de chegar, pelo celular, e o estabelecimento confirma na recepção.
            </p>
            <ul className="beneficios">
              <li><Icone nome="check-circulo" /> Check-in mais rápido na recepção</li>
              <li><Icone nome="check-circulo" /> Menos papel e menos erro de digitação</li>
              <li><Icone nome="check-circulo" /> Dados que ajudam a entender o turismo da cidade</li>
            </ul>
            <Aviso tipo="alerta" titulo="Precisa do Cadastur ativo">
              O acesso à FNRH Digital é feito com o cadastro do meio de hospedagem.
            </Aviso>
            <a className="ot-btn ot-btn--primario ot-btn--g" href="https://www.gov.br/turismo" target="_blank" rel="noreferrer" style={{ marginTop: 'auto' }}>
              Ir para a FNRH Digital <Icone nome="externo" />
            </a>
            <p className="ot-fonte">Você será levado ao site oficial do Ministério do Turismo</p>
          </article>
        </div>

        <section className="duvidas secao">
          <div>
            <Sobretitulo>Dúvidas frequentes</Sobretitulo>
            <h2 className="titulo-1" style={{ marginTop: 10 }}>Perguntas que a gente mais recebe</h2>
            <p className="corpo suave" style={{ marginTop: 12 }}>Não achou a sua? Fale com a Coordenação de Turismo.</p>
            <Link className="ot-btn ot-btn--secundario" to="/sobre#contato" style={{ marginTop: 20 }}>Falar com a SMCELT</Link>
          </div>
          <div className="pilha" style={{ gap: 12 }}>
            {PERGUNTAS.map((q, i) => (
              <details key={q.p} className="ot-faq" open={i === 0}>
                <summary>
                  <span>{q.p}</span>
                  <Icone nome="chevron" />
                </summary>
                <p className="corpo ot-faq__resposta">{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
