import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Sobretitulo } from '../componentes/Basicos'
import { Indicador, CartaoRelatorio, ResumoRelatorio, useResumo } from '../componentes/Cartoes'
import { resumoDoAno, serie } from '../dados/indicadores'
import { relatorios } from '../dados/relatorios'
import { numero, variacao, diferenca } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const PUBLICOS = [
  { titulo: 'Gestores públicos', texto: 'Decisões com base em dados e histórico preservado entre gestões.', icone: 'prefeitura', cor: 'var(--ciano)' },
  { titulo: 'Empreendedores', texto: 'Planeje a temporada com números reais do setor.', icone: 'loja', cor: 'var(--rosa)' },
  { titulo: 'Pesquisadores', texto: 'Séries históricas e relatórios completos para download.', icone: 'grafico', cor: 'var(--amarelo)' },
  { titulo: 'População', texto: 'Veja o impacto do turismo na economia da cidade.', icone: 'pessoas', cor: 'var(--azul-ceu)' },
]

export default function Inicio() {
  useTitulo()
  const { aberto, abrir, fechar } = useResumo()
  const atual = resumoDoAno(2025)
  const anterior = resumoDoAno(2024)

  const destaques = [
    { rotulo: 'Leitos disponíveis', valor: numero(atual.leitos), icone: 'cama', cor: 'var(--ciano)', variacao: variacao(atual.leitos, anterior.leitos), serie: serie('leitos', 2025) },
    { rotulo: 'Meios de hospedagem', valor: atual.hospedagens, icone: 'predio', cor: 'var(--amarelo)', variacao: diferenca(atual.hospedagens, anterior.hospedagens), serie: serie('hospedagens', 2025) },
    { rotulo: 'Empresas do turismo', valor: atual.empresas, icone: 'loja', cor: 'var(--rosa)', variacao: variacao(atual.empresas, anterior.empresas), serie: serie('empresas', 2025) },
    { rotulo: 'Empregos no setor', valor: numero(atual.empregos), icone: 'pessoas', cor: 'var(--lilas)', variacao: variacao(atual.empregos, anterior.empregos), serie: serie('empregos', 2025) },
  ]

  return (
    <div className="surgir">
      <section className="hero ot-gradiente">
        <div className="hero__texto">
          <Sobretitulo>Observatório do Turismo · Santa Rita do Sapucaí</Sobretitulo>
          <h1 className="display-xl hero__titulo">
            O turismo da cidade em <span className="ot-marca ot-marca--bloco">números</span> que todo mundo entende
          </h1>
          <p className="corpo-l hero__abertura">
            Hospedagem, leitos, empresas e empregos — atualizados pela Prefeitura e abertos para qualquer pessoa consultar.
          </p>
        </div>
        <div className="hero__arte" aria-hidden="true">
          <img className="hero__cidade" src="ilustracoes/cidade.svg" alt="" />
          <img className="hero__turista" src="ilustracoes/turista.svg" alt="" />
        </div>
        <Adesivo tipo="explosao" cor="var(--ciano)" tamanho={84} className="hero__explosao" />
      </section>

      <section className="container secao">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Destaques de 2025</Sobretitulo>
            <h2 className="titulo-1">Como está o turismo agora</h2>
          </div>
          <Link className="ot-btn ot-btn--fantasma" to="/indicadores">
            Todos os indicadores <Icone nome="seta" />
          </Link>
        </div>
        <div className="grade-4">
          {destaques.map((d) => (
            <Indicador key={d.rotulo} {...d} comparacao="vs. 2024" />
          ))}
        </div>
        <p className="ot-fonte" style={{ marginTop: 12 }}>Valores ilustrativos para o protótipo. Fonte prevista: OT-SRS / SMCELT.</p>
      </section>

      <section className="container secao">
        <div className="publicos">
          <div className="publicos__intro">
            <Sobretitulo>Para quem é</Sobretitulo>
            <h2 className="titulo-1" style={{ marginTop: 10 }}>Feito para quem vive, visita e trabalha na cidade</h2>
          </div>
          <ul className="publicos__lista">
            {PUBLICOS.map((p) => (
              <li key={p.titulo} className="publico">
                <span className="publico__icone ot-bolha" style={{ background: p.cor }}>
                  <Icone nome={p.icone} tamanho="l" />
                </span>
                <h3 className="titulo-3">{p.titulo}</h3>
                <p className="corpo-s suave">{p.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container secao">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Relatórios</Sobretitulo>
            <h2 className="titulo-1">Publicados recentemente</h2>
          </div>
          <Link className="ot-btn ot-btn--fantasma" to="/relatorios">
            Ver todos <Icone nome="seta" />
          </Link>
        </div>
        <div className="pilha" style={{ gap: 16 }}>
          {relatorios.slice(0, 3).map((r) => (
            <CartaoRelatorio key={r.id} relatorio={r} aoAbrir={abrir} />
          ))}
        </div>
      </section>

      <section className="container secao">
        <div className="convite">
          <img src="ilustracoes/comerciante.svg" alt="" className="convite__arte" />
          <div className="convite__texto">
            <Sobretitulo cor="tinta">Para estabelecimentos</Sobretitulo>
            <h2 className="titulo-1" style={{ marginTop: 10 }}>Tem hotel, pousada ou comércio? Seus dados ajudam a cidade inteira.</h2>
            <p className="corpo" style={{ marginTop: 12 }}>Envie a ocupação do mês em poucos minutos e compare seu negócio com a média de Santa Rita.</p>
            <div className="linha-acoes" style={{ marginTop: 24 }}>
              <Link className="ot-btn ot-btn--solido ot-btn--g" to="/entrar?perfil=comerciante">
                Enviar dados do meu negócio <Icone nome="seta" />
              </Link>
              <Link className="ot-btn ot-btn--fantasma ot-btn--g" to="/sobre#como-funciona" style={{ color: 'var(--tinta)' }}>
                Como funciona
              </Link>
            </div>
          </div>
          <Adesivo tipo="estrela" cor="var(--amarelo)" tamanho={60} className="convite__estrela" />
        </div>
      </section>

      <ResumoRelatorio relatorio={aberto} aoFechar={fechar} />
    </div>
  )
}
