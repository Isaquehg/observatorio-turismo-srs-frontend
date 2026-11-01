import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import Foto from '../componentes/Foto'
import Contador from '../componentes/Contador'
import { Sobretitulo } from '../componentes/Basicos'
import {
  CALENDARIO, DESTAQUE_GASTRONOMIA, EVENTOS, HISTORIA, LUGARES, NUMEROS, ONDE_COMER, POLO, ROTAS,
} from '../dados/cidade'
import { useSessao } from '../contexto/Sessao'
import { comportamentoRolagem, useRevelar, useTitulo } from '../util/ganchos'
import './publico.css'
import './turista/turista.css'
import './explorar.css'

const SECOES = [
  { id: 'historia', rotulo: 'História' },
  { id: 'polo', rotulo: 'Polo de tecnologia' },
  { id: 'eventos', rotulo: 'Eventos' },
  { id: 'rotas', rotulo: 'Rotas' },
  { id: 'culinaria', rotulo: 'Culinária' },
  { id: 'pontos', rotulo: 'O que visitar' },
]

const irPara = (id) => (e) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' })
}

function Cabecalho({ sobretitulo, titulo, texto }) {
  return (
    <div className="cidade-cab revelar">
      <Sobretitulo>{sobretitulo}</Sobretitulo>
      <h2 className="display-l">{titulo}</h2>
      {texto && <p className="corpo-l suave">{texto}</p>}
    </div>
  )
}

export default function Explorar() {
  useTitulo('Conheça a cidade')
  const pagina = useRef(null)
  useRevelar(pagina)
  const { sessao } = useSessao()
  const [rotaAberta, setRotaAberta] = useState(null)
  const rota = ROTAS.find((r) => r.nome === rotaAberta)

  const abrirRota = (nome) => {
    setRotaAberta((atual) => (atual === nome ? null : nome))
    requestAnimationFrame(() => document.getElementById('roteiro')?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'nearest' }))
  }

  return (
    <div ref={pagina}>
      {/* Abertura clean: texto à esquerda, ilustração da padroeira à direita */}
      <section className="container cidade-hero">
        <div className="cidade-hero__texto">
          <Sobretitulo>Conheça a cidade</Sobretitulo>
          <h1 className="display-xl cidade-hero__titulo">Santa Rita do <span className="ot-marca ot-marca--bloco">Sapucaí</span></h1>
          <p className="corpo-l suave cidade-hero__abertura">
            Simplicidade do interior, fé e criatividade no Sul de Minas. Uma cidade que nasceu de uma promessa e virou o Vale da Eletrônica.
          </p>
          <nav className="cidade-hero__indice" aria-label="Nesta página">
            {SECOES.map((s) => (
              <a key={s.id} href={`#${s.id}`} onClick={irPara(s.id)}>{s.rotulo}</a>
            ))}
          </nav>
        </div>
        <div className="cidade-hero__arte">
          <img src="ilustracoes/santa-rita.svg" alt="Ilustração da estátua de Santa Rita de Cássia, padroeira da cidade, com rosas aos pés" width="480" height="520" />
        </div>
      </section>

      <div className="container">
        {/* Números da cidade */}
        <ul className="numeros revelar" aria-label="Santa Rita em números">
          {NUMEROS.map((n) => (
            <li key={n.rotulo}>
              <strong className="numeros__valor"><Contador valor={n.valor} prefixo={n.prefixo} sufixo={n.sufixo} /></strong>
              <span className="corpo-s suave">{n.rotulo}</span>
            </li>
          ))}
        </ul>

        {/* História */}
        <section className="secao" id="historia">
          <Cabecalho sobretitulo="A história" titulo="Como tudo começou" texto="Uma capela, uma santa e um rio. As curiosidades por trás do nome e da fé da cidade." />
          <ol className="linha-tempo">
            {HISTORIA.map((h, i) => (
              <li key={h.titulo} className="linha-tempo__item revelar" style={{ '--atraso': `${i * 60}ms` }}>
                <span className="linha-tempo__marco">{h.marco}</span>
                <div className="linha-tempo__cartao">
                  <h3 className="titulo-2">{h.titulo}</h3>
                  <p className="corpo suave">{h.texto}</p>
                  {h.foto && <Foto chave={h.foto} alt={h.legenda} proporcao={h.proporcao} icone="casa" className="linha-tempo__foto linha-tempo__foto--inteira" />}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Polo de tecnologia: linha do tempo horizontal, sem bloco de cor */}
        <section className="secao" id="polo">
          <Cabecalho sobretitulo="Curiosidade" titulo="Por que uma cidade do interior virou polo de tecnologia?" texto="A resposta começa numa escola, em 1959. Cada passo puxou o seguinte." />
          <ol className="polo">
            {POLO.map((p, i) => (
              <li key={p.titulo} className="polo__passo revelar" style={{ '--atraso': `${i * 110}ms` }}>
                <span className="polo__marco">{p.marco}</span>
                <h3 className="titulo-3">{p.titulo}</h3>
                <p className="corpo-s suave">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Eventos */}
        <section className="secao" id="eventos">
          <Cabecalho sobretitulo="Eventos" titulo="A cidade em festa" texto="A festa da padroeira, que abre o aniversário da cidade, e dois eventos que levam o nome de Santa Rita para o Brasil." />
          <div className="eventos">
            {EVENTOS.map((e, i) => (
              <article key={e.nome} className="evento revelar" style={{ '--atraso': `${i * 80}ms` }}>
                <Foto chave={e.foto} alt={`${e.nome} em Santa Rita do Sapucaí`} proporcao={e.proporcao} icone={e.icone} className="evento__foto" />
                <div className="evento__texto">
                  <span className="evento__quando"><Icone nome="calendario" tamanho="s" /> {e.quando}</span>
                  <h3 className="titulo-1 evento__nome">{e.nome}</h3>
                  <p className="corpo evento__resumo">{e.resumo}</p>
                  <p className="corpo suave">{e.texto}</p>
                </div>
              </article>
            ))}
          </div>
          <h3 className="titulo-2 calendario__titulo revelar">Também no calendário</h3>
          <ul className="calendario">
            {CALENDARIO.map((c, i) => (
              <li key={c.nome} className="calendario__item revelar" style={{ '--atraso': `${i * 90}ms` }}>
                <span className="calendario__mes">{c.mes}</span>
                <h4 className="titulo-3">{c.nome}</h4>
                <p className="corpo-s suave">{c.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Rotas turísticas oficiais */}
        <section className="secao" id="rotas">
          <Cabecalho sobretitulo="Rotas turísticas" titulo="Seis jeitos de conhecer a cidade" texto="O turismo de Santa Rita é organizado em seis rotas oficiais. Escolha uma para ver o roteiro." />
          <ul className="rotas">
            {ROTAS.map((r, i) => (
              <li key={r.nome} className="revelar" style={{ '--atraso': `${(i % 3) * 80}ms` }}>
                <button type="button" className="rota" aria-expanded={rotaAberta === r.nome} aria-controls="roteiro" onClick={() => abrirRota(r.nome)}>
                  <span className="rota__icone"><Icone nome={r.icone} /></span>
                  <span className="rota__texto">
                    <strong className="titulo-3">{r.nome}</strong>
                    <span className="corpo-s suave">{r.texto}</span>
                    <span className="rota__ver">{rotaAberta === r.nome ? 'Fechar roteiro' : 'Ver roteiro'} <Icone nome="chevron" tamanho="s" /></span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div id="roteiro" className="roteiro-area" aria-live="polite">
            {rota && (
              <article key={rota.nome} className="roteiro">
                <Foto chave={rota.foto} alt={rota.nome} proporcao="auto" icone={rota.icone} className="roteiro__foto" />
                <div className="roteiro__texto">
                  <div className="roteiro__topo">
                    <span className="ot-sobretitulo ot-sobretitulo--azul">Roteiro</span>
                    <button type="button" className="botao-icone" onClick={() => setRotaAberta(null)} aria-label="Fechar roteiro">
                      <Icone nome="x" tamanho="s" />
                    </button>
                  </div>
                  <h3 className="display-l">{rota.nome}</h3>
                  <p className="corpo">{rota.resumo}</p>
                  <ol className="roteiro__paradas">
                    {rota.paradas.map((p) => (
                      <li key={p.nome}>
                        <strong>{p.nome}</strong>
                        <span className="corpo-s suave">{p.texto}</span>
                      </li>
                    ))}
                  </ol>
                  {rota.contato && <p className="corpo-s roteiro__contato"><Icone nome="telefone" tamanho="s" /> {rota.contato}</p>}
                </div>
              </article>
            )}
          </div>
        </section>

        {/* Culinária */}
        <section className="secao" id="culinaria">
          <Cabecalho sobretitulo="Culinária" titulo="Onde e o que comer" texto="Da cozinha mineira de sempre ao hambúrguer premiado do país." />
          <article className="destaque-sabor revelar">
            <Foto chave={DESTAQUE_GASTRONOMIA.foto} alt={`Hambúrguer do ${DESTAQUE_GASTRONOMIA.nome}`} proporcao="4 / 3" icone="garfo" className="destaque-sabor__foto" />
            <div className="destaque-sabor__texto">
              <span className="destaque-sabor__selo"><Icone nome="estrela" tamanho="s" /> {DESTAQUE_GASTRONOMIA.selo}</span>
              <h3 className="display-l">{DESTAQUE_GASTRONOMIA.nome}</h3>
              <p className="corpo-s suave">{DESTAQUE_GASTRONOMIA.premio}</p>
              <p className="corpo">{DESTAQUE_GASTRONOMIA.texto}</p>
              <span className="destaque-sabor__dica"><Icone nome="pin" tamanho="s" /> Recomendação do Observatório para quem visita</span>
            </div>
          </article>
          <h3 className="titulo-2 sub-titulo revelar">Outros lugares para comer e beber</h3>
          <ul className="onde-comer">
            {ONDE_COMER.map((l, i) => (
              <li key={l.nome} className="sabor revelar" style={{ '--atraso': `${i * 80}ms` }}>
                <Foto chave={l.foto} alt={l.nome} proporcao="4 / 3" icone="garfo" />
                <div className="sabor__texto">
                  <span className="ot-sobretitulo ot-sobretitulo--azul">{l.tipo}</span>
                  <h4 className="titulo-3">{l.nome}</h4>
                  <p className="corpo-s suave">{l.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Pontos turísticos */}
        <section className="secao" id="pontos">
          <Cabecalho sobretitulo="Pontos turísticos" titulo="O que visitar" texto="Da padroeira na entrada da cidade aos mirantes, museus e feiras. Endereços e horários para planejar o passeio." />
          <ul className="lugares revelar">
            {LUGARES.map((l) => (
              <li key={l.nome} className="lugar">
                <span className="lugar__icone"><Icone nome={l.icone} tamanho="s" /></span>
                <div>
                  <strong>{l.nome}</strong>
                  <span className="corpo-s suave">{l.onde}</span>
                  <span className="corpo-s lugar__quando"><Icone nome="relogio" tamanho="s" /> {l.quando}</span>
                </div>
              </li>
            ))}
          </ul>

        </section>

        {/* Convite para a área do turista */}
        <aside className="convite-turista revelar">
          <span className="convite-turista__rotulo">Área do turista</span>
          <h2 className="titulo-2">É turista?</h2>
          <p className="corpo suave">Faça login e conheça informações mais detalhadas sobre a cidade, como acomodações, endereços e pontos turísticos.</p>
          {sessao?.perfil === 'turista'
            ? <Link className="ot-btn ot-btn--primario" to="/turista">Ir para a área do turista <Icone nome="seta" tamanho="s" /></Link>
            : <Link className="ot-btn ot-btn--primario" to="/entrar">Fazer login <Icone nome="seta" tamanho="s" /></Link>}
        </aside>
      </div>
    </div>
  )
}
