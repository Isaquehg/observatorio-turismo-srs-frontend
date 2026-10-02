// Estabelecimentos, envios e inventário de exemplo para as áreas logadas.

export const MEU_NEGOCIO = {
  nome: 'Pousada Recanto da Serra',
  tipo: 'Pousada',
  cnpj: '12.345.678/0001-90',
  responsavel: 'Marina Alves',
  email: 'contato@recantodaserra.com.br',
  telefone: '(35) 99812-4470',
  endereco: 'Rua Coronel Erasmo Cabral, 418 — Centro',
  quartos: 18,
  leitos: 46,
  cadasturValidade: 'março de 2027',
}

// Envios do próprio comerciante (mais recente primeiro)
export const historicoComerciante = [
  { ano: 2026, mes: 8, ocupacao: 71, diarias: 396, hospedes: 512, funcionarios: 6, enviadoEm: '02/09', situacao: 'publicado', mediaCidade: 58, mediaTipo: 62 },
  { ano: 2026, mes: 7, ocupacao: 64, diarias: 357, hospedes: 461, funcionarios: 6, enviadoEm: '05/08', situacao: 'publicado', mediaCidade: 60, mediaTipo: 61 },
  { ano: 2026, mes: 6, ocupacao: null, diarias: 301, hospedes: 388, funcionarios: 5, enviadoEm: '08/07', situacao: 'recusado', motivo: 'O número de leitos estava maior que a capacidade cadastrada.', mediaCidade: 53, mediaTipo: 55 },
  { ano: 2026, mes: 5, ocupacao: 52, diarias: 290, hospedes: 362, funcionarios: 5, enviadoEm: '03/06', situacao: 'publicado', mediaCidade: 49, mediaTipo: 50 },
  { ano: 2026, mes: 4, ocupacao: 55, diarias: 297, hospedes: 371, funcionarios: 5, enviadoEm: '04/05', situacao: 'publicado', mediaCidade: 50, mediaTipo: 52 },
  { ano: 2026, mes: 3, ocupacao: 58, diarias: 324, hospedes: 405, funcionarios: 5, enviadoEm: '06/04', situacao: 'publicado', mediaCidade: 52, mediaTipo: 54 },
  { ano: 2026, mes: 2, ocupacao: 49, diarias: 247, hospedes: 318, funcionarios: 5, enviadoEm: '04/03', situacao: 'publicado', mediaCidade: 48, mediaTipo: 47 },
  { ano: 2026, mes: 1, ocupacao: 51, diarias: 285, hospedes: 352, funcionarios: 5, enviadoEm: '05/02', situacao: 'publicado', mediaCidade: 46, mediaTipo: 49 },
]

export const enviosIniciais = [
  { id: 1, nome: 'Pousada Vila Rica', tipo: 'Pousada', ano: 2026, mes: 9, recebido: 'Ontem, 18:42', ocupacao: 63, leitos: 40, diarias: 284, situacao: 'analise' },
  { id: 2, nome: 'Hotel Vale da Eletrônica', tipo: 'Hotel', ano: 2026, mes: 9, recebido: 'Ontem, 10:05', ocupacao: 71, leitos: 120, diarias: 1704, situacao: 'analise' },
  { id: 3, nome: 'Hostel Sapucaí', tipo: 'Hostel', ano: 2026, mes: 9, recebido: '27/09, 21:10', ocupacao: 112, leitos: 32, diarias: 1075, situacao: 'analise', problema: 'Acima de 100%' },
  { id: 4, nome: 'Chalés da Mantiqueira', tipo: 'Chalé', ano: 2026, mes: 9, recebido: '26/09, 09:30', ocupacao: 48, leitos: 24, diarias: 115, situacao: 'analise' },
  { id: 5, nome: 'Hotel Central', tipo: 'Hotel', ano: 2026, mes: 8, recebido: '25/09, 16:12', ocupacao: 66, leitos: 84, diarias: 1146, situacao: 'analise', atrasado: true },
  { id: 6, nome: 'Pousada Flor do Café', tipo: 'Pousada', ano: 2026, mes: 9, recebido: '25/09, 08:47', ocupacao: 57, leitos: 28, diarias: 205, situacao: 'analise', atrasado: true },
  { id: 7, nome: 'Sítio Águas Claras', tipo: 'Chalé', ano: 2026, mes: 9, recebido: '24/09, 19:20', ocupacao: 39, leitos: 16, diarias: 56, situacao: 'analise' },
  { id: 8, nome: 'Hotel Monte Verde', tipo: 'Hotel', ano: 2026, mes: 8, recebido: '03/09, 11:02', ocupacao: 69, leitos: 96, diarias: 1283, situacao: 'publicado' },
  { id: 9, nome: 'Pousada Serra Azul', tipo: 'Pousada', ano: 2026, mes: 8, recebido: '02/09, 15:30', ocupacao: 61, leitos: 30, diarias: 236, situacao: 'publicado' },
  { id: 10, nome: 'Hostel Estação', tipo: 'Hostel', ano: 2026, mes: 8, recebido: '01/09, 20:14', ocupacao: 54, leitos: 22, diarias: 148, situacao: 'recusado', motivo: 'Diárias acima do possível para a capacidade.' },
]

export const naoEnviaram = [
  'Hotel Fazenda Boa Vista', 'Pousada Jardim', 'Chalé Recanto Verde', 'Pousada do Largo', 'Hotel Executivo SRS',
  'Hostel da Praça', 'Pousada Morro Alto', 'Chalés Bela Vista', 'Hotel Ipê', 'Pousada Caminho da Serra',
  'Sítio do Vale', 'Pousada São Benedito', 'Hotel Avenida', 'Aluguel Casa do Rio', 'Pousada Raízes',
]

export const CATEGORIAS_INVENTARIO = ['Atrativo cultural', 'Atrativo natural', 'Equipamento de apoio', 'Serviço turístico', 'Evento permanente']

export const inventarioInicial = [
  { id: 1, nome: 'Igreja Matriz de Santa Rita de Cássia', local: 'Centro', categoria: 'Atrativo cultural', atualizado: '2026-03-14', situacao: 'em-dia' },
  { id: 2, nome: 'Mirante da serra', local: 'Zona rural', categoria: 'Atrativo natural', atualizado: '2025-11-02', situacao: 'revisar' },
  { id: 3, nome: 'Museu municipal', local: 'Centro', categoria: 'Atrativo cultural', atualizado: '2026-08-20', situacao: 'em-dia' },
  { id: 4, nome: 'Rodoviária Municipal', local: 'Centro', categoria: 'Equipamento de apoio', atualizado: '2025-01-08', situacao: 'desatualizado' },
  { id: 5, nome: 'Centro de Atendimento ao Turista', local: 'Centro', categoria: 'Serviço turístico', atualizado: '2026-06-30', situacao: 'em-dia' },
  { id: 6, nome: 'Cachoeira da zona rural', local: 'Zona rural', categoria: 'Atrativo natural', atualizado: '2025-09-19', situacao: 'revisar' },
  { id: 7, nome: 'Praça Santa Rita', local: 'Centro', categoria: 'Atrativo cultural', atualizado: '2026-05-11', situacao: 'em-dia' },
  { id: 8, nome: 'Feira de artesanato de domingo', local: 'Centro', categoria: 'Evento permanente', atualizado: '2026-04-02', situacao: 'em-dia' },
  { id: 9, nome: 'Trilha do Ribeirão', local: 'Zona rural', categoria: 'Atrativo natural', atualizado: '2026-02-17', situacao: 'em-dia' },
  { id: 10, nome: 'Estacionamento turístico', local: 'Centro', categoria: 'Equipamento de apoio', atualizado: '2026-07-09', situacao: 'em-dia' },
]

export const SITUACAO_INVENTARIO = {
  'em-dia': { rotulo: 'Em dia', selo: 'publicado', icone: 'check-circulo' },
  revisar: { rotulo: 'Revisar em 15 dias', selo: 'analise', icone: 'relogio' },
  desatualizado: { rotulo: 'Desatualizado', selo: 'recusado', icone: 'alerta' },
}

export const INDICADORES_PUBLICAVEIS = ['Empregos no setor', 'Empresas do turismo', 'Leitos disponíveis', 'Meios de hospedagem', 'Visitantes estimados']
