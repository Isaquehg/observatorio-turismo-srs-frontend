import { useEffect, useMemo, useRef, useState } from 'react'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Aviso, Migalhas, Sobretitulo } from '../componentes/Basicos'
import { CartaoRelatorio, ResumoRelatorio, useResumo, useDownloadRelatorio } from '../componentes/Cartoes'
import { CATEGORIAS_RELATORIO, categoriaDe } from '../dados/relatorios'
import { listarRelatorios } from '../util/relatoriosApi'
import { mesAnoLongo } from '../util/formatar'
import { useTitulo, comportamentoRolagem } from '../util/ganchos'
import './publico.css'

const POR_PAGINA = 5

export default function Relatorios() {
  useTitulo('Relatórios')
  const { aberto, abrir, fechar } = useResumo()
  const baixar = useDownloadRelatorio()
  const [termo, setTermo] = useState('')
  const [ano, setAno] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [ordem, setOrdem] = useState('recentes')
  const [pagina, setPagina] = useState(1)
  const [itens, setItens] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: POR_PAGINA, total: 0, total_pages: 0 })
  const [anosDisponiveis, setAnosDisponiveis] = useState([])
  const [destaque, setDestaque] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const listaRef = useRef(null)

  const filtrando = termo.trim() !== '' || ano !== 'todos' || categoria !== 'todas'

  // Loads featured report and available publication years once on mount for the header highlight and year filter
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    Promise.all([
      listarRelatorios({ featured: true, limit: 1 }, { signal: controlador.signal }).catch(() => ({ data: [] })),
      listarRelatorios({ limit: 100 }, { signal: controlador.signal }).catch(() => ({ data: [] })),
    ]).then(([resDestaque, resTodos]) => {
      if (!ativo) return
      const anos = [...new Set(resTodos.data.map((r) => r.data.slice(0, 4)).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a),
      )
      setAnosDisponiveis(anos)
      setDestaque(resDestaque.data[0] || resTodos.data[0] || null)
    })

    return () => {
      ativo = false
      controlador.abort()
    }
  }, [tentativa])

  // Fetches paginated and filtered reports from GET /api/reports
  useEffect(() => {
    const controlador = new AbortController()
    let ativo = true

    async function carregar() {
      if (pagina === 1) {
        setCarregando(true)
      } else {
        setCarregandoMais(true)
      }
      setErro('')

      try {
        const resposta = await listarRelatorios(
          {
            q: termo.trim() || undefined,
            year: ano !== 'todos' ? ano : undefined,
            category: categoria !== 'todas' ? categoria : undefined,
            sort: ordem,
            page: pagina,
            limit: POR_PAGINA,
          },
          { signal: controlador.signal },
        )
        if (!ativo) return

        setMeta(resposta.meta)
        setItens((atual) => {
          if (pagina === 1) return resposta.data
          const existentes = new Set(atual.map((item) => item.id))
          return [...atual, ...resposta.data.filter((item) => !existentes.has(item.id))]
        })

        // Keeps available years populated even if the mount metadata call returned empty
        if (pagina === 1 && !filtrando) {
          setAnosDisponiveis((atuais) => {
            if (atuais.length > 0) return atuais
            return [...new Set(resposta.data.map((r) => r.data.slice(0, 4)).filter(Boolean))].sort((a, b) =>
              b.localeCompare(a),
            )
          })
          setDestaque((atual) => atual || resposta.data.find((r) => r.novo) || resposta.data[0] || null)
        }
      } catch (causa) {
        if (!ativo || causa?.name === 'AbortError') return
        setErro(causa?.message || 'Não foi possível carregar os relatórios publicados.')
      } finally {
        if (ativo) {
          setCarregando(false)
          setCarregandoMais(false)
        }
      }
    }

    carregar()
    return () => {
      ativo = false
      controlador.abort()
    }
  }, [termo, ano, categoria, ordem, pagina, filtrando, tentativa])

  const resultado = useMemo(() => {
    if (!filtrando && destaque) {
      return itens.filter((r) => r.id !== destaque.id)
    }
    return itens
  }, [itens, filtrando, destaque])

  const limpar = () => {
    setTermo('')
    setAno('todos')
    setCategoria('todas')
    setPagina(1)
  }

  const totalExibido = !filtrando && destaque ? Math.max(0, (meta.total || itens.length) - 1) : (meta.total || resultado.length)
  const restantes = Math.max(0, (meta.total || itens.length) - itens.length)
  const temMaisPaginas = pagina < (meta.total_pages || 1)

  const [anoDestaque, mesDestaque] = destaque?.data ? destaque.data.split('-').map(Number) : [null, null]
  const catDestaque = destaque ? categoriaDe(destaque.categoria) || CATEGORIAS_RELATORIO[1] : null
  const metaPdfDestaque = destaque
    ? ['PDF', destaque.paginas != null ? `${destaque.paginas} páginas` : '', destaque.tamanho].filter(Boolean).join(' · ')
    : ''

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
          listaRef.current?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' })
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
              setPagina(1)
            }}
            placeholder="Tema, ano ou nº do relatório"
            aria-label="Buscar relatórios"
          />
        </div>
        <select
          className="ot-selecao busca__ano"
          value={ano}
          onChange={(e) => {
            setAno(e.target.value)
            setPagina(1)
          }}
          aria-label="Ano de publicação"
        >
          <option value="todos">Todos os anos</option>
          {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button type="submit" className="ot-btn ot-btn--primario">Buscar</button>
      </form>

      <div className="rolagem-x" style={{ margin: '20px calc(-1 * var(--calha)) 36px' }} role="group" aria-label="Tipo de relatório">
        <button
          type="button"
          className="ot-chip"
          aria-pressed={categoria === 'todas'}
          onClick={() => {
            setCategoria('todas')
            setPagina(1)
          }}
        >
          Todos
        </button>
        {CATEGORIAS_RELATORIO.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ot-chip"
            aria-pressed={categoria === c.id}
            onClick={() => {
              setCategoria(c.id)
              setPagina(1)
            }}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {!filtrando && destaque && !carregando && !erro && (
        <article className="destaque">
          <div className="destaque__capa ot-gradiente">
            <Sobretitulo>Relatório OT{anoDestaque ? ` · ${anoDestaque}` : ''}</Sobretitulo>
            <p className="titulo-1 destaque__capa-titulo">{destaque.titulo}</p>
            <Adesivo tipo="explosao" cor="var(--amarelo)" tamanho={120} />
          </div>
          <div className="destaque__txt">
            <div className="linha-acoes" style={{ gap: 10 }}>
              <Sobretitulo>{catDestaque.rotulo}</Sobretitulo>
              {destaque.novo && <span className="ot-selo ot-selo--novo">Novo</span>}
            </div>
            <h2 className="titulo-1">{destaque.titulo}</h2>
            {destaque.resumo && <p className="corpo suave">{destaque.resumo}</p>}
            <div className="ot-relatorio__meta" style={{ fontSize: '1.0625rem' }}>
              {anoDestaque && mesDestaque && (
                <span><Icone nome="calendario" tamanho="s" /> {mesAnoLongo(anoDestaque, mesDestaque).replace(/^./, (l) => l.toUpperCase())}</span>
              )}
              <span><Icone nome="arquivo" tamanho="s" /> {metaPdfDestaque}</span>
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
          <span className="suave" style={{ fontWeight: 500 }}>({totalExibido})</span>
        </h2>
        <select
          className="ot-selecao relatorios__ordem"
          value={ordem}
          onChange={(e) => {
            setOrdem(e.target.value)
            setPagina(1)
          }}
          aria-label="Ordenar relatórios"
        >
          <option value="recentes">Mais recentes primeiro</option>
          <option value="antigos">Mais antigos primeiro</option>
          <option value="titulo">Ordem alfabética</option>
        </select>
      </div>

      {carregando ? (
        <div className="ot-cartao ot-vazio" role="status" aria-live="polite">
          <span className="girando" aria-hidden="true" />
          <p className="corpo suave">Carregando relatórios…</p>
        </div>
      ) : erro ? (
        <Aviso tipo="erro" titulo="Não foi possível carregar os relatórios">
          {erro}{' '}
          <button type="button" className="link-botao" onClick={() => setTentativa((v) => v + 1)}>
            Tentar novamente
          </button>
        </Aviso>
      ) : resultado.length === 0 ? (
        !filtrando && destaque ? null : (
          <div className="ot-cartao ot-vazio">
            <span className="ot-vazio__icone ot-bolha"><Icone nome="busca" tamanho="l" /></span>
            <h3 className="titulo-3">Nenhum relatório encontrado</h3>
            <p className="corpo suave" style={{ maxWidth: '40ch' }}>
              {filtrando
                ? 'Tente outra palavra ou tire algum filtro. Você também pode pedir um dado à SMCELT.'
                : 'Nenhum relatório publicado até o momento.'}
            </p>
            {filtrando && (
              <button type="button" className="ot-btn ot-btn--secundario" onClick={limpar}>Limpar busca e filtros</button>
            )}
          </div>
        )
      ) : (
        <>
          <div className="pilha" style={{ gap: 16 }}>
            {resultado.map((r) => (
              <CartaoRelatorio key={r.id} relatorio={r} aoAbrir={abrir} />
            ))}
          </div>
          {temMaisPaginas && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <button
                type="button"
                className="ot-btn ot-btn--secundario"
                disabled={carregandoMais}
                aria-busy={carregandoMais}
                onClick={() => setPagina((p) => p + 1)}
              >
                {carregandoMais ? 'Carregando…' : (
                  <>Carregar mais relatórios{restantes > 0 && <span className="suave"> ({restantes})</span>}</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <ResumoRelatorio relatorio={aberto} aoFechar={fechar} />
    </div>
  )
}
