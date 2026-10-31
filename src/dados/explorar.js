import { HOSPEDAGENS, PONTOS_TURISTICOS } from './turismo'
import { MEU_NEGOCIO } from './painel'
import { ler } from '../util/armazenamento'

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

// Hospedagens e pontos turísticos vêm de turismo.js (única fonte). Aqui só entram os itens que ainda não têm foto.
const EXTRAS = [
  { id: 'x-parque', nome: 'Parque Tecnológico', categoria: 'atrativos', local: 'Bairro Inatel', texto: 'Epicentro de inovação aberta, hackathons corporativos e visitas guiadas ao Vale da Eletrônica.' },
  { id: 'x-mirante', nome: 'Mirante da Serra', categoria: 'atrativos', local: 'Estrada do Cruzeiro', texto: 'Ponto mais alto, perfeito para assistir ao pôr do sol sobre o vale da eletrônica.' },
  { id: 'x-sabor', nome: 'Restaurante Sabor Mineiro', categoria: 'restaurantes', local: 'Centro', texto: 'A clássica culinária sul-mineira no fogão a lenha, com releituras gourmet contemporâneas.' },
  { id: 'x-convencoes', nome: 'Centro de Convenções', categoria: 'equipamentos', local: 'Distrito Industrial', texto: 'Infraestrutura completa para mostras de tecnologia, congressos e feiras nacionais.' },
  { id: 'x-turista', nome: 'Centro de Atendimento ao Turista', categoria: 'servicos', local: 'Centro', texto: 'Mapas, roteiros e informações sobre hospedagem, gastronomia e passeios na cidade.' },
]

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
    ...PONTOS_TURISTICOS.map((p, i) => ({ id: `ponto-${i}`, nome: p.nome, categoria: 'atrativos', local: p.local, texto: p.texto, foto: p.foto })),
    ...EXTRAS,
  ]
}
