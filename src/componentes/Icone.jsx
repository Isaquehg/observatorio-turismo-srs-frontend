// Conjunto de ícones do OT-SRS: grade de 24px, traço 2px, pontas redondas.
const desenhos = {
  busca: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  download: <><path d="M12 4v11" /><path d="M7 10.5l5 5 5-5" /><path d="M5 19.5h14" /></>,
  arquivo: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  filtro: <path d="M4 6h16M7 12h10M10 18h4" />,
  grafico: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  cama: <><path d="M3 18V7M3 14h18v4M21 14v-2.5A3.5 3.5 0 0 0 17.5 8H11v6" /><circle cx="7" cy="11" r="1.8" /></>,
  predio: <><path d="M4 21V6l8-3v18M12 9h8v12M3 21h18" /><path d="M7.5 9v.01M7.5 13v.01M7.5 17v.01M16 13v.01M16 17v.01" /></>,
  pessoas: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.8 3.2-6 6.5-6s6 2.2 6.5 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.3c2 .8 3.2 2.8 3.5 5.7" /></>,
  mala: <><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11v5M15 11v5" /></>,
  loja: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3z" /><path d="M10 20v-4h4v4" /></>,
  prefeitura: <path d="M3 21h18M5 21v-9M19 21v-9M9.5 21v-9M14.5 21v-9M3 10l9-6 9 6z" />,
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  'seta-esq': <path d="M19 12H5M11 6l-6 6 6 6" />,
  externo: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'check-circulo': <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16 10" /></>,
  alerta: <><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.5v.01" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  'x-circulo': <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  upload: <path d="M12 16V5M7 9.5l5-5 5 5M5 19.5h14" />,
  sair: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />,
  olho: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  cadeado: <><rect x="4.5" y="10.5" width="15" height="10" rx="3" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>,
  lapis: <><path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z" /><path d="M13.5 7l3 3" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  casa: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  sino: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  lista: <path d="M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01" />,
  engrenagem: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
  painel: <><rect x="3.5" y="3.5" width="7" height="8" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /><rect x="3.5" y="14.5" width="7" height="6" rx="2" /></>,
  mapa: <><path d="M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13.5l-5.5 2.5-6-2.5-5.5 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></>,
  garfo: <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1-4 3.5-4 7v3h4" />,
  estrela: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  pergunta: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.8.7-.8 1.3v.3M12 17v.01" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  'chevron-dir': <path d="M9 6l6 6-6 6" />,
  escudo: <><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5-7.5-9.5V6z" /><path d="M8.8 12.2l2.2 2.2 4.2-4.4" /></>,
  nuvem: <path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.4A3.8 3.8 0 0 1 17.5 18.5z" />,
  // Complementos no mesmo traço
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  ocupacao: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5V12l6 6" /></>,
  telefone: <path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />,
  email: <><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M4 7.5l8 6 8-6" /></>,
  texto: <path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" />,
  devolver: <path d="M9 14l-5-5 5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
}

export default function Icone({ nome, tamanho, className = '', titulo }) {
  const classes = ['ot-icone', tamanho && `ot-icone--${tamanho}`, className].filter(Boolean).join(' ')
  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      focusable="false"
    >
      {desenhos[nome]}
    </svg>
  )
}
