import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessao } from '../contexto/Sessao'

// Páginas do site que pedem login (qualquer perfil). Sem sessão, manda para o Entrar e volta depois.
export default function RotaRestrita() {
  const { sessao } = useSessao()
  const local = useLocation()

  if (!sessao) {
    return <Navigate to="/entrar?perfil=turista" replace state={{ voltarPara: local.pathname + local.hash, restrita: true }} />
  }
  return <Outlet />
}
