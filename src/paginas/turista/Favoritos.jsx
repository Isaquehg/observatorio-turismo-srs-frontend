import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { GRUPOS_ROTEIRO, todosOsLugares } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import Telefone from './Telefone'
import '../painel.css'
import './turista.css'

export default function Favoritos() {
  useTitulo('Meu roteiro')
  const { ids, alternar } = useFavoritos()
  const lista = todosOsLugares().filter((l) => ids.includes(l.id))

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do turista" titulo="Meu roteiro" cor="var(--azul-ceu)">
        {lista.length > 0 && (
          <button type="button" className="ot-btn ot-btn--secundario so-desktop" onClick={() => window.print()}>
            <Icone nome="download" /> Imprimir
          </button>
        )}
      </TopoPainel>
      <p className="corpo suave" style={{ marginTop: -12, marginBottom: 24 }}>
        Os lugares que você guardou, com endereço e telefone para a viagem. Ficam salvos neste aparelho.
      </p>

      {lista.length ? (
        GRUPOS_ROTEIRO.map((g) => {
          const itens = lista.filter((l) => l.categoria === g.categoria)
          if (!itens.length) return null
          return (
            <section key={g.categoria} className="roteiro__grupo">
              <h2 className="titulo-3 roteiro__titulo">
                <span className="ot-indicador__icone" style={{ '--cor': g.cor }}><Icone nome={g.icone} /></span>
                {g.titulo} <span className="suave">({itens.length})</span>
              </h2>
              <ul className="roteiro__lista">
                {itens.map((f) => (
                  <li key={f.id}>
                    <div className="roteiro__dados">
                      <strong>{f.nome}</strong>
                      <span className="corpo-s suave"><Icone nome="pin" tamanho="s" /> {f.local}</span>
                      {f.quando && <span className="corpo-s suave"><Icone nome="relogio" tamanho="s" /> {f.quando}</span>}
                      {f.telefone && <span className="corpo-s"><Telefone numero={f.telefone} /></span>}
                    </div>
                    <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => alternar(f.id)} aria-label={`Tirar ${f.nome} do roteiro`}>Remover</button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      ) : (
        <div className="ot-vazio ot-cartao">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="estrela" tamanho="l" /></span>
          <h2 className="titulo-3">Seu roteiro está vazio</h2>
          <p className="corpo suave">No guia da cidade, toque na estrela de hospedagens, restaurantes e pontos turísticos para guardar aqui.</p>
          <Link className="ot-btn ot-btn--primario" to="/turista/explorar">Abrir o guia <Icone nome="seta" /></Link>
        </div>
      )}
    </div>
  )
}
