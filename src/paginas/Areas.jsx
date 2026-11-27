import LayoutPainel from '../componentes/LayoutPainel'
import { useEnvios } from '../contexto/Envios'
import { useSessao } from '../contexto/Sessao'

export function AreaComerciante() {
  const { sessao } = useSessao()
  const { estabelecimento } = useEnvios()
  const menu = [
    {
      secao: 'Meu negócio',
      itens: [
        { para: '/comerciante', rotulo: 'Início', icone: 'casa', fim: true },
        { para: '/comerciante/enviar', rotulo: 'Enviar dados', icone: 'upload' },
        { para: '/comerciante/historico', rotulo: 'Histórico e comparação', icone: 'grafico' },
        { para: '/comerciante/estabelecimento', rotulo: 'Meu estabelecimento', icone: 'loja' },
        { para: '/comerciante/guia', rotulo: 'Cadastur, FNRH e cadastro', icone: 'escudo' },
      ],
    },
    {
      secao: 'Consultar',
      itens: [
        { para: '/indicadores', rotulo: 'Indicadores da cidade', icone: 'painel', externo: true },
      ],
    },
  ]
  return (
    <LayoutPainel
      perfil="comerciante"
      menu={menu}
      rodapeLateral={
        <div className="lateral__cartao" style={{ '--cor': 'var(--rosa)' }}>
          <strong>{estabelecimento?.trade_name || sessao?.nome || 'Meu estabelecimento'}</strong>
          CNPJ {estabelecimento?.tax_id || sessao?.identificador || '—'}
        </div>
      }
    />
  )
}

export function AreaPrefeitura() {
  const { totalPendentes } = useEnvios()
  const menu = [
    {
      secao: 'Prefeitura',
      itens: [
        { para: '/prefeitura', rotulo: 'Visão geral', icone: 'painel', fim: true },
        { para: '/prefeitura/envios', rotulo: 'Validar envios', icone: 'check-circulo', contador: totalPendentes },
        { para: '/prefeitura/estabelecimentos', rotulo: 'Estabelecimentos', icone: 'predio' },
        { para: '/prefeitura/relatorios', rotulo: 'Relatórios gerenciais', icone: 'grafico' },
        { para: '/prefeitura/inventario', rotulo: 'Inventário turístico', icone: 'mapa', contador: 3 },
      ],
    },
    {
      secao: 'Site público',
      itens: [
        { para: '/indicadores', rotulo: 'Ver indicadores', icone: 'painel', externo: true },
        { para: '/relatorios', rotulo: 'Relatórios do site', icone: 'arquivo', externo: true },
      ],
    },
  ]
  return (
    <LayoutPainel
      perfil="prefeitura"
      menu={menu}
      rodapeLateral={
        <div className="lateral__cartao" style={{ '--cor': 'var(--ciano)' }}>
          <strong>Equipe SMCELT</strong>
          Coordenação de Turismo
        </div>
      }
    />
  )
}
