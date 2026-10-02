import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import LayoutPublico from './componentes/LayoutPublico'
import Inicio from './paginas/Inicio'
import Indicadores from './paginas/Indicadores'
import Relatorios from './paginas/Relatorios'
import Cadastur from './paginas/Cadastur'
import Sobre from './paginas/Sobre'
import Entrar from './paginas/Entrar'
import NaoEncontrada from './paginas/NaoEncontrada'
import { AreaComerciante, AreaPrefeitura } from './paginas/Areas'
import InicioComerciante from './paginas/comerciante/InicioComerciante'
import Enviar from './paginas/comerciante/Enviar'
import Historico from './paginas/comerciante/Historico'
import Estabelecimento from './paginas/comerciante/Estabelecimento'
import VisaoGeral from './paginas/prefeitura/VisaoGeral'
import Envios from './paginas/prefeitura/Envios'
import Inventario from './paginas/prefeitura/Inventario'

// Ao trocar de página: volta ao topo, ou rola até a âncora (#contato etc.)
function GerenciarRolagem() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const alvo = document.getElementById(hash.slice(1))
      if (alvo) {
        requestAnimationFrame(() => alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <GerenciarRolagem />
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route index element={<Inicio />} />
          <Route path="indicadores" element={<Indicadores />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="cadastur" element={<Cadastur />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>

        <Route path="entrar" element={<Entrar />} />

        <Route path="comerciante" element={<AreaComerciante />}>
          <Route index element={<InicioComerciante />} />
          <Route path="enviar" element={<Enviar />} />
          <Route path="historico" element={<Historico />} />
          <Route path="estabelecimento" element={<Estabelecimento />} />
        </Route>

        <Route path="prefeitura" element={<AreaPrefeitura />}>
          <Route index element={<VisaoGeral />} />
          <Route path="envios" element={<Envios />} />
          <Route path="inventario" element={<Inventario />} />
        </Route>
      </Routes>
    </>
  )
}
