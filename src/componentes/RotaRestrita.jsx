import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessao } from '../contexto/Sessao'

// Páginas do site que pedem login. Sem `perfil`, vale qualquer perfil.
// Sem a sessão certa, manda para o Entrar e volta depois.
export default function RotaRestrita({ perfil }) {
  const { sessao } = useSessao()
  const local = useLocation()

  if (!sessao || (perfil && sessao.perfil !== perfil)) {
    return <Navigate to={`/entrar?perfil=${perfil || 'turista'}`} replace state={{ voltarPara: local.pathname + local.hash, restrita: true }} />
  }
  return <Outlet />
}
