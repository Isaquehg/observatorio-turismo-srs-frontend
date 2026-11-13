import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Sobretitulo } from '../../componentes/Basicos'
import { useSessao } from '../../contexto/Sessao'
import { CALENDARIO, EVENTOS } from '../../dados/cidade'
import { GRUPOS_ROTEIRO, todosOsLugares } from '../../dados/explorar'
import { useFavoritos } from '../../util/favoritos'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'
import './turista.css'

// Festas fixas da cidade (dados da página "Conheça a cidade")
const AGENDA = [
  ...EVENTOS.map((e) => ({ nome: e.nome, quando: e.quando, texto: e.resumo })),
  ...CALENDARIO.map((c) => ({ nome: c.nome, quando: c.mes, texto: c.texto })),
]

export default function InicioTurista() {
  useTitulo('Área do turista')
  const { sessao } = useSessao()
  const { ids } = useFavoritos()
  const salvos = todosOsLugares().filter((l) => ids.includes(l.id))

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do turista" titulo={`Olá, ${sessao.nome.split(' ')[0]}!`} cor="var(--azul-ceu)" />
      <p className="corpo suave" style={{ marginTop: -12, marginBottom: 24 }}>
        Monte o roteiro da sua visita: escolha onde ficar, onde comer e o que visitar no guia da cidade.
      </p>

      <section aria-labelledby="titulo-roteiro">
        <div className="secao__cab" style={{ marginBottom: 16 }}>
          <h2 className="titulo-2" id="titulo-roteiro">Meu roteiro</h2>
          {salvos.length > 0 && <Link className="ot-btn ot-btn--fantasma" to="/turista/favoritos">Ver roteiro <Icone nome="seta" /></Link>}
        </div>
        <div className="grade-3">
          {GRUPOS_ROTEIRO.map((g) => {
            const n = salvos.filter((l) => l.categoria === g.categoria).length
            return (
              <Link key={g.categoria} to={`/turista/explorar#${g.ancora}`} className="ot-mini ot-mini--linha">
                <span className="ot-indicador__icone" style={{ '--cor': g.cor, width: 56, height: 56 }}><Icone nome={g.icone} /></span>
                <div>
                  <span className="corpo" style={{ display: 'block', fontWeight: 700 }}>{g.titulo}</span>
                  <span className="corpo-s">{n ? `${n} ${n === 1 ? 'lugar guardado' : 'lugares guardados'}` : 'Nenhum ainda · ver opções'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="secao" aria-labelledby="titulo-agenda">
        <div className="secao__cab">
          <div>
            <Sobretitulo>Agenda da cidade</Sobretitulo>
            <h2 className="titulo-2" id="titulo-agenda">Festas e eventos para encaixar na viagem</h2>
          </div>
          <Link className="ot-btn ot-btn--fantasma" to="/conheca-a-cidade#eventos">Saiba mais <Icone nome="seta" /></Link>
        </div>
        <ul className="agenda">
          {AGENDA.map((a) => (
            <li key={a.nome}>
              <span className="agenda__quando"><Icone nome="calendario" tamanho="s" /> {a.quando}</span>
              <strong>{a.nome}</strong>
              <span className="corpo-s suave">{a.texto}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
