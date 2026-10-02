import { Link } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Sobretitulo } from '../componentes/Basicos'
import { useTitulo } from '../util/ganchos'
import './publico.css'

export default function NaoEncontrada() {
  useTitulo('Página não encontrada')
  return (
    <div className="container nao-encontrada surgir">
      <div>
        <p className="nao-encontrada__num" aria-hidden="true">404</p>
        <Sobretitulo>Página não encontrada</Sobretitulo>
        <h1 className="titulo-1" style={{ marginTop: 10 }}>Esse caminho não está no mapa</h1>
        <p className="corpo suave" style={{ marginTop: 12, maxWidth: '44ch' }}>
          O endereço pode ter mudado ou ter sido digitado errado. Que tal voltar para o começo?
        </p>
        <div className="linha-acoes" style={{ marginTop: 24 }}>
          <Link to="/" className="ot-btn ot-btn--primario"><Icone nome="casa" /> Ir para o início</Link>
          <Link to="/indicadores" className="ot-btn ot-btn--secundario">Ver indicadores</Link>
        </div>
      </div>
      <div className="nao-encontrada__arte" aria-hidden="true">
        <img src="ilustracoes/turista.svg" alt="" />
      </div>
    </div>
  )
}
