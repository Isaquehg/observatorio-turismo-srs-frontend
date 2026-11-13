import { useState } from 'react'
import Icone from '../../componentes/Icone'
import Foto from '../../componentes/Foto'
import BotaoFavorito from '../../componentes/BotaoFavorito'
import { Sobretitulo } from '../../componentes/Basicos'
import { GASTRONOMIA } from '../../dados/turismo'
import { FAIXAS_PRECO, hospedagensVisiveis, pontosVisiveis, slug } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import Telefone from './Telefone'
import '../painel.css'
import './turista.css'

const SECOES = [
  { id: 'onde-ficar', rotulo: 'Onde ficar' },
  { id: 'onde-comer', rotulo: 'Onde comer' },
  { id: 'o-que-visitar', rotulo: 'O que visitar' },
]

const PLURAL = { Hotel: 'Hotéis', Pousada: 'Pousadas', Hostel: 'Hostels', Fazenda: 'Fazendas', Camping: 'Campings', Flat: 'Flats' }

export default function Explorar() {
  useTitulo('Guia da cidade')
  const [tipo, setTipo] = useState('Todos')
  const { ids, alternar } = useFavoritos()
  const todas = hospedagensVisiveis()
  const tipos = ['Todos', ...new Set(todas.map((h) => h.tipo))]
  const hospedagens = tipo === 'Todos' ? todas : todas.filter((h) => h.tipo === tipo)

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do turista" titulo="Guia da cidade" cor="var(--azul-ceu)" />
      <p className="corpo suave" style={{ marginTop: -12 }}>
        Endereços, telefones e horários para planejar a visita. Toque na estrela para guardar no seu roteiro.
      </p>
      <nav className="guia__atalhos" aria-label="Nesta página">
        {SECOES.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="ot-chip" onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView() }}>
            {s.rotulo}
          </a>
        ))}
      </nav>

      <section className="secao" id="onde-ficar">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Onde ficar</Sobretitulo>
            <h2 className="titulo-1">Hotéis, pousadas e fazendas</h2>
          </div>
        </div>
        <div className="rolagem-x" role="group" aria-label="Tipo de hospedagem" style={{ marginBottom: 20 }}>
          {tipos.map((t) => (
            <button key={t} type="button" className="ot-chip" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
              {PLURAL[t] || t}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{hospedagens.length} hospedagens</p>
        <ul className="cartoes-foto">
          {hospedagens.map((h) => (
            <li key={h.id} className="cartao-foto">
              <BotaoFavorito ativo={ids.includes(`hosp-${h.id}`)} nome={h.nome} aoAlternar={() => alternar(`hosp-${h.id}`)} />
              {h.foto ? (
                <Foto chave={h.foto} alt={`Foto ilustrativa de ${h.tipo.toLowerCase()}`} />
              ) : (
                <span className="cartao-foto__sem-foto" aria-hidden="true"><Icone nome="cama" tamanho="l" /></span>
              )}
              <div className="cartao-foto__corpo">
                <div className="cartao-foto__tags">
                  <span className="ot-sobretitulo">{h.tipo}</span>
                  {h.exemplo && <span className="ot-selo ot-selo--novo">Exemplo do protótipo</span>}
                </div>
                <h3 className="titulo-3">{h.nome}</h3>
                {h.descricao && <p className="corpo-s suave">{h.descricao}</p>}
                <p className="cartao-foto__meta">
                  <span><Icone nome="pin" tamanho="s" /> {h.endereco}</span>
                  <Telefone numero={h.telefone} />
                  {h.preco && <span title={FAIXAS_PRECO[h.preco]}><strong>{h.preco}</strong> · {FAIXAS_PRECO[h.preco]}</span>}
                </p>
                {h.destaques && (
                  <ul className="cartao-foto__destaques">
                    {h.destaques.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="ot-fonte" style={{ marginTop: 12 }}>
          Hospedagens do portal oficial Visite Santa Rita (visitesrs.com.br). Ligue antes para confirmar disponibilidade.
        </p>
      </section>

      <section className="secao" id="onde-comer">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Onde comer</Sobretitulo>
            <h2 className="titulo-1">Restaurantes, cafés e bares</h2>
          </div>
        </div>
        <ul className="diretorio">
          {GASTRONOMIA.map((g) => {
            const id = `comer-${slug(g.nome)}`
            return (
              <li key={g.nome}>
                <BotaoFavorito ativo={ids.includes(id)} nome={g.nome} aoAlternar={() => alternar(id)} />
                <strong>{g.nome}</strong>
                <span className="corpo-s suave"><Icone nome="pin" tamanho="s" /> {g.endereco}</span>
                <span className="corpo-s"><Telefone numero={g.telefone} /></span>
              </li>
            )
          })}
        </ul>
        <p className="ot-fonte" style={{ marginTop: 12 }}>Lista do portal oficial Visite Santa Rita (visitesrs.com.br).</p>
      </section>

      <section className="secao" id="o-que-visitar">
        <div className="secao__cab">
          <div>
            <Sobretitulo>O que visitar</Sobretitulo>
            <h2 className="titulo-1">Pontos turísticos</h2>
          </div>
        </div>
        <ul className="pontos">
          {pontosVisiveis().map((p) => (
            <li key={p.id} className="ponto">
              <BotaoFavorito ativo={ids.includes(p.id)} nome={p.nome} aoAlternar={() => alternar(p.id)} />
              {p.foto ? (
                <Foto chave={p.foto} alt={p.nome} proporcao="auto" />
              ) : (
                <span className="ponto__sem-foto" aria-hidden="true"><Icone nome={p.icone || 'mapa'} tamanho="l" /></span>
              )}
              <div className="ponto__corpo">
                {p.categoria && <span className="ot-sobretitulo ot-sobretitulo--azul">{p.categoria}</span>}
                <h3 className="titulo-2">{p.nome}</h3>
                {p.texto && <p className="corpo suave">{p.texto}</p>}
                <p className="cartao-foto__meta">
                  <span><Icone nome="pin" tamanho="s" /> {p.local}</span>
                  {p.quando && <span><Icone nome="relogio" tamanho="s" /> {p.quando}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="ot-fonte" style={{ marginTop: 16 }}>
          Lugares, endereços e horários do portal oficial Visite Santa Rita. Fotos: Wikimedia Commons, com autor e licença em cada imagem.
        </p>
      </section>
    </div>
  )
}
