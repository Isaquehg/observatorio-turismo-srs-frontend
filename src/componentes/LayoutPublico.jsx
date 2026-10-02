import { Outlet } from 'react-router-dom'
import Topo from './Topo'
import Rodape from './Rodape'

export default function LayoutPublico() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
      <Topo />
      <main id="conteudo" tabIndex={-1} style={{ outline: 'none' }}>
        <Outlet />
      </main>
      <Rodape />
    </>
  )
}
