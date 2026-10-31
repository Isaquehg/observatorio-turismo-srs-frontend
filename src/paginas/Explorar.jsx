import { useState } from 'react'
import Icone from '../componentes/Icone'
import { Migalhas } from '../componentes/Basicos'
import Foto from '../componentes/Foto'
import BotaoFavorito from '../componentes/BotaoFavorito'
import { useSessao } from '../contexto/Sessao'
import { CATEGORIAS_EXPLORAR, todosOsLugares } from '../dados/explorar'
import { useFavoritos } from '../util/favoritos'
import { normalizar } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'
import './turista/turista.css'

const CATEGORIA = Object.fromEntries(CATEGORIAS_EXPLORAR.map((c) => [c.id, c]))

export default function Explorar() {
  useTitulo('Explore o turismo')
  const { sessao } = useSessao()
  const { ids, alternar } = useFavoritos()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')

  const termo = normalizar(busca.trim())
  const lista = todosOsLugares().filter(
    (l) => (categoria === 'todas' || l.categoria === categoria) && (!termo || normalizar(`${l.nome} ${l.local} ${l.texto}`).includes(termo)),
  )

  return (
    <div className="container pag surgir">
      <Migalhas atual="Explore o turismo" />
      <h1 className="display-l pag__titulo">Explore o turismo</h1>
      <p className="corpo-l pag__abertura">Descubra os pontos de interesse cadastrados no inventário oficial de Santa Rita do Sapucaí.</p>

      <div className="explorar__filtros">
        <div className="ot-entrada-icone">
          <Icone nome="busca" />
          <input className="ot-entrada" type="search" placeholder="Buscar atrativos, hotéis ou gastronomia" aria-label="Buscar lugares" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="explorar__abas" role="group" aria-label="Categoria">
          {[{ id: 'todas', rotulo: 'Todos' }, ...CATEGORIAS_EXPLORAR].map((c) => (
            <button key={c.id} type="button" className="ot-btn ot-btn--p ot-btn--secundario" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}>
              {c.rotulo}
            </button>
          ))}
        </div>
      </div>

      {lista.length ? (
        <ul className="grade-3 explorar__lista" aria-live="polite">
          {lista.map((l) => {
            const c = CATEGORIA[l.categoria]
            return (
              <li key={l.id} className="ot-cartao explorar__card">
                {sessao?.perfil === 'turista' && <BotaoFavorito ativo={ids.includes(l.id)} nome={l.nome} aoAlternar={() => alternar(l.id)} />}
                {l.foto ? (
                  <Foto chave={l.foto} alt={`Foto de ${l.nome}`} proporcao="16 / 10" className="explorar__foto" />
                ) : (
                  <span className="explorar__foto explorar__foto--vazia" style={{ background: c.cor }}><Icone nome={c.icone} tamanho="l" /></span>
                )}
                <span className="ot-selo">{c.rotulo}</span>
                <h2 className="titulo-3">{l.nome}</h2>
                <p className="corpo-s suave">{l.texto}</p>
                <p className="corpo-s explorar__local"><Icone nome="pin" tamanho="s" /> {l.local}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="ot-vazio">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="busca" tamanho="l" /></span>
          <h2 className="titulo-3">Nada encontrado</h2>
          <button type="button" className="ot-btn ot-btn--secundario" onClick={() => { setBusca(''); setCategoria('todas') }}>Limpar filtros</button>
        </div>
      )}
      <p className="ot-fonte" style={{ marginTop: 24 }}>Lugares e descrições de exemplo para o protótipo. Fotos: Wikimedia Commons, com autor e licença em cada imagem.</p>
    </div>
  )
}
