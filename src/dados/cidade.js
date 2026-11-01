// Conteúdo da página "Conheça a cidade".
// Fonte principal: portal oficial de turismo Visite Santa Rita (visitesrs.com.br).
// `foto` é o nome do arquivo em public/fotos/ (sem .jpg). Enquanto o arquivo não existe,
// o componente Foto mostra um espaço reservado; basta salvar a imagem com esse nome.

export const NUMEROS = [
  { valor: 43, prefixo: '', sufixo: ' mil', rotulo: 'habitantes, aproximadamente' },
  { valor: 170, prefixo: '+', sufixo: '', rotulo: 'startups e empresas de base tecnológica' },
  { valor: 6, prefixo: '', sufixo: '', rotulo: 'rotas turísticas oficiais' },
  { valor: 133, prefixo: '', sufixo: ' anos', rotulo: 'de emancipação, completados em 2026' },
]

export const HISTORIA = [
  {
    marco: '1825',
    titulo: 'Uma promessa e a primeira missa',
    texto: 'A cidade nasceu em torno de uma capela erguida por Dona Genoveva Maria Martins da Fonseca para cumprir uma promessa do marido, que havia falecido. A primeira missa foi celebrada em 22 de maio de 1825, dia de Santa Rita de Cássia.',
  },
  {
    marco: 'O nome',
    titulo: 'Santa Rita, do Sapucaí',
    texto: 'O nome junta a padroeira, Santa Rita de Cássia, conhecida como a santa das causas impossíveis, ao Rio Sapucaí, que atravessa a cidade e o campo ao redor.',
  },
  {
    marco: 'A igreja',
    titulo: 'Da capela ao Santuário',
    texto: 'A antiga capela deu lugar ao Santuário de Santa Rita de Cássia, na Praça Santa Rita. A praça em volta dele ainda é o centro da vida da cidade, das festas ao comércio de rua.',
    foto: 'santuario',
    proporcao: '612 / 646',
    legenda: 'Santuário de Santa Rita de Cássia, na Praça Santa Rita',
  },
  {
    marco: '24 de maio',
    titulo: 'De distrito a município',
    texto: 'O antigo distrito de Santa Rita da Boa Vista pertencia a São Gonçalo do Sapucaí. Emancipada, a cidade comemora o aniversário em 24 de maio: em 2026, foram 133 anos.',
  },
]

// Por que a cidade virou polo de tecnologia
export const POLO = [
  { marco: '1959', titulo: 'ETE FMC', texto: 'Sinhá Moreira funda a Escola Técnica de Eletrônica Francisco Moreira da Costa, a primeira escola técnica de eletrônica da América Latina.' },
  { marco: '1965', titulo: 'Inatel', texto: 'Nasce o Instituto Nacional de Telecomunicações, primeira faculdade de telecomunicações do Brasil.' },
  { marco: '1971', titulo: 'FAI', texto: 'O Centro de Ensino Superior abre o primeiro curso de administração e processamento de dados do Sul de Minas.' },
  { marco: 'Anos 1980', titulo: 'Vale da Eletrônica', texto: 'Com técnicos e engenheiros formados aqui, ex-alunos abrem empresas e a cidade ganha a marca que a tornou conhecida.' },
  { marco: '2013', titulo: 'Cidade Criativa, Cidade Feliz', texto: 'O movimento une tecnologia, cultura e empreendedorismo e dá origem a eventos como o HackTown.' },
]

export const EVENTOS = [
  {
    nome: 'Festa de Santa Rita',
    quando: 'Maio, de 17 a 25',
    resumo: 'A festa tradicional do aniversário da cidade',
    texto: 'Novenas, missas, bênção das rosas e procissão luminosa em honra à padroeira, junto com o parque, as barracas e os shows. A festa coincide com o aniversário da cidade, em 24 de maio, e é patrimônio cultural registrado do município.',
    foto: 'festa-de-santa-rita',
    proporcao: '1 / 1',
    icone: 'estrela',
  },
  {
    nome: 'HackTown',
    quando: 'Todo ano, desde 2016',
    resumo: 'Festival de inovação, criatividade e música',
    texto: 'Palestras, oficinas e shows espalhados por escolas, bares, praças e casas do Centro: a cidade inteira vira o palco. Nasceu pequeno, para algumas dezenas de pessoas, e hoje recebe gente do Brasil todo.',
    foto: 'hacktown',
    proporcao: '3 / 2',
    icone: 'pessoas',
  },
  {
    nome: 'Bloco do Urso',
    quando: 'No Carnaval, desde 1998',
    resumo: 'O carnaval mais conhecido do Sul de Minas',
    texto: 'Quatro dias de festa na Cidade do Urso, com shows de artistas nacionais. É o maior evento do carnaval da cidade. Para quem prefere a rua, há também os blocos tradicionais.',
    foto: 'bloco-do-urso',
    proporcao: '7 / 5',
    icone: 'sino',
  },
]

export const CALENDARIO = [
  { mes: 'Agosto', nome: 'Feirão Folclórico', texto: 'Nasceu das feiras escolares do Dia do Folclore, nos anos 1970 e 1980, e virou uma festa da comunidade com cultura popular e comida típica.' },
  { mes: 'Dezembro', nome: 'Natal na praça', texto: 'A Praça Santa Rita ganha árvore de luzes e presépio e vira o cartão-postal do fim de ano.' },
]

// Rotas oficiais do portal Visite Santa Rita, com as paradas que o portal cita
export const ROTAS = [
  {
    nome: 'Rota do Café', icone: 'garfo', foto: 'rota-do-cafe',
    texto: 'Fazendas e cafés especiais da Mantiqueira.',
    resumo: 'A cidade integra a Rota do Café de Minas Gerais e a Rota Nacional do Café. O roteiro passa pelas fazendas produtoras, com experiências sensoriais, pelas torrefações e pelas cafeterias da cidade.',
    paradas: [
      { nome: 'Fazendas de cafés especiais', texto: 'Visitas guiadas com agendamento; algumas oferecem estadia.' },
      { nome: 'Torrefações', texto: 'Do grão verde à xícara.' },
      { nome: 'Cafeterias do Centro', texto: 'Para fechar o dia com um café da tarde.' },
      { nome: 'Almoço na roça e jantar mineiro', texto: 'Sugestão de refeições ao longo do roteiro.' },
    ],
  },
  {
    nome: 'Rota da Fé', icone: 'estrela', foto: 'santuario',
    texto: 'O Santuário, capelas e a história da cidade.',
    resumo: 'O roteiro parte do Santuário de Santa Rita de Cássia, que guarda a imagem trazida de Portugal na época da fundação da cidade, e segue por grutas e capelas da zona urbana e rural.',
    paradas: [
      { nome: 'Santuário de Santa Rita de Cássia', texto: 'Urna com a réplica da santa e a imagem vinda de Portugal. Praça Santa Rita, Centro.' },
      { nome: 'Grutas e capelas', texto: 'Espalhadas pela cidade e pela zona rural.' },
      { nome: 'Cemitério Municipal', texto: 'Esculturas sacras, vista da cidade e os túmulos de Delfim Moreira, Sinhá Moreira e Maria Bonita.' },
    ],
  },
  {
    nome: 'Rota da Criatividade', icone: 'lapis', foto: 'rota-da-criatividade',
    texto: 'Museu, arte urbana e cultura popular.',
    resumo: 'Um passeio pela história e pela cultura da cidade, do museu às placas com QR code espalhadas pelos lugares históricos, terminando na arte urbana da Beira Rio no fim do dia.',
    paradas: [
      { nome: 'Museu Histórico Delfim Moreira', texto: 'Antiga casa do 10º presidente do Brasil.' },
      { nome: 'Memórias Santa-Ritenses', texto: 'Museu a céu aberto: escaneie o QR code das placas para conhecer cada lugar.' },
      { nome: 'Mercado Municipal', texto: 'Pastel e linguiça artesanal.' },
      { nome: 'NEEC', texto: 'Núcleo de Empreendedorismo e Economia Criativa, na Incubadora Sinhá Moreira.' },
      { nome: 'Galeria Aberta de Arte Urbana', texto: 'Na Beira Rio, melhor no fim da tarde.' },
    ],
  },
  {
    nome: 'Rota da Natureza', icone: 'mapa', foto: 'rota-da-natureza',
    texto: 'Trilhas, mirantes, rio e voo livre.',
    resumo: 'Trilhas, passeios de barco no Rio Sapucaí e o pôr do sol no alto da cidade. Para os mais aventureiros, cicloturismo, rapel e voo livre a cerca de 1.400 m de altitude.',
    paradas: [
      { nome: 'Morro do Cruzeiro', texto: 'No meio da cidade, o melhor lugar para o pôr do sol.' },
      { nome: 'Passeios de barco no Rio Sapucaí', texto: 'O rio que dá nome à cidade, visto de dentro.' },
      { nome: 'Rebio Prof.ª Dra. Mitzi Brandão', texto: 'Reserva biológica com trilhas.' },
      { nome: 'Horto: Parque Municipal Dr. Cyro de Luna Dias', texto: 'Trilhas, com visitas agendadas.' },
      { nome: 'Rampa de voo livre', texto: 'Voo de cross country e vista da Mantiqueira.' },
    ],
  },
  {
    nome: 'Rota dos Sabores', icone: 'loja', foto: 'rota-dos-sabores',
    texto: 'Feira, mercado e sabores da terra.',
    resumo: 'O roteiro reúne a feira de produtores de domingo, o Mercado Municipal, bares e cafeterias, cachaça e cerveja artesanal. Pão cheio, pasta flora e linguiça curada de varal são sabores reconhecidos como patrimônio da cidade.',
    paradas: [
      { nome: 'Feira de produtores', texto: 'Domingos, das 8h às 12h, na Alameda José Cleto Duarte.' },
      { nome: 'Mercado Municipal', texto: 'Tour pelas bancas de produtos locais.' },
      { nome: 'Cachaça e cerveja artesanal', texto: 'Produtores da cidade e da região.' },
      { nome: 'Aula com chef local', texto: 'Cozinha mineira na prática.' },
    ],
  },
  {
    nome: 'Rota da Inovação', icone: 'grafico', foto: 'rota-da-inovacao',
    texto: 'As escolas e empresas do Vale da Eletrônica.',
    resumo: 'Um dia dentro do ecossistema que formou o Vale da Eletrônica, das escolas pioneiras às startups. Na versão de dois dias, inclui vivência numa lavoura de café e happy hour em cervejaria artesanal.',
    paradas: [
      { nome: 'Incubadora Municipal Sinhá Moreira', texto: 'Ponto de partida: apresentação do ecossistema.' },
      { nome: 'ETE FMC', texto: 'Primeira escola técnica de eletrônica da América Latina, de 1959.' },
      { nome: 'Inatel', texto: 'Centro de Competência EMBRAPII XG Mobile e hub de startups.' },
      { nome: 'FAI', texto: 'Pioneira em tecnologia e gestão no Sul de Minas, desde 1971.' },
      { nome: 'Museu Histórico Delfim Moreira', texto: 'Para fechar o dia com a história da cidade.' },
    ],
    contato: 'Agendamento pela Secretaria de Turismo: turismo@pmsrs.mg.gov.br · (35) 3471-1642',
  },
]

export const DESTAQUE_GASTRONOMIA = {
  nome: 'Don Rafoni Smoke House',
  selo: 'Melhor hambúrguer do Brasil',
  premio: 'Prêmio Hambúrguer Perfeito 2026',
  texto: 'A hamburgueria de Santa Rita venceu o prêmio nacional com o PHP: 200 g de carne dry aged, defumada com lenha de café e de cerejeira. Uma parada obrigatória para quem visita a cidade.',
  foto: 'don-rafoni',
}

// Outros lugares para comer e beber. Textos curtos para a SMCELT revisar.
export const ONDE_COMER = [
  { nome: 'Barão Cafeteria', tipo: 'Cafeteria', foto: 'barao-cafeteria', texto: 'Casa com jardim e mesas ao ar livre, para um café sem pressa.' },
  { nome: 'Bar e Restaurante do Bá', tipo: 'Bar e restaurante', foto: 'bar-do-ba', texto: 'Petiscos mineiros, como torresmo, mandioca e linguiça, com cerveja gelada.' },
  { nome: "Grandpa Joel's Coffee", tipo: 'Cafeteria', foto: 'grandpa-joels', texto: 'Cafés especiais, croissants e geleias para acompanhar.' },
  { nome: 'No Trabalho Bar', tipo: 'Bar', foto: 'no-trabalho-bar', texto: 'Área verde à beira do lago, para comer e beber ao ar livre.' },
]

// O que visitar, com endereço e horário do portal oficial
export const LUGARES = [
  { nome: 'Santuário de Santa Rita de Cássia', icone: 'estrela', onde: 'Praça Santa Rita, Centro · (35) 3471-1134', quando: 'Ligue para confirmar o horário das missas' },
  { nome: 'Estátua de Santa Rita', icone: 'pin', onde: 'Entrada da cidade', quando: 'Ao ar livre' },
  { nome: 'Praça Santa Rita', icone: 'casa', onde: 'Centro', quando: 'Iluminação de Natal em dezembro' },
  { nome: 'Antiga estação ferroviária', icone: 'predio', onde: 'Centro', quando: 'Prédio de 1894' },
  { nome: 'Museu Histórico Delfim Moreira', icone: 'casa', onde: 'Praça Dr. Delfim Moreira, 42', quando: 'Seg. a sex., 8h30 às 16h30' },
  { nome: 'Morro do Cruzeiro', icone: 'mapa', onde: 'Vila das Fontes', quando: 'Aberto 24 h · melhor no pôr do sol' },
  { nome: 'Galeria Aberta de Arte Urbana', icone: 'lapis', onde: 'Margens do Rio Sapucaí', quando: 'Ao ar livre' },
  { nome: 'Mercado Municipal', icone: 'loja', onde: 'Mercado Benedito Pereira dos Reis', quando: 'Seg. a sáb., 7h às 18h · dom., 7h às 12h' },
  { nome: 'Feira Livre Municipal', icone: 'garfo', onde: 'Alameda José Cleto Duarte', quando: 'Domingos, 8h às 12h' },
  { nome: 'Parque Municipal Natural Dr. Cyro de Luna Dias', icone: 'mapa', onde: 'Bairro Piedade', quando: 'Visitas com agendamento' },
  { nome: 'Rampa de Voo Livre', icone: 'nuvem', onde: 'Estrada da Rebio, Piedade', quando: 'Na divisa com São Sebastião da Bela Vista' },
  { nome: 'Teatro Municipal Monsenhor José Carneiro Pinto', icone: 'estrela', onde: 'Espetáculos e eventos culturais', quando: 'Conforme a programação' },
]
