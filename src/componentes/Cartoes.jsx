import { useState } from 'react'
import Icone from './Icone'
import { Minilinha } from './Graficos'
import { Variacao, Dialogo } from './Basicos'
import { categoriaDe } from '../dados/relatorios'
import { mesAno } from '../util/formatar'
import { useAvisos } from '../contexto/Avisos'

export function Indicador({ rotulo, valor, unidade, icone, cor, variacao, comparacao, serie }) {
  return (
    <article className="ot-indicador" style={{ '--cor': cor }}>
      <div className="ot-indicador__blob" />
      <div className="ot-indicador__topo">
        <span className="ot-indicador__icone"><Icone nome={icone} /></span>
        <h3 className="ot-indicador__rotulo">{rotulo}</h3>
      </div>
      <p className="ot-indicador__valor">
        {valor}
        {unidade && <small>{unidade}</small>}
      </p>
      <div className="ot-indicador__rodape">
        <span>
          <Variacao {...variacao} />
          {comparacao && <span style={{ marginLeft: 6 }}>{comparacao}</span>}
        </span>
        <Minilinha valores={serie} />
      </div>
    </article>
  )
}

function dataRelatorio(iso) {
  const [ano, mes] = iso.split('-').map(Number)
  return mesAno(ano, mes)
}

export function useDownloadRelatorio() {
  const { avisar } = useAvisos()
  return (r) =>
    avisar('Arquivo indisponível no protótipo', {
      texto: `“${r.titulo}” será baixado em PDF quando o acervo do Observatório estiver no ar.`,
      tipo: 'info',
    })
}

export function ResumoRelatorio({ relatorio, aoFechar }) {
  const baixar = useDownloadRelatorio()
  const cat = relatorio && categoriaDe(relatorio.categoria)
  return (
    <Dialogo
      aberto={!!relatorio}
      aoFechar={aoFechar}
      titulo={relatorio?.titulo}
      largura={620}
      acoes={
        relatorio && (
          <>
            <button type="button" className="ot-btn ot-btn--secundario" onClick={aoFechar}>Fechar</button>
            <button type="button" className="ot-btn ot-btn--primario" onClick={() => baixar(relatorio)}>
              <Icone nome="download" /> Baixar PDF
            </button>
          </>
        )
      }
    >
      {relatorio && (
        <>
          <div className="ot-relatorio__meta" style={{ marginTop: -4 }}>
            <span className="ot-sobretitulo" style={{ fontSize: '.8125rem' }}>{cat.rotulo}</span>
            <span><Icone nome="calendario" tamanho="s" /> {dataRelatorio(relatorio.data)}</span>
            <span><Icone nome="arquivo" tamanho="s" /> {relatorio.paginas} páginas</span>
          </div>
          <p className="corpo">{relatorio.resumo}</p>
          <div className="ot-cartao ot-cartao--contorno" style={{ background: 'var(--papel)' }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Principais achados</p>
            <ul style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relatorio.achados.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <p className="ot-fonte">Como citar: Observatório do Turismo de Santa Rita do Sapucaí (OT-SRS). {relatorio.titulo}. SMCELT, {relatorio.data.slice(0, 4)}.</p>
        </>
      )}
    </Dialogo>
  )
}

export function CartaoRelatorio({ relatorio, aoAbrir }) {
  const baixar = useDownloadRelatorio()
  const cat = categoriaDe(relatorio.categoria)
  return (
    <article className="ot-relatorio">
      <div className="ot-relatorio__capa" style={{ '--cor-capa': cat.cor }} aria-hidden="true">
        <span>OT</span>
        <span>{cat.capa}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="ot-relatorio__tag">
          <span className="ot-sobretitulo">{cat.rotulo}</span>
          {relatorio.novo && <span className="ot-selo ot-selo--novo">Novo</span>}
        </div>
        <h3 className="titulo-3">
          {aoAbrir ? (
            <button type="button" className="link-titulo" onClick={() => aoAbrir(relatorio)}>{relatorio.titulo}</button>
          ) : (
            relatorio.titulo
          )}
        </h3>
        <div className="ot-relatorio__meta">
          <span><Icone nome="calendario" tamanho="s" /> {dataRelatorio(relatorio.data)}</span>
          <span><Icone nome="arquivo" tamanho="s" /> PDF · {relatorio.paginas} páginas · {relatorio.tamanho}</span>
        </div>
      </div>
      <div className="ot-relatorio__acoes">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={() => baixar(relatorio)} aria-label={`Baixar ${relatorio.titulo}`}>
          <Icone nome="download" /> Baixar
        </button>
      </div>
    </article>
  )
}

export function useResumo() {
  const [aberto, setAberto] = useState(null)
  return { aberto, abrir: setAberto, fechar: () => setAberto(null) }
}
