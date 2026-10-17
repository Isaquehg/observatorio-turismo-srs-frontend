// Conteúdo da área do turista. Fotos do Wikimedia Commons, com autor e licença em FOTOS.
// Hospedagens são exemplos do protótipo: nomes fictícios e fotos ilustrativas de outras cidades de Minas.

export const FOTOS = {
  'vista-cidade': { autor: 'Fronteira', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Vista_de_Santa_Rita_do_Sapuca%C3%AD.JPG' },
  'praca-santa-rita': { autor: 'Luciene Rosa', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:COQUEIROS_NA_P%C3%87A_SANTA_RITA_-_panoramio.jpg' },
  'natal-praca': { autor: 'Luciene Rosa', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:NATAL_EM_SANTA_RITA_DO_SAPUCAI_-_panoramio.jpg' },
  'ponte-pensil': { autor: 'Arquivo Público Mineiro', licenca: 'Domínio público', fonte: 'https://commons.wikimedia.org/wiki/File:Ponte_pensil_afonso_pena_em_santa_rita_do_sapucai.JPG' },
  'rio-sapucai': { autor: 'WOtP', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Rio_Sapuca%C3%AD_em_Santa_Rita_do_Sapuca%C3%AD.jpg' },
  'estacao-ferroviaria': { autor: 'Eduardo P', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Esta%C3%A7%C3%A3o_ferrovi%C3%A1ria_de_Santa_Rita_do_Sapuca%C3%AD.jpg' },
  'cafe-da-tarde': { autor: 'Jonathan Wilkins', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:P%C3%A3o_de_Queijo_-_cheese_bread.jpg' },
  'feijao-tropeiro': { autor: 'Moe Alves', licenca: 'CC BY 2.0', fonte: 'https://commons.wikimedia.org/wiki/File:Feij%C3%A3o_tropeiro.jpg' },
  'pao-de-queijo': { autor: 'Murilo Manzini', licenca: 'CC BY-SA 4.0', fonte: 'https://commons.wikimedia.org/wiki/File:Cheesebread.jpg' },
  'romeu-e-julieta': { autor: 'Monica Kaneko', licenca: 'CC BY-SA 2.0', fonte: 'https://commons.wikimedia.org/wiki/File:Bar_Guanabara_-_goiabada_com_queijo_(4775596692).jpg' },
  'cafe-coado': { autor: 'Melsj', licenca: 'CC BY-SA 4.0', fonte: 'https://commons.wikimedia.org/wiki/File:Caf%C3%A9_coado.jpg' },
  'hosp-pousada-jardim': { autor: 'José Marques de Oliveira', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Ibiti%C3%BAra_de_Minas_-_State_of_Minas_Gerais,_Brazil_-_panoramio_(3).jpg' },
  'hosp-chale-mata': { autor: 'Marinelson Almeida', licenca: 'CC BY 2.0', fonte: 'https://commons.wikimedia.org/wiki/File:Os_diversos_Chal%C3%A9s_na_Serra_da_Mantiqueira_-_MG._(9601364709).jpg' },
  'hosp-quarto-hotel': { autor: 'Elisete Reis', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Quarto_da_Pousada_de_Estoi.jpg' },
  'hosp-cafezal': { autor: 'Leonardo Gazella', licenca: 'CC BY-SA 4.0', fonte: 'https://commons.wikimedia.org/wiki/File:Hotel_Fazenda_Bom_Cafe.jpg' },
  'hosp-amanhecer': { autor: 'Francisco Boratto', licenca: 'CC BY-SA 4.0', fonte: 'https://commons.wikimedia.org/wiki/File:16-Amanhecer_no_Hotel_Fazenda_Bela_Vista.jpg' },
  'hosp-quarto-madeira': { autor: 'Elisete Reis', licenca: 'CC BY-SA 3.0', fonte: 'https://commons.wikimedia.org/wiki/File:Quarto-Pousada_de_Bragan%C3%A7a.jpg' },
}

export const CURIOSIDADES = [
  { destaque: '1959', titulo: 'A primeira escola técnica de eletrônica da América Latina', texto: 'A ETE FMC foi fundada na cidade por Sinhá Moreira e abriu caminho para tudo o que veio depois.', icone: 'estrela', cor: 'var(--amarelo)' },
  { destaque: 'Vale da Eletrônica', titulo: 'Um polo de tecnologia no interior de Minas', texto: 'Dezenas de empresas de eletrônica, telecomunicações e software nasceram aqui, muitas de ex-alunos das escolas locais.', icone: 'grafico', cor: 'var(--ciano)' },
  { destaque: '1965', titulo: 'Inatel, o instituto de telecomunicações', texto: 'O Instituto Nacional de Telecomunicações forma engenheiros desde a década de 1960 e mantém um centro de inovação aberto às empresas.', icone: 'nuvem', cor: 'var(--lilas)' },
  { destaque: 'Cidade Criativa', titulo: '“Cidade Criativa, Cidade Feliz”', texto: 'O lema resume o jeito da cidade: tradição mineira, praça cheia e muita gente criando coisa nova.', icone: 'pessoas', cor: 'var(--rosa)' },
  { destaque: 'Rio Sapucaí', titulo: 'A cidade leva o nome do rio', texto: 'O Sapucaí corta a cidade e dá nome a ela. Antigamente era atravessado por uma ponte pênsil, a Ponte Afonso Pena.', icone: 'mapa', cor: 'var(--azul-ceu)', foto: 'ponte-pensil', legenda: 'Ponte pênsil Afonso Pena, em foto histórica' },
  { destaque: 'Presidente', titulo: 'Terra de Delfim Moreira', texto: 'O presidente da República Delfim Moreira (1918–1919) viveu em Santa Rita do Sapucaí, onde está sepultado.', icone: 'prefeitura', cor: 'var(--amarelo)' },
]

export const TIPOS_HOSPEDAGEM_TURISTA = ['Todos', 'Hotel', 'Pousada', 'Chalé', 'Hostel']

export const HOSPEDAGENS = [
  { id: 1, nome: 'Pousada Recanto da Serra', tipo: 'Pousada', bairro: 'Centro', preco: '$$', foto: 'hosp-pousada-jardim', destaques: ['Café da manhã mineiro', 'Jardim', 'Wi-Fi'], cadastur: true },
  { id: 2, nome: 'Chalés da Mantiqueira', tipo: 'Chalé', bairro: 'Zona rural', preco: '$$$', foto: 'hosp-chale-mata', destaques: ['Lareira', 'Trilhas por perto', 'Aceita pets'], cadastur: true },
  { id: 3, nome: 'Hotel Vale da Eletrônica', tipo: 'Hotel', bairro: 'Centro', preco: '$$', foto: 'hosp-quarto-hotel', destaques: ['Perto do Inatel', 'Sala de reunião', 'Estacionamento'], cadastur: true },
  { id: 4, nome: 'Pousada Flor do Café', tipo: 'Pousada', bairro: 'Estrada do Cafezal', preco: '$$', foto: 'hosp-cafezal', destaques: ['Vista do cafezal', 'Café especial da casa', 'Piscina'], cadastur: true },
  { id: 5, nome: 'Sítio Águas Claras', tipo: 'Chalé', bairro: 'Zona rural', preco: '$', foto: 'hosp-amanhecer', destaques: ['Nascer do sol na serra', 'Lago', 'Cozinha equipada'], cadastur: false },
  { id: 6, nome: 'Hostel Sapucaí', tipo: 'Hostel', bairro: 'Centro', preco: '$', foto: 'hosp-quarto-madeira', destaques: ['Quartos coletivos e privativos', 'Perto da rodoviária', 'Cozinha compartilhada'], cadastur: true },
]

export const SABORES = [
  { nome: 'Café da tarde mineiro', foto: 'cafe-da-tarde', texto: 'Pão de queijo, bolo de fubá e café passado na hora. Servido nas padarias do Centro e no café da manhã das pousadas.', onde: 'Padarias e pousadas' },
  { nome: 'Feijão tropeiro', foto: 'feijao-tropeiro', texto: 'Feijão, farinha de mandioca, torresmo, linguiça e couve. O prato mais pedido no almoço de domingo.', onde: 'Restaurantes de comida mineira' },
  { nome: 'Pão de queijo', foto: 'pao-de-queijo', texto: 'Feito com queijo da região e polvilho. Tem em toda esquina, mas o melhor é o que sai quentinho do forno.', onde: 'Padarias e lanchonetes' },
  { nome: 'Romeu e Julieta', foto: 'romeu-e-julieta', texto: 'Queijo minas com goiabada: a sobremesa mais simples e mais mineira que existe.', onde: 'Restaurantes e empórios' },
  { nome: 'Cafés especiais do Sul de Minas', foto: 'cafe-coado', texto: 'A região é uma das maiores produtoras de café do país. Prove o coado na hora e leve um pacote para casa.', onde: 'Cafeterias e fazendas da região' },
]

export const PONTOS_TURISTICOS = [
  { nome: 'Praça Santa Rita', foto: 'praca-santa-rita', categoria: 'Centro histórico', texto: 'O coração da cidade, com coqueiros, bancos à sombra e movimento o dia todo. No fim do ano, ganha iluminação de Natal.', local: 'Centro' },
  { nome: 'Rio Sapucaí', foto: 'rio-sapucai', categoria: 'Natureza', texto: 'O rio que dá nome à cidade. Bom para uma caminhada no fim da tarde pelas margens arborizadas.', local: 'Centro' },
  { nome: 'Antiga estação ferroviária', foto: 'estacao-ferroviaria', categoria: 'Patrimônio', texto: 'Prédio de 1894, da época em que o trem ligava a cidade ao resto do Sul de Minas.', local: 'Centro' },
  { nome: 'Natal na praça', foto: 'natal-praca', categoria: 'Evento', texto: 'Em dezembro, a praça vira um cartão-postal iluminado, com árvore de luzes e presépio.', local: 'Praça Santa Rita' },
]
