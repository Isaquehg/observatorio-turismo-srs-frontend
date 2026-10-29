import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LayoutPublico from './componentes/LayoutPublico'
import RotaRestrita from './componentes/RotaRestrita'
import Inicio from './paginas/Inicio'
import Indicadores from './paginas/Indicadores'
import IndicadoresPublicos from './paginas/IndicadoresPublicos'
import Relatorios from './paginas/Relatorios'
import Explorar from './paginas/turista/Explorar'
import Sobre from './paginas/Sobre'
import Entrar from './paginas/Entrar'
import NaoEncontrada from './paginas/NaoEncontrada'
import { AreaComerciante, AreaPrefeitura } from './paginas/Areas'
import InicioComerciante from './paginas/comerciante/InicioComerciante'
import Enviar from './paginas/comerciante/Enviar'
import Historico from './paginas/comerciante/Historico'
import Estabelecimento from './paginas/comerciante/Estabelecimento'
import Guia from './paginas/comerciante/Guia'
import VisaoGeral from './paginas/prefeitura/VisaoGeral'
import Envios from './paginas/prefeitura/Envios'
import Inventario from './paginas/prefeitura/Inventario'
import Estabelecimentos from './paginas/prefeitura/Estabelecimentos'
import RelatoriosGerenciais from './paginas/prefeitura/RelatoriosGerenciais'
import { comportamentoRolagem } from './util/ganchos'

// Ao trocar de página: volta ao topo, ou rola até a âncora (#contato etc.)
function GerenciarRolagem() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const alvo = document.getElementById(hash.slice(1))
      if (alvo) {
        requestAnimationFrame(() => alvo.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' }))
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// Temporary component to verify Vercel -> API connectivity
function StatusApi() {
  const [status, setStatus] = useState({ loading: true, data: null, error: null })
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

  useEffect(() => {
    fetch(`${apiUrl}/api/health/database`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(JSON.stringify(json))
        setStatus({ loading: false, data: json, error: null })
      })
      .catch((err) => {
        setStatus({ loading: false, data: null, error: err.message })
      })
  }, [apiUrl])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>Diagnóstico de Conexão (Front-end ↔ AWS)</h2>
      <p><strong>VITE_API_URL ativa:</strong> {apiUrl}</p>
      {status.loading && <p>Testando conexão com EC2 e RDS...</p>}
      {status.data && (
        <pre style={{ background: '#e6fffa', padding: '1rem', borderRadius: '8px', color: '#004d40' }}>
          ✅ Conectado com sucesso!{'\n\n'}
          {JSON.stringify(status.data, null, 2)}
        </pre>
      )}
      {status.error && (
        <pre style={{ background: '#ffe6e6', padding: '1rem', borderRadius: '8px', color: '#b71c1c' }}>
          ❌ Falha na conexão:{'\n\n'}
          {status.error}
        </pre>
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <GerenciarRolagem />
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route index element={<Inicio />} />
          <Route path="indicadores-publicos" element={<IndicadoresPublicos />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="status-api" element={<StatusApi />} />
          {/* Pedem login de qualquer perfil */}
          <Route element={<RotaRestrita />}>
            <Route path="indicadores" element={<Indicadores />} />
            <Route path="relatorios" element={<Relatorios />} />
          </Route>
          <Route element={<RotaRestrita perfil="turista" />}>
            <Route path="turista" element={<Explorar />} />
          </Route>
          {/* O guia do Cadastur agora fica na área do comerciante */}
          <Route path="cadastur" element={<Navigate to="/comerciante/guia" replace />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>

        <Route path="entrar" element={<Entrar />} />

        <Route path="comerciante" element={<AreaComerciante />}>
          <Route index element={<InicioComerciante />} />
          <Route path="enviar" element={<Enviar />} />
          <Route path="historico" element={<Historico />} />
          <Route path="estabelecimento" element={<Estabelecimento />} />
          <Route path="guia" element={<Guia />} />
        </Route>

        <Route path="prefeitura" element={<AreaPrefeitura />}>
          <Route index element={<VisaoGeral />} />
          <Route path="envios" element={<Envios />} />
          <Route path="estabelecimentos" element={<Estabelecimentos />} />
          <Route path="relatorios" element={<RelatoriosGerenciais />} />
          <Route path="inventario" element={<Inventario />} />
        </Route>
      </Routes>
    </>
  )
}
