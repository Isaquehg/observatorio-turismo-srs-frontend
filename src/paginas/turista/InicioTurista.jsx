import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Sobretitulo } from '../../componentes/Basicos'
import { useSessao } from '../../contexto/Sessao'
import { todosOsLugares } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'
import './turista.css'

const ATALHOS = [
  { para: '/turista/explorar#onde-ficar', rotulo: 'Onde ficar', texto: 'Hotéis, pousadas e chalés.', icone: 'cama', cor: 'var(--amarelo)' },
  { para: '/turista/explorar#sabores', rotulo: 'O que provar', texto: 'Sabores mineiros da região.', icone: 'garfo', cor: 'var(--rosa)' },
  { para: '/turista/explorar#o-que-visitar', rotulo: 'O que visitar', texto: 'Pontos turísticos da cidade.', icone: 'mapa', cor: 'var(--ciano)' },
]

export default function InicioTurista() {
  useTitulo('Área do turista')
  const { sessao } = useSessao()
  const { ids } = useFavoritos()
  const favoritos = todosOsLugares().filter((l) => ids.includes(l.id))

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do turista" titulo={`Olá, ${sessao.nome.split(' ')[0]}!`} cor="var(--azul-ceu)" />
      <p className="corpo suave" style={{ marginTop: -12, marginBottom: 24 }}>
        Curiosidades, onde ficar, o que comer e o que visitar na Cidade Criativa do Sul de Minas.
      </p>

      <div className="grade-3">
        {ATALHOS.map((a) => (
          <Link key={a.para} to={a.para} className="ot-mini ot-mini--linha">
            <span className="ot-indicador__icone" style={{ '--cor': a.cor, width: 56, height: 56 }}><Icone nome={a.icone} /></span>
            <div>
              <span className="corpo" style={{ display: 'block', fontWeight: 700 }}>{a.rotulo}</span>
              <span className="corpo-s suave">{a.texto}</span>
            </div>
          </Link>
        ))}
      </div>

      <section className="secao">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Salvos por você</Sobretitulo>
            <h2 className="titulo-1">Meus favoritos</h2>
          </div>
          {favoritos.length > 3 && (
            <Link className="ot-btn ot-btn--fantasma" to="/turista/favoritos">Ver todos ({favoritos.length}) <Icone nome="seta" /></Link>
          )}
        </div>
        {favoritos.length ? (
          <ul className="favoritos-lista">
            {favoritos.slice(0, 3).map((f) => (
              <li key={f.id}><span><strong>{f.nome}</strong><span className="corpo-s suave">{f.local}</span></span></li>
            ))}
          </ul>
        ) : (
          <p className="corpo suave">
            Você ainda não salvou nenhum lugar. Toque na estrela dos cards em <Link to="/turista/explorar">Explorar a cidade</Link>.
          </p>
        )}
      </section>
    </div>
  )
}
