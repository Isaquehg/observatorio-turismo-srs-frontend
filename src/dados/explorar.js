import { HOSPEDAGENS, PONTOS_TURISTICOS } from './turismo'
import { MEU_NEGOCIO, inventarioInicial } from './painel'
import { ler } from '../util/armazenamento'
import { normalizar } from '../util/formatar'

export const CATEGORIAS_EXPLORAR = [
  { id: 'atrativos', rotulo: 'Atrativos', icone: 'mapa', cor: 'var(--ciano)' },
  { id: 'hospedagens', rotulo: 'Hospedagens', icone: 'cama', cor: 'var(--amarelo)' },
  { id: 'restaurantes', rotulo: 'Restaurantes', icone: 'garfo', cor: 'var(--rosa)' },
  { id: 'servicos', rotulo: 'Serviços', icone: 'loja', cor: 'var(--azul-ceu)' },
  { id: 'equipamentos', rotulo: 'Equipamentos', icone: 'predio', cor: 'var(--lilas)' },
]

// Áreas da cidade que o comerciante escolhe ao informar onde opera
export const AREAS = ['Centro', 'Bairros', 'Zona rural', 'Distritos']
export const FAIXAS_PRECO = { $: 'Econômico', $$: 'Intermediário', $$$: 'Mais sofisticado' }

// Chave do que o comerciante salva em "Meu estabelecimento"
export const CHAVE_ESTABELECIMENTO = 'ot-srs:estabelecimento'

// Inventário da prefeitura, editado em /prefeitura/inventario
export const CHAVE_INVENTARIO = 'ot-srs:inventario'
export const lerInventario = () => ler(CHAVE_INVENTARIO, inventarioInicial)
export const ehAtrativo = (categoria) => categoria.startsWith('Atrativo') || categoria === 'Evento permanente'

// "O que visitar": os pontos fixos com foto (turismo.js) mais os atrativos que a prefeitura marcou para o site.
// Um item do inventário com o mesmo nome de um ponto fixo manda nele: desmarcar "mostrar no site" esconde o ponto.
export function pontosVisiveis() {
  const inventario = lerInventario()
  const doInventario = (nome) => inventario.find((i) => normalizar(i.nome) === normalizar(nome))
  const fixos = PONTOS_TURISTICOS.map((p, i) => ({ ...p, id: `ponto-${i}` })).filter((p) => doInventario(p.nome)?.publicar !== false)
  const novos = inventario
    .filter((i) => i.publicar && i.descricao && ehAtrativo(i.categoria) && !PONTOS_TURISTICOS.some((p) => normalizar(p.nome) === normalizar(i.nome)))
    .map((i) => ({ id: `inv-${i.id}`, nome: i.nome, categoria: i.categoria, texto: i.descricao, local: i.local }))
  return [...fixos, ...novos]
}

// O negócio do comerciante já está na lista de hospedagens: o que ele salva em "Meu estabelecimento" atualiza esse card.
// Sem nada salvo, o card fica como no turismo.js; desmarcar "mostrar para turistas" tira o card da lista.
export function hospedagensVisiveis() {
  const d = ler(CHAVE_ESTABELECIMENTO, {})
  return HOSPEDAGENS.flatMap((h) => {
    if (h.nome !== MEU_NEGOCIO.nome) return [h]
    if (d.publicar === false) return []
    const destaques = d.destaques ? d.destaques.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 3) : h.destaques
    return [{ ...h, bairro: d.area || h.bairro, preco: d.preco || h.preco, destaques, descricao: d.descricao || '' }]
  })
}

export function todosOsLugares() {
  return [
    ...hospedagensVisiveis().map((h) => ({ id: `hosp-${h.id}`, nome: h.nome, categoria: 'hospedagens', local: h.bairro, texto: h.descricao || h.destaques.join(' · '), foto: h.foto })),
    ...pontosVisiveis().map((p) => ({ id: p.id, nome: p.nome, categoria: 'atrativos', local: p.local, texto: p.texto, foto: p.foto })),
  ]
}
