import { Link } from 'react-router-dom'
import Icone from './Icone'
import { useSessao } from '../contexto/Sessao'

// Hierarquia de marcas da SMCELT: nível 1 abre o rodapé, níveis 2 e 3 vêm juntos na faixa.
const MARCAS = [
  { src: 'logos/santa-rita-branco.png', alt: 'Santa Rita do Sapucaí — Cidade Criativa, Cidade Feliz', altura: 64 },
  { src: 'logos/prefeitura-branco.png', alt: 'Prefeitura de Santa Rita do Sapucaí', altura: 40 },
  { src: 'logos/smcelt-branco.png', alt: 'Secretaria de Cultura, Esporte, Lazer e Turismo', altura: 56 },
  { src: 'logos/comtur-branco.png', alt: 'COMTUR — Conselho Municipal de Turismo', altura: 40 },
  { src: 'logos/caminhos-branco.png', alt: 'Circuito Turístico Caminhos da Mantiqueira', altura: 56 },
  { src: 'logos/minas-branco.png', alt: 'Minas Gerais', altura: 34 },
]

export default function Rodape() {
  const { sessao } = useSessao()
  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__grade">
          <div className="rodape__marca">
            <img src="logos/observatorio-branco.png" alt="Observatório do Turismo de Santa Rita do Sapucaí" />
            <p>Dados abertos sobre o turismo de Santa Rita do Sapucaí, produzidos pela Secretaria Municipal de Cultura, Esporte, Lazer e Turismo.</p>
          </div>
          <nav aria-labelledby="rodape-consultar">
            <p className="rodape__titulo" id="rodape-consultar">Consultar</p>
            <ul className="rodape__lista">
              <li><Link to="/indicadores-publicos">Indicadores públicos</Link></li>
              {sessao ? (
                <>
                  <li><Link to="/indicadores">Indicadores completos</Link></li>
                  <li><Link to="/relatorios">Relatórios</Link></li>
                  <li><Link to="/cadastur">Cadastur e FNRH</Link></li>
                  <li><Link to="/indicadores#dados-abertos">Dados em CSV</Link></li>
                </>
              ) : (
                <li><Link to="/entrar?perfil=turista">Relatórios e dados completos</Link></li>
              )}
            </ul>
          </nav>
          <nav aria-labelledby="rodape-participar">
            <p className="rodape__titulo" id="rodape-participar">Participar</p>
            <ul className="rodape__lista">
              <li><Link to="/entrar?perfil=comerciante">Enviar dados do meu negócio</Link></li>
              <li><Link to="/sobre#como-funciona">Como funciona</Link></li>
              <li><Link to="/entrar?perfil=prefeitura">Área da Prefeitura</Link></li>
            </ul>
          </nav>
          <div>
            <p className="rodape__titulo">Contato</p>
            <ul className="rodape__lista">
              <li><a href="mailto:turismo@pmsrs.mg.gov.br"><Icone nome="email" tamanho="s" /> turismo@pmsrs.mg.gov.br</a></li>
              <li><a href="tel:+5535991191112"><Icone nome="telefone" tamanho="s" /> (35) 99119-1112</a></li>
              <li style={{ display: 'flex', gap: 8, paddingTop: 6, opacity: 0.9 }}><Icone nome="pin" tamanho="s" /> SMCELT · Santa Rita do Sapucaí, MG</li>
            </ul>
          </div>
        </div>
        <div className="rodape__logos">
          {MARCAS.map((m) => (
            <img key={m.src} src={m.src} alt={m.alt} style={{ height: m.altura }} loading="lazy" />
          ))}
        </div>
      </div>
    </footer>
  )
}
