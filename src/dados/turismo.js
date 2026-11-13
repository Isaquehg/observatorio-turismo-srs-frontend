// Conteúdo da área do turista. Fotos do Wikimedia Commons, com autor e licença em FOTOS.

export const FOTOS = {
  'praca-santa-rita': { autor: 'Luciene Rosa', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:COQUEIROS_NA_P%C3%87A_SANTA_RITA_-_panoramio.jpg' },
  'natal-praca': { autor: 'Luciene Rosa', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:NATAL_EM_SANTA_RITA_DO_SAPUCAI_-_panoramio.jpg' },
  'rio-sapucai': { autor: 'WOtP', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Rio_Sapuca%C3%AD_em_Santa_Rita_do_Sapuca%C3%AD.jpg' },
  'estacao-ferroviaria': { autor: 'Eduardo P', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Esta%C3%A7%C3%A3o_ferrovi%C3%A1ria_de_Santa_Rita_do_Sapuca%C3%AD.jpg' },
  'hosp-pousada-jardim': { autor: 'José Marques de Oliveira', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Ibiti%C3%BAra_de_Minas_-_State_of_Minas_Gerais,_Brazil_-_panoramio_(3).jpg' },
}

// Hospedagens e gastronomia: listas do portal oficial visitesrs.com.br (lidas em nov. 2026).
// Endereços e telefones vêm do texto do portal: confirmar com a SMCELT antes de publicar.
export const HOSPEDAGENS = [
  { nome: 'Camping Pedra do Osso', tipo: 'Camping', endereco: 'R. Orlando Mattos da Costa, 100 · Santa Rita 2', telefone: '(35) 98404-0069' },
  { nome: 'Crisal Hotel', tipo: 'Hotel', endereco: 'Av. João de Camargo, 255 · Centro', telefone: '(35) 3471-3322' },
  { nome: 'Fazenda Pinhal', tipo: 'Fazenda', endereco: 'Estrada Vargedo, s/n · Vintém', telefone: '(35) 98853-2419' },
  { nome: 'Fazenda Sagrada Família', tipo: 'Fazenda', endereco: 'Balaio', telefone: '(35) 3471-2365' },
  { nome: 'Hostel Vila Fernando', tipo: 'Hostel', endereco: 'R. Antônio de Cássia Filho, 459, casa 2 · Santo Antônio', telefone: '(35) 98820-2106' },
  { nome: 'Hotel Real Palace', tipo: 'Hotel', endereco: 'R. Silvestre Ferraz, 73 · Centro', telefone: '(35) 3471-7000' },
  { nome: 'Hotel Tadini', tipo: 'Hotel', endereco: 'Av. Francisco Andrade Ribeiro, 99 · Família Andrade', telefone: '(35) 3473-0595' },
  { nome: 'Pousada Rancho do Marçal', tipo: 'Pousada', endereco: 'Estrada do Balaio, s/n · Balaio', telefone: '(35) 99727-5537' },
  { nome: 'Pousada do Barão', tipo: 'Pousada', endereco: 'Condomínio Costa, 105 · Centro', telefone: '(35) 9984-1921' },
  { nome: 'Sapucaia Flat', tipo: 'Flat', endereco: 'R. Prof. Mendonça, 161 · Monte Líbano', telefone: '(35) 99966-1551' },
]

export const GASTRONOMIA = [
  { nome: 'Bar e Restaurante do Bá', endereco: 'Av. Sapucaí, 77 · Boa Vista', telefone: '(35) 3471-1142' },
  { nome: 'Barão Cafeteria', endereco: 'Condomínio Costa, 105 · Centro', telefone: '(35) 98885-0509' },
  { nome: 'Beer House', endereco: 'Praça Delfim Moreira Júnior, 54 · Centro', telefone: '(35) 99196-5696' },
  { nome: 'Culinária Nassar', endereco: 'Delivery', telefone: '(35) 99218-6255' },
  { nome: 'Don Rafoni Smoke House', endereco: 'Av. João de Camargo, 120 · Vista Alegre', telefone: '(35) 99755-3000' },
  { nome: 'Dulle Pizzaria e Trattoria', endereco: 'R. Maria Andrade Moreira, 180 · Família Andrade', telefone: '(35) 99902-2001' },
  { nome: "Grandpa Joel's Coffee", endereco: 'R. Francisco M. da Costa, 123 · Centro', telefone: '(35) 99837-2491' },
  { nome: "Japa's House", endereco: 'R. Cel. Francisco Palma, 73 · Centro', telefone: '(35) 99970-2435' },
  { nome: 'La Fornalha', endereco: 'Av. Sinhá Moreira, 176 · Centro', telefone: '(35) 99863-1813' },
  { nome: 'Maria Maria Gastrobar', endereco: 'R. Francisco Moreira da Costa, 274 · Centro' },
  { nome: 'Nano Coffee Lab', endereco: 'R. Coronel Gabriel Capistrano, 138 · Centro', telefone: '(35) 99911-4539' },
  { nome: 'No Trabalho Bar', endereco: 'Fazenda São José · Bairro Fortaleza', telefone: '(35) 99911-2760' },
  { nome: 'O Cortês', endereco: 'Praça Santa Rita, 19 · Centro', telefone: '(35) 3471-7553' },
  { nome: 'Padaria Mundial Pães', endereco: 'R. Coronel Joaquim Inácio, 127 · Centro' },
  { nome: 'Padoca', endereco: 'Av. Frederico de Paula Cunha, 51 · Centro', telefone: '(35) 99139-2469' },
  { nome: 'Padrinhos Bar', endereco: 'R. Cinco, 13 · Lot. Ipanema', telefone: '(35) 99915-3658' },
  { nome: 'Pastello', endereco: 'R. Abraão Elias Kallas, 521 · Monte Líbano', telefone: '(35) 99818-7639' },
  { nome: 'Pastelzinho Corporation', endereco: 'R. Dr. José Ribeiro de Carvalho, 70 · Centro', telefone: '(35) 99855-6499' },
  { nome: 'Pesqueiro Tô a Toa', endereco: 'R. José Dias de Oliveira, 10 · São João', telefone: '(35) 99729-5594' },
  { nome: 'Pesqueiro do Zetinho', endereco: 'Estrada do Balaio', telefone: '(35) 99741-3459' },
  { nome: 'Pão de Sal Hamburgueria', endereco: 'Av. Frederico de Paula Cunha, 358 · Centro', telefone: '(35) 99831-0476' },
  { nome: 'Pós-Doc Brewpub', endereco: 'R. Coronel Antônio Moreira da Costa, 312 · Centro', telefone: '(35) 98401-1948' },
  { nome: 'Rancho Santa Fé', endereco: 'Estrada Portal da Serra Vintém, 35', telefone: '(35) 99714-5212' },
  { nome: 'SIS Coffee', endereco: 'R. Comend. Custódio Ribeiro, 137 · Centro', telefone: '(35) 98867-2535' },
  { nome: 'The Town Bar e Café', endereco: 'R. Genoveva da Fonseca, 214', telefone: '(35) 99769-6245' },
  { nome: 'Trailler Santa Rita', endereco: 'Praça Francisco Falcão, s/n · Centro', telefone: '(35) 3471-7798' },
]

export const PONTOS_TURISTICOS = [
  { nome: 'Praça Santa Rita', foto: 'praca-santa-rita', categoria: 'Centro histórico', texto: 'O coração da cidade, com coqueiros, bancos à sombra e movimento o dia todo. No fim do ano, ganha iluminação de Natal.', local: 'Centro' },
  { nome: 'Rio Sapucaí', foto: 'rio-sapucai', categoria: 'Natureza', texto: 'O rio que dá nome à cidade. Bom para uma caminhada no fim da tarde pelas margens arborizadas.', local: 'Centro' },
  { nome: 'Antiga estação ferroviária', foto: 'estacao-ferroviaria', categoria: 'Patrimônio', texto: 'Construída no fim do século XIX, da época em que o trem ligava a cidade ao resto do Sul de Minas.', local: 'Centro' },
  { nome: 'Natal na praça', foto: 'natal-praca', categoria: 'Evento', texto: 'Em dezembro, a praça vira um cartão-postal iluminado, com árvore de luzes e presépio.', local: 'Praça Santa Rita' },
]
