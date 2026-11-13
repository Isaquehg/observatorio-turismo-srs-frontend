import Icone from '../../componentes/Icone'

export default function Telefone({ numero }) {
  if (!numero) return null
  return <a href={`tel:+55${numero.replace(/\D/g, '')}`}><Icone nome="telefone" tamanho="s" /> {numero}</a>
}
