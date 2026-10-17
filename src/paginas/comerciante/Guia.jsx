import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Aviso } from '../../componentes/Basicos'
import { CartoesCadastur, DuvidasCadastur } from '../../componentes/GuiaCadastur'
import { MEU_NEGOCIO } from '../../dados/painel'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from './InicioComerciante'
import '../painel.css'

const CADASTRO = [
  { titulo: 'Tenha o Cadastur ativo', texto: 'O Observatório só aceita estabelecimentos com CNPJ e Cadastur em dia. O passo a passo está logo abaixo.', icone: 'escudo' },
  { titulo: 'Peça o acesso à SMCELT', texto: 'Mande o CNPJ, o nome do estabelecimento, o tipo e a capacidade (quartos e leitos) para turismo@pmsrs.mg.gov.br.', icone: 'email' },
  { titulo: 'Entre com o seu CNPJ', texto: 'Em até 3 dias úteis você recebe a senha por e-mail. O login da área do comerciante é sempre o CNPJ cadastrado.', icone: 'cadeado' },
  { titulo: 'Mantenha os dados em dia', texto: 'Confira o cadastro em “Meu estabelecimento” e envie a ocupação de cada mês até o dia 10 do mês seguinte.', icone: 'calendario' },
]

export default function Guia() {
  useTitulo('Cadastur, FNRH e cadastro')
  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo="Cadastur, FNRH e cadastro" />

      <section className="ot-cartao guia-cadastro">
        <div className="guia-cadastro__cab">
          <h2 className="titulo-2">Como cadastrar seu estabelecimento no Observatório</h2>
          <p className="corpo suave">Quatro passos para começar a enviar dados e comparar seu negócio com a média da cidade.</p>
        </div>
        <ol className="guia-cadastro__passos">
          {CADASTRO.map((p, i) => (
            <li key={p.titulo}>
              <span className="guia-cadastro__num" aria-hidden="true">{i + 1}</span>
              <Icone nome={p.icone} />
              <strong className="titulo-3">{p.titulo}</strong>
              <p className="corpo-s suave">{p.texto}</p>
            </li>
          ))}
        </ol>
        <Aviso tipo="sucesso" titulo={`${MEU_NEGOCIO.nome} já está cadastrada`} style={{ marginTop: 'var(--esp-5)' }}>
          CNPJ {MEU_NEGOCIO.cnpj} · Cadastur válido até {MEU_NEGOCIO.cadasturValidade}.
        </Aviso>
        <div className="linha-acoes" style={{ marginTop: 'var(--esp-4)' }}>
          <Link className="ot-btn ot-btn--solido" to="/comerciante/estabelecimento"><Icone nome="loja" /> Conferir meu cadastro</Link>
          <Link className="ot-btn ot-btn--secundario" to="/comerciante/enviar"><Icone nome="upload" /> Enviar dados do mês</Link>
        </div>
      </section>

      <div style={{ marginTop: 'var(--esp-5)' }}>
        <CartoesCadastur />
      </div>
      <DuvidasCadastur />
    </div>
  )
}
