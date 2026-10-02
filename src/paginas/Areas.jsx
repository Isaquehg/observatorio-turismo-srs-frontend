import LayoutPainel from '../componentes/LayoutPainel'
import { useEnvios } from '../contexto/Envios'
import { MEU_NEGOCIO } from '../dados/painel'

export function AreaComerciante() {
  const menu = [
    {
      secao: 'Meu negócio',
      itens: [
        { para: '/comerciante', rotulo: 'Início', icone: 'casa', fim: true },
        { para: '/comerciante/enviar', rotulo: 'Enviar dados', icone: 'upload' },
        { para: '/comerciante/historico', rotulo: 'Histórico e comparação', icone: 'grafico' },
        { para: '/comerciante/estabelecimento', rotulo: 'Meu estabelecimento', icone: 'loja' },
      ],
    },
    {
      secao: 'Consultar',
      itens: [
        { para: '/indicadores', rotulo: 'Indicadores da cidade', icone: 'painel', externo: true },
        { para: '/cadastur', rotulo: 'Cadastur e FNRH', icone: 'escudo', externo: true },
      ],
    },
  ]
  return (
    <LayoutPainel
      perfil="comerciante"
      menu={menu}
      rodapeLateral={
        <div className="lateral__cartao" style={{ '--cor': 'var(--rosa)' }}>
          <strong>{MEU_NEGOCIO.nome}</strong>
          CNPJ {MEU_NEGOCIO.cnpj}
        </div>
      }
    />
  )
}

export function AreaPrefeitura() {
  const { pendentes } = useEnvios()
  const menu = [
    {
      secao: 'Prefeitura',
      itens: [
        { para: '/prefeitura', rotulo: 'Visão geral', icone: 'painel', fim: true },
        { para: '/prefeitura/envios', rotulo: 'Validar envios', icone: 'check-circulo', contador: pendentes.length },
        { para: '/prefeitura/inventario', rotulo: 'Inventário turístico', icone: 'mapa', contador: 3 },
      ],
    },
    {
      secao: 'Site público',
      itens: [
        { para: '/indicadores', rotulo: 'Ver indicadores', icone: 'grafico', externo: true },
        { para: '/relatorios', rotulo: 'Ver relatórios', icone: 'arquivo', externo: true },
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
