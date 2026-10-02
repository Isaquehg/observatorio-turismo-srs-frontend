import { useMemo, useRef, useState } from 'react'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Migalhas, Sobretitulo } from '../componentes/Basicos'
import { CartaoRelatorio, ResumoRelatorio, useResumo, useDownloadRelatorio } from '../componentes/Cartoes'
import { relatorios, CATEGORIAS_RELATORIO, categoriaDe } from '../dados/relatorios'
import { mesAnoLongo, normalizar } from '../util/formatar'
import { useTitulo } from '../util/ganchos'
import './publico.css'

const POR_PAGINA = 5
const ANOS_RELATORIO = [...new Set(relatorios.map((r) => r.data.slice(0, 4)))]

export default function Relatorios() {
  useTitulo('Relatórios')
  const { aberto, abrir, fechar } = useResumo()
  const baixar = useDownloadRelatorio()
  const [termo, setTermo] = useState('')
  const [ano, setAno] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [ordem, setOrdem] = useState('recentes')
  const [limite, setLimite] = useState(POR_PAGINA)
  const listaRef = useRef(null)

  const destaque = relatorios.find((r) => r.novo)
  const filtrando = termo.trim() !== '' || ano !== 'todos' || categoria !== 'todas'

  const resultado = useMemo(() => {
    const busca = normalizar(termo.trim())
    const lista = relatorios.filter((r) => {
      if (!filtrando && r.id === destaque.id) return false
      if (ano !== 'todos' && !r.data.startsWith(ano)) return false
      if (categoria !== 'todas' && r.categoria !== categoria) return false
      if (busca && !normalizar(`${r.titulo} ${r.resumo} ${categoriaDe(r.categoria).nome}`).includes(busca)) return false
      return true
    })
    return lista.sort((a, b) => (ordem === 'recentes' ? b.data.localeCompare(a.data) : ordem === 'antigos' ? a.data.localeCompare(b.data) : a.titulo.localeCompare(b.titulo, 'pt-BR')))
  }, [termo, ano, categoria, ordem, filtrando, destaque.id])

  const limpar = () => {
    setTermo('')
    setAno('todos')
    setCategoria('todas')
    setLimite(POR_PAGINA)
  }

  const [ano_, mes_] = destaque.data.split('-').map(Number)

  return (
    <div className="container pag surgir">
      <div className="pag__cab">
        <div>
          <Migalhas atual="Relatórios" />
          <h1 className="display-l pag__titulo">
            Relatórios e <span className="ot-marca ot-marca--rosa">pesquisas</span>
          </h1>
          <p className="corpo-l pag__abertura">Tudo o que o Observatório já publicou, em PDF, para ler, baixar e citar.</p>
        </div>
      </div>

      <form
        className="busca"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          listaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        <div className="ot-entrada-icone busca__texto">
          <Icone nome="busca" />
          <input
            className="ot-entrada"
            type="search"
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value)
              setLimite(POR_PAGINA)
            }}
            placeholder="Tema, ano ou nº do relatório"
            aria-label="Buscar relatórios"
          />
        </div>
        <select className="ot-selecao busca__ano" value={ano} onChange={(e) => setAno(e.target.value)} aria-label="Ano de publicação">
          <option value="todos">Todos os anos</option>
          {ANOS_RELATORIO.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button type="submit" className="ot-btn ot-btn--primario">Buscar</button>
      </form>

      <div className="rolagem-x" style={{ margin: '20px calc(-1 * var(--calha)) 36px' }} role="group" aria-label="Tipo de relatório">
        <button type="button" className="ot-chip" aria-pressed={categoria === 'todas'} onClick={() => setCategoria('todas')}>Todos</button>
        {CATEGORIAS_RELATORIO.map((c) => (
          <button key={c.id} type="button" className="ot-chip" aria-pressed={categoria === c.id} onClick={() => { setCategoria(c.id); setLimite(POR_PAGINA) }}>
            {c.nome}
          </button>
        ))}
      </div>

      {!filtrando && (
        <article className="destaque">
          <div className="destaque__capa ot-gradiente">
            <Sobretitulo>Relatório OT · {ano_}</Sobretitulo>
            <p className="titulo-1 destaque__capa-titulo">Perfil do turista em eventos</p>
            <Adesivo tipo="explosao" cor="var(--amarelo)" tamanho={120} />
            <Adesivo tipo="serpentina" cor="var(--rosa)" tamanho={130} style={{ right: -36, top: '40%' }} />
          </div>
          <div className="destaque__txt">
            <div className="linha-acoes" style={{ gap: 10 }}>
              <Sobretitulo>{categoriaDe(destaque.categoria).rotulo}</Sobretitulo>
              <span className="ot-selo ot-selo--novo">Novo</span>
            </div>
            <h2 className="titulo-1">{destaque.titulo}</h2>
            <p className="corpo suave">{destaque.resumo}</p>
            <div className="ot-relatorio__meta" style={{ fontSize: '1.0625rem' }}>
              <span><Icone nome="calendario" tamanho="s" /> {mesAnoLongo(ano_, mes_).replace(/^./, (l) => l.toUpperCase())}</span>
              <span><Icone nome="arquivo" tamanho="s" /> PDF · {destaque.paginas} páginas · {destaque.tamanho}</span>
            </div>
            <div className="linha-acoes" style={{ marginTop: 8 }}>
              <button type="button" className="ot-btn ot-btn--primario ot-btn--g" onClick={() => baixar(destaque)}>
                <Icone nome="download" /> Baixar PDF
              </button>
              <button type="button" className="ot-btn ot-btn--secundario ot-btn--g" onClick={() => abrir(destaque)}>
                <Icone nome="olho" /> Ler resumo
              </button>
            </div>
          </div>
        </article>
      )}

      <div className="relatorios__lista-cab" ref={listaRef} style={{ scrollMarginTop: 'calc(var(--altura-topo) + 16px)' }}>
        <h2 className="titulo-2" aria-live="polite">
          {filtrando ? 'Resultados' : 'Todos os relatórios'}{' '}
          <span className="suave" style={{ fontWeight: 500 }}>({resultado.length})</span>
        </h2>
        <select className="ot-selecao relatorios__ordem" value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar relatórios">
          <option value="recentes">Mais recentes primeiro</option>
          <option value="antigos">Mais antigos primeiro</option>
          <option value="titulo">Ordem alfabética</option>
        </select>
      </div>

      {resultado.length === 0 ? (
        <div className="ot-cartao ot-vazio">
          <span className="ot-vazio__icone ot-bolha"><Icone nome="busca" tamanho="l" /></span>
          <h3 className="titulo-3">Nenhum relatório encontrado</h3>
          <p className="corpo suave" style={{ maxWidth: '40ch' }}>Tente outra palavra ou tire algum filtro. Você também pode pedir um dado à SMCELT.</p>
          <button type="button" className="ot-btn ot-btn--secundario" onClick={limpar}>Limpar busca e filtros</button>
        </div>
      ) : (
        <>
          <div className="pilha" style={{ gap: 16 }}>
            {resultado.slice(0, limite).map((r) => (
              <CartaoRelatorio key={r.id} relatorio={r} aoAbrir={abrir} />
            ))}
          </div>
          {resultado.length > limite && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <button type="button" className="ot-btn ot-btn--secundario" onClick={() => setLimite((l) => l + POR_PAGINA)}>
                Carregar mais relatórios <span className="suave">({resultado.length - limite})</span>
              </button>
            </div>
          )}
        </>
      )}

      <ResumoRelatorio relatorio={aberto} aoFechar={fechar} />
    </div>
  )
}
