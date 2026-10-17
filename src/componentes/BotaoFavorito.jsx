import Icone from './Icone'

export default function BotaoFavorito({ ativo, nome, aoAlternar }) {
  return (
    <button
      type="button"
      className="favorito"
      aria-pressed={ativo}
      aria-label={ativo ? `Tirar ${nome} dos favoritos` : `Salvar ${nome} nos favoritos`}
      onClick={aoAlternar}
    >
      <Icone nome="estrela" />
    </button>
  )
}
