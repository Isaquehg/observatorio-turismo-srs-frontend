import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Migalhas, Sobretitulo } from '../componentes/Basicos'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const FLUXO = [
  { icone: 'loja', cor: 'var(--rosa)', titulo: 'O estabelecimento envia', texto: 'Todo mês, hotéis, pousadas e serviços informam ocupação, hóspedes e funcionários. Leva uns três minutos.' },
  { icone: 'escudo', cor: 'var(--ciano)', titulo: 'A Prefeitura confere', texto: 'A equipe da SMCELT revisa cada envio. Números fora do esperado voltam para correção antes de entrar na conta.' },
  { icone: 'grafico', cor: 'var(--amarelo)', titulo: 'O site publica', texto: 'Os dados aprovados viram indicadores e relatórios abertos — sempre somados, sem expor nenhum negócio.' },
]

const PRINCIPIOS = [
  ['Dados abertos', 'Tudo o que é publicado pode ser baixado em CSV e reutilizado, com citação da fonte.'],
  ['Privacidade', 'Números individuais dos estabelecimentos nunca aparecem no site. Só médias e totais.'],
  ['Continuidade', 'O histórico fica guardado entre gestões, para comparar a cidade com ela mesma ao longo dos anos.'],
]

export default function Sobre() {
  useTitulo('Sobre o Observatório')
  return (
    <div className="container pag surgir">
      <section className="sobre-hero">
        <div>
          <Migalhas atual="Sobre" />
          <h1 className="display-l pag__titulo">
            Um <span className="ot-marca ot-marca--ciano">observatório</span> para a cidade inteira
          </h1>
          <p className="corpo-l" style={{ marginTop: 16, maxWidth: '48ch' }}>
            O Observatório do Turismo de Santa Rita do Sapucaí reúne, confere e publica os números do turismo local. É uma iniciativa da Secretaria Municipal de Cultura, Esporte, Lazer e Turismo (SMCELT), com apoio do COMTUR.
          </p>
          <p className="corpo suave" style={{ marginTop: 12, maxWidth: '52ch' }}>
            A ideia é simples: quem decide, quem empreende e quem estuda o turismo da cidade precisa olhar para os mesmos números — e entendê-los sem esforço.
          </p>
        </div>
        <div className="sobre-hero__arte" aria-hidden="true">
          <img src="ilustracoes/gestora.svg" alt="" />
          <Adesivo tipo="brilho" cor="#FFFFFF" tamanho={40} />
        </div>
      </section>

      <section className="secao" id="como-funciona">
        <Sobretitulo>Como funciona</Sobretitulo>
        <h2 className="titulo-1" style={{ marginTop: 10 }}>Do balcão da pousada ao gráfico do site</h2>
        <ol className="fluxo" style={{ marginTop: 48 }}>
          {FLUXO.map((f) => (
            <li key={f.titulo} className="fluxo__passo">
              <span className="fluxo__icone ot-bolha" style={{ background: f.cor }}><Icone nome={f.icone} tamanho="l" /></span>
              <h3 className="titulo-3">{f.titulo}</h3>
              <p className="corpo-s suave">{f.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="secao">
        <div className="grade-3">
          {PRINCIPIOS.map(([t, d]) => (
            <div key={t} className="ot-cartao ot-cartao--contorno" style={{ background: 'transparent' }}>
              <h3 className="titulo-3">{t}</h3>
              <p className="corpo-s suave" style={{ marginTop: 8 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="secao" id="contato">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Contato</Sobretitulo>
            <h2 className="titulo-1">Fale com a Coordenação de Turismo</h2>
          </div>
        </div>
        <div className="contato">
          <div className="ot-cartao contato__item">
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--azul-ceu)' }}><Icone nome="email" /></span>
            <div>
              <p className="corpo-s suave">E-mail</p>
              <a href="mailto:turismo@pmsrs.mg.gov.br">turismo@pmsrs.mg.gov.br</a>
            </div>
          </div>
          <div className="ot-cartao contato__item">
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--rosa)' }}><Icone nome="telefone" /></span>
            <div>
              <p className="corpo-s suave">Telefone e WhatsApp</p>
              <a href="tel:+5535991191112">(35) 99119-1112</a>
            </div>
          </div>
          <div className="ot-cartao contato__item">
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--amarelo)' }}><Icone nome="pin" /></span>
            <div>
              <p className="corpo-s suave">Atendimento presencial</p>
              <p style={{ fontWeight: 700 }}>SMCELT · Santa Rita do Sapucaí, MG</p>
            </div>
          </div>
          <div className="ot-cartao contato__item">
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--ciano)' }}><Icone nome="loja" /></span>
            <div>
              <p className="corpo-s suave">Tem um negócio na cidade?</p>
              <Link to="/entrar?perfil=comerciante">Acessar a área do comerciante</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
