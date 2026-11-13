import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { CATEGORIAS_EXPLORAR, todosOsLugares } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'
import './turista.css'

const CATEGORIA = Object.fromEntries(CATEGORIAS_EXPLORAR.map((c) => [c.id, c.rotulo]))

export default function Favoritos() {
  useTitulo('Meus favoritos')
  const { ids, alternar } = useFavoritos()
  const lista = todosOsLugares().filter((l) => ids.includes(l.id))

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do turista" titulo="Meus favoritos" cor="var(--azul-ceu)" />
      <p className="corpo suave" style={{ marginTop: -12, marginBottom: 24 }}>Lugares que você salvou. Ficam guardados neste aparelho.</p>

      {lista.length ? (
        <ul className="favoritos-lista favoritos-lista--cheia">
          {lista.map((f) => (
            <li key={f.id}>
              <span>
                <strong>{f.nome}</strong>
                <span className="corpo-s suave">{CATEGORIA[f.categoria]} · {f.local}</span>
              </span>
              <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => alternar(f.id)} aria-label={`Tirar ${f.nome} dos favoritos`}>Remover</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ot-vazio ot-cartao">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="estrela" tamanho="l" /></span>
          <h2 className="titulo-3">Nenhum favorito ainda</h2>
          <p className="corpo suave">Toque na estrela dos cards para salvar hospedagens e pontos turísticos.</p>
          <Link className="ot-btn ot-btn--primario" to="/turista/explorar">Explorar a cidade <Icone nome="seta" /></Link>
        </div>
      )}
    </div>
  )
}
