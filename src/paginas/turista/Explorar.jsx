import { useState } from 'react'
import Icone from '../../componentes/Icone'
import Foto from '../../componentes/Foto'
import BotaoFavorito from '../../componentes/BotaoFavorito'
import { Sobretitulo } from '../../componentes/Basicos'
import { useSessao } from '../../contexto/Sessao'
import { CURIOSIDADES, PONTOS_TURISTICOS, SABORES, TIPOS_HOSPEDAGEM_TURISTA } from '../../dados/turismo'
import { hospedagensVisiveis, todosOsLugares } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import '../publico.css'
import './turista.css'

const SECOES = [
  { id: 'favoritos', rotulo: 'Favoritos' },
  { id: 'curiosidades', rotulo: 'Curiosidades' },
  { id: 'onde-ficar', rotulo: 'Onde ficar' },
  { id: 'sabores', rotulo: 'Sabores' },
  { id: 'o-que-visitar', rotulo: 'O que visitar' },
]

const PRECO = { $: 'Econômico', $$: 'Intermediário', $$$: 'Mais sofisticado' }

export default function Explorar() {
  useTitulo('Explorar a cidade')
  const { sessao } = useSessao()
  const [tipo, setTipo] = useState('Todos')
  const { ids, alternar } = useFavoritos()
  const todas = hospedagensVisiveis()
  const hospedagens = tipo === 'Todos' ? todas : todas.filter((h) => h.tipo === tipo)
  const favoritos = todosOsLugares().filter((l) => ids.includes(l.id))
  const primeiroNome = sessao.nome.split(' ')[0]

  return (
    <div className="surgir">
      <section className="explorar-hero ot-gradiente">
        <div className="explorar-hero__texto">
          <Sobretitulo>Área do turista</Sobretitulo>
          <h1 className="display-l" style={{ marginTop: 16 }}>
            Olá, {primeiroNome}! <span style={{ whiteSpace: 'nowrap' }}>Boas-vindas</span> a <span className="ot-marca ot-marca--bloco">Santa Rita</span>
          </h1>
          <p className="corpo-l explorar-hero__abertura">
            Curiosidades, onde ficar, o que comer e o que visitar na Cidade Criativa do Sul de Minas.
          </p>
          <nav className="explorar-hero__atalhos" aria-label="Nesta página">
            {SECOES.filter((s) => s.id !== 'favoritos' || favoritos.length > 0).map((s) => (
              <a key={s.id} href={`#${s.id}`} className="ot-chip" onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView() }}>
                {s.rotulo}
              </a>
            ))}
          </nav>
        </div>
        <Foto chave="vista-cidade" alt="Vista de Santa Rita do Sapucaí com casas, prédios e a serra ao fundo" className="explorar-hero__foto" proporcao="4 / 3" />
      </section>

      <div className="container">
        {favoritos.length > 0 && (
          <section className="secao" id="favoritos">
            <div className="secao__cab">
              <div>
                <Sobretitulo>Salvos por você</Sobretitulo>
                <h2 className="titulo-1">Meus favoritos</h2>
              </div>
            </div>
            <ul className="favoritos-lista">
              {favoritos.map((f) => (
                <li key={f.id}>
                  <span><strong>{f.nome}</strong><span className="corpo-s suave">{f.local}</span></span>
                  <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => alternar(f.id)} aria-label={`Tirar ${f.nome} dos favoritos`}>Remover</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="secao" id="curiosidades">
          <div className="secao__cab">
            <div>
              <Sobretitulo>Curiosidades</Sobretitulo>
              <h2 className="titulo-1">Você sabia?</h2>
            </div>
          </div>
          <ul className="curiosidades">
            {CURIOSIDADES.map((c) => (
              <li key={c.titulo} className={`curiosidade ${c.foto ? 'curiosidade--foto' : ''}`}>
                {c.foto && <Foto chave={c.foto} alt={c.legenda} proporcao="16 / 9" />}
                <div className="curiosidade__corpo">
                  <span className="ot-indicador__icone" style={{ '--cor': c.cor }}><Icone nome={c.icone} /></span>
                  <span className="curiosidade__destaque">{c.destaque}</span>
                  <h3 className="titulo-3">{c.titulo}</h3>
                  <p className="corpo-s suave">{c.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="secao" id="onde-ficar">
          <div className="secao__cab">
            <div>
              <Sobretitulo>Onde ficar</Sobretitulo>
              <h2 className="titulo-1">Hotéis, pousadas e chalés</h2>
            </div>
          </div>
          <div className="rolagem-x" role="group" aria-label="Tipo de hospedagem" style={{ marginBottom: 20 }}>
            {TIPOS_HOSPEDAGEM_TURISTA.map((t) => (
              <button key={t} type="button" className="ot-chip" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
                {t === 'Todos' ? 'Todos' : `${t}s`}
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite">{hospedagens.length} hospedagens</p>
          <ul className="cartoes-foto">
            {hospedagens.map((h) => (
              <li key={h.id} className="cartao-foto">
                <BotaoFavorito ativo={ids.includes(`hosp-${h.id}`)} nome={h.nome} aoAlternar={() => alternar(`hosp-${h.id}`)} />
                <Foto chave={h.foto} alt={`Foto ilustrativa de ${h.tipo.toLowerCase()}`} />
                <div className="cartao-foto__corpo">
                  <div className="cartao-foto__tags">
                    <span className="ot-sobretitulo">{h.tipo}</span>
                    {h.cadastur && <span className="ot-selo ot-selo--publicado"><Icone nome="escudo" /> Cadastur</span>}
                  </div>
                  <h3 className="titulo-3">{h.nome}</h3>
                  {h.descricao && <p className="corpo-s suave">{h.descricao}</p>}
                  <p className="cartao-foto__meta">
                    <span><Icone nome="pin" tamanho="s" /> {h.bairro}</span>
                    <span title={PRECO[h.preco]}><strong>{h.preco}</strong> · {PRECO[h.preco]}</span>
                  </p>
                  <ul className="cartao-foto__destaques">
                    {h.destaques.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          <p className="ot-fonte" style={{ marginTop: 12 }}>
            Estabelecimentos de exemplo para o protótipo, com fotos ilustrativas. O selo Cadastur indica cadastro ativo no Ministério do Turismo.
          </p>
        </section>

        <section className="secao" id="sabores">
          <div className="secao__cab">
            <div>
              <Sobretitulo>Experiências gastronômicas</Sobretitulo>
              <h2 className="titulo-1">O que provar por aqui</h2>
            </div>
          </div>
          <ul className="cartoes-foto cartoes-foto--sabores">
            {SABORES.map((s) => (
              <li key={s.nome} className="cartao-foto">
                <Foto chave={s.foto} alt={s.nome} />
                <div className="cartao-foto__corpo">
                  <h3 className="titulo-3">{s.nome}</h3>
                  <p className="corpo-s suave">{s.texto}</p>
                  <p className="cartao-foto__meta"><span><Icone nome="garfo" tamanho="s" /> {s.onde}</span></p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="secao" id="o-que-visitar">
          <div className="secao__cab">
            <div>
              <Sobretitulo>O que visitar</Sobretitulo>
              <h2 className="titulo-1">Pontos turísticos</h2>
            </div>
          </div>
          <ul className="pontos">
            {PONTOS_TURISTICOS.map((p, i) => (
              <li key={p.nome} className="ponto">
                <BotaoFavorito ativo={ids.includes(`ponto-${i}`)} nome={p.nome} aoAlternar={() => alternar(`ponto-${i}`)} />
                <Foto chave={p.foto} alt={p.nome} proporcao="auto" />
                <div className="ponto__corpo">
                  <span className="ot-sobretitulo ot-sobretitulo--azul">{p.categoria}</span>
                  <h3 className="titulo-2">{p.nome}</h3>
                  <p className="corpo suave">{p.texto}</p>
                  <p className="cartao-foto__meta"><span><Icone nome="pin" tamanho="s" /> {p.local}</span></p>
                </div>
              </li>
            ))}
          </ul>
          <p className="ot-fonte" style={{ marginTop: 16 }}>
            Fotos dos pontos turísticos: Wikimedia Commons, com autor e licença em cada imagem.
          </p>
        </section>
      </div>
    </div>
  )
}
