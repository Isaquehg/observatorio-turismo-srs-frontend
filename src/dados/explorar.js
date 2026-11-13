import { HOSPEDAGENS, PONTOS_TURISTICOS } from './turismo'
import { LUGARES } from './cidade'
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

const mesmoNome = (a, b) => normalizar(a) === normalizar(b)
// Id estável pelo nome: os favoritos não se perdem quando a ordem das listas muda
export const slug = (nome) => normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// "O que visitar": os lugares reais da página "Conheça a cidade" (cidade.js), com foto quando há uma licenciada
// em turismo.js, mais os atrativos que a prefeitura marcou para o site no inventário.
// Um item do inventário com o mesmo nome de um lugar fixo manda nele: desmarcar "mostrar no site" esconde o lugar.
export function pontosVisiveis() {
  const inventario = lerInventario()
  const doInventario = (nome) => inventario.find((i) => mesmoNome(i.nome, nome))
  const comFoto = (nome) => PONTOS_TURISTICOS.find((p) => mesmoNome(p.nome, nome))
  const fixos = [
    ...LUGARES.map((l) => {
      const p = comFoto(l.nome)
      return { nome: l.nome, categoria: p?.categoria, texto: p?.texto || '', local: l.onde, quando: l.quando, foto: p?.foto, icone: l.icone }
    }),
    // Pontos com foto que não estão na lista da Lavinia (ex.: Rio Sapucaí)
    ...PONTOS_TURISTICOS.filter((p) => !LUGARES.some((l) => mesmoNome(l.nome, p.nome))),
  ]
    .map((p) => ({ ...p, id: `lugar-${slug(p.nome)}` }))
    .filter((p) => doInventario(p.nome)?.publicar !== false)
  const novos = inventario
    .filter((i) => i.publicar && i.descricao && ehAtrativo(i.categoria) && !fixos.some((p) => mesmoNome(p.nome, i.nome)))
    .map((i) => ({ id: `inv-${i.id}`, nome: i.nome, categoria: i.categoria, texto: i.descricao, local: i.local }))
  return [...fixos, ...novos]
}

// Card do estabelecimento de exemplo do comerciante: o que ele salva em "Meu estabelecimento" atualiza este card.
// Fica junto das hospedagens reais, marcado como exemplo; desmarcar "mostrar para turistas" tira o card da lista.
const EXEMPLO = {
  nome: MEU_NEGOCIO.nome,
  tipo: MEU_NEGOCIO.tipo,
  endereco: MEU_NEGOCIO.endereco,
  telefone: MEU_NEGOCIO.telefone,
  foto: 'hosp-pousada-jardim',
  bairro: 'Centro',
  preco: '$$',
  destaques: ['Café da manhã mineiro', 'Jardim', 'Wi-Fi'],
  exemplo: true,
}

export function hospedagensVisiveis() {
  const d = ler(CHAVE_ESTABELECIMENTO, {})
  const reais = HOSPEDAGENS.map((h) => ({ ...h, id: slug(h.nome) }))
  if (d.publicar === false) return reais
  const destaques = d.destaques ? d.destaques.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 3) : EXEMPLO.destaques
  return [...reais, { ...EXEMPLO, id: 'exemplo', bairro: d.area || EXEMPLO.bairro, preco: d.preco || EXEMPLO.preco, destaques, descricao: d.descricao || '' }]
}

export function todosOsLugares() {
  return [
    ...hospedagensVisiveis().map((h) => ({ id: `hosp-${h.id}`, nome: h.nome, categoria: 'hospedagens', local: h.bairro || h.endereco, texto: h.descricao || h.endereco, foto: h.foto })),
    ...pontosVisiveis().map((p) => ({ id: p.id, nome: p.nome, categoria: 'atrativos', local: p.local, texto: p.texto, foto: p.foto })),
  ]
}
