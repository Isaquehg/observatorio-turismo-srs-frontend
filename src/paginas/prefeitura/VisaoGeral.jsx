import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Campo } from '../../componentes/Basicos'
import { BarrasVerticais } from '../../componentes/Graficos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import { INDICADORES_PUBLICAVEIS } from '../../dados/painel'
import { MESES_LONGOS, numero } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import { TabelaEnvios } from './Envios'
import RevisarEnvio from './RevisarEnvio'
import '../painel.css'

const RESPOSTA_MENSAL = [
  { id: 'mar', nome: 'Mar', valor: 52 },
  { id: 'abr', nome: 'Abr', valor: 55 },
  { id: 'mai', nome: 'Mai', valor: 57 },
  { id: 'jun', nome: 'Jun', valor: 61 },
  { id: 'jul', nome: 'Jul', valor: 60 },
  { id: 'ago', nome: 'Ago', valor: 64 },
]

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function PublicarRapido() {
  const { avisar } = useAvisos()
  const hoje = new Date()
  const periodos = [1, 2, 3].map((i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    return `${MESES_LONGOS[d.getMonth()].replace(/^./, (l) => l.toUpperCase())} de ${d.getFullYear()}`
  })
  const [indicador, setIndicador] = useState(INDICADORES_PUBLICAVEIS[0])
  const [periodo, setPeriodo] = useState(periodos[0])
  const [valor, setValor] = useState('')
  const [mostrar, setMostrar] = useState(true)
  const [erro, setErro] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [arrastando, setArrastando] = useState(false)
  const entradaArquivo = useRef(null)

  const publicar = (e) => {
    e.preventDefault()
    const num = Number(valor.replace(/\./g, '').replace(',', '.'))
    if (!valor.trim() || Number.isNaN(num) || num < 0) {
      setErro('Digite um número, como 1.982.')
      document.getElementById('valor-rapido')?.focus()
      return
    }
    setErro('')
    setValor('')
    avisar(mostrar ? 'Publicado no site' : 'Salvo sem publicar', { texto: `${indicador} · ${periodo}: ${numero(num)}.` })
  }

  const receberArquivo = (f) => {
    if (!f) return
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      avisar('Formato não aceito', { texto: 'Envie uma planilha CSV ou XLSX.', tipo: 'erro' })
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      avisar('Arquivo grande demais', { texto: 'O limite é 10 MB.', tipo: 'erro' })
      return
    }
    setArquivo(f)
  }

  return (
    <section className="ot-cartao publicar" aria-labelledby="titulo-publicar">
      <div className="publicar__cab">
        <div>
          <h2 className="titulo-2" id="titulo-publicar">Publicar dado rápido</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Atualize um indicador do site sem sair do painel.</p>
        </div>
        <label className="ot-check">
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} /> Mostrar no site assim que publicar
        </label>
      </div>
      <form className="publicar__campos" onSubmit={publicar} noValidate>
        <Campo id="indicador-rapido" rotulo="Indicador">
          <select id="indicador-rapido" className="ot-selecao" value={indicador} onChange={(e) => setIndicador(e.target.value)}>
            {INDICADORES_PUBLICAVEIS.map((i) => <option key={i}>{i}</option>)}
          </select>
        </Campo>
        <Campo id="periodo-rapido" rotulo="Período">
          <select id="periodo-rapido" className="ot-selecao" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {periodos.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Campo>
        <Campo id="valor-rapido" rotulo="Valor" erro={erro}>
          <input id="valor-rapido" className="ot-entrada ot-num" inputMode="decimal" placeholder="Ex.: 1.982" value={valor} onChange={(e) => { setValor(e.target.value); setErro('') }} aria-invalid={!!erro} />
        </Campo>
        <div className="publicar__botao">
          <button type="submit" className="ot-btn ot-btn--primario ot-btn--largo"><Icone nome="upload" /> Publicar</button>
        </div>
      </form>

      <div
        className="ot-drop"
        data-arrastando={arrastando}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); receberArquivo(e.dataTransfer.files[0]) }}
      >
        <Icone nome={arquivo ? 'arquivo' : 'nuvem'} tamanho="l" />
        {arquivo ? (
          <div style={{ flex: 1 }}>
            <strong>{arquivo.name}</strong>
            <br />
            <span className="corpo-s suave">{(arquivo.size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB · pronto para conferir</span>
          </div>
        ) : (
          <div>
            <strong>Ou envie uma planilha com vários indicadores</strong>
            <br />
            <span className="corpo-s suave">Arraste para cá. CSV ou XLSX, até 10 MB. Você confere tudo antes de publicar.</span>
          </div>
        )}
        {arquivo ? (
          <div className="linha-acoes">
            <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => setArquivo(null)}>Trocar</button>
            <button type="button" className="ot-btn ot-btn--solido ot-btn--p" onClick={() => { avisar('Planilha recebida', { texto: 'Abrimos a conferência linha a linha antes de publicar.', tipo: 'info' }); setArquivo(null) }}>
              Conferir dados
            </button>
          </div>
        ) : (
          <button type="button" className="ot-btn ot-btn--secundario ot-btn--p" onClick={() => entradaArquivo.current?.click()}>Escolher arquivo</button>
        )}
        <input ref={entradaArquivo} type="file" accept=".csv,.xlsx" hidden onChange={(e) => { receberArquivo(e.target.files[0]); e.target.value = '' }} />
      </div>
    </section>
  )
}

export default function VisaoGeral() {
  useTitulo('Painel da Prefeitura')
  const { pendentes } = useEnvios()
  const [revisando, setRevisando] = useState(null)
  const atrasados = pendentes.filter((e) => e.atrasado).length

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Painel da Prefeitura · SMCELT" titulo={`${saudacao()}, equipe de Turismo`} cor="var(--ciano)">
        <a href="#titulo-publicar" className="ot-btn ot-btn--primario" onClick={(e) => { e.preventDefault(); document.getElementById('valor-rapido')?.focus() }}>
          <Icone nome="mais" /> Publicar novo dado
        </a>
      </TopoPainel>

      <div className="grade-4 grade-4--compacta">
        <Link to="/prefeitura/envios" className="ot-mini ot-mini--link">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Envios para validar</span>
          <span className="ot-mini__v ot-num">{pendentes.length}</span>
          {atrasados > 0 ? (
            <span className="ot-selo ot-selo--analise" style={{ alignSelf: 'flex-start' }}><Icone nome="relogio" />{atrasados} há mais de 3 dias</span>
          ) : (
            <span className="corpo-s suave">Nenhum atrasado</span>
          )}
        </Link>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Taxa de resposta · agosto</span>
          <span className="ot-mini__v ot-num">64%</span>
          <span className="corpo-s suave">27 de 42 estabelecimentos</span>
        </div>
        <div className="ot-mini">
          <span className="corpo-s" style={{ fontWeight: 700 }}>Último dado publicado</span>
          <span className="ot-mini__v ot-mini__v--texto">12 set. 2026</span>
          <span className="corpo-s suave">Ocupação de agosto</span>
        </div>
        <div className="ot-mini" style={{ background: 'var(--amarelo)' }}>
          <span className="corpo-s" style={{ fontWeight: 700 }}>Próximo relatório</span>
          <span className="ot-mini__v ot-mini__v--texto">OT nº 005/2026</span>
          <span className="corpo-s">Previsto para 30 out.</span>
        </div>
      </div>

      <div className="painel__grade painel__grade--larga">
        <section className="ot-cartao" style={{ padding: '28px 28px 12px' }}>
          <div className="ot-cartao__cab">
            <div>
              <h2 className="titulo-2">Aguardando validação</h2>
              <p className="corpo-s suave">Os mais antigos primeiro.</p>
            </div>
            <Link to="/prefeitura/envios" className="ot-btn ot-btn--fantasma ot-btn--p">Ver todos <Icone nome="seta" tamanho="s" /></Link>
          </div>
          {pendentes.length ? (
            <TabelaEnvios lista={[...pendentes].reverse().slice(0, 4)} aoRevisar={setRevisando} compacta />
          ) : (
            <div className="ot-vazio">
              <span className="ot-vazio__icone ot-bolha" style={{ background: 'var(--ciano)' }}><Icone nome="check-circulo" tamanho="l" /></span>
              <h3 className="titulo-3">Tudo validado!</h3>
            </div>
          )}
        </section>

        <section className="ot-cartao grafico">
          <h2 className="titulo-3">Taxa de resposta</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Estabelecimentos que enviaram dados, por mês (%)</p>
          <div className="grafico__corpo">
            <BarrasVerticais descricao="Taxa de resposta dos estabelecimentos de março a agosto" itens={RESPOSTA_MENSAL.map((r, i) => ({ ...r, hex: i === RESPOSTA_MENSAL.length - 1 ? '#6C5CE0' : '#B986ED' }))} />
          </div>
          <p className="ot-fonte">Meta para 2026: 75% de resposta.</p>
        </section>
      </div>

      <PublicarRapido />

      <RevisarEnvio envio={revisando} aoFechar={() => setRevisando(null)} />
    </div>
  )
}
