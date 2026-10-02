import { useState } from 'react'
import Icone from '../../componentes/Icone'
import { Aviso, Campo, Dialogo, Selo } from '../../componentes/Basicos'
import { useAvisos } from '../../contexto/Avisos'
import { CATEGORIAS_INVENTARIO, SITUACAO_INVENTARIO, inventarioInicial } from '../../dados/painel'
import { baixarCsv, dataCurta, normalizar } from '../../util/formatar'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from '../comerciante/InicioComerciante'
import '../painel.css'

const GRUPOS = [
  { rotulo: 'Atrativos', icone: 'mapa', cor: 'var(--ciano)', base: 48, filtro: (i) => i.categoria.startsWith('Atrativo') },
  { rotulo: 'Equipamentos e serviços', icone: 'loja', cor: 'var(--rosa)', base: 126, filtro: (i) => i.categoria === 'Serviço turístico' || i.categoria === 'Evento permanente' },
  { rotulo: 'Infraestrutura de apoio', icone: 'predio', cor: 'var(--amarelo)', base: 31, filtro: (i) => i.categoria === 'Equipamento de apoio' },
]

const hojeIso = () => new Date().toISOString().slice(0, 10)
const VAZIO = { nome: '', local: 'Centro', categoria: CATEGORIAS_INVENTARIO[0] }

function FormularioItem({ item, aoSalvar, aoFechar }) {
  const [dados, setDados] = useState(item || VAZIO)
  const [erro, setErro] = useState('')
  const editando = !!item?.id

  const salvar = (e) => {
    e.preventDefault()
    if (dados.nome.trim().length < 3) {
      setErro('Dê um nome ao item, como "Mirante da serra".')
      return
    }
    aoSalvar({ ...dados, nome: dados.nome.trim() })
  }

  return (
    <form onSubmit={salvar} className="pilha" style={{ gap: 20 }} noValidate>
      <Campo id="item-nome" rotulo="Nome do item" erro={erro}>
        <input id="item-nome" className="ot-entrada" value={dados.nome} onChange={(e) => { setDados({ ...dados, nome: e.target.value }); setErro('') }} aria-invalid={!!erro} autoFocus />
      </Campo>
      <Campo id="item-categoria" rotulo="Categoria">
        <select id="item-categoria" className="ot-selecao" value={dados.categoria} onChange={(e) => setDados({ ...dados, categoria: e.target.value })}>
          {CATEGORIAS_INVENTARIO.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Campo>
      <Campo id="item-local" rotulo="Localização">
        <select id="item-local" className="ot-selecao" value={dados.local} onChange={(e) => setDados({ ...dados, local: e.target.value })}>
          <option>Centro</option>
          <option>Zona rural</option>
          <option>Bairros</option>
          <option>Distritos</option>
        </select>
      </Campo>
      <div className="ot-dialogo__acoes">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={aoFechar}>Cancelar</button>
        <button type="submit" className="ot-btn ot-btn--primario"><Icone nome="check" /> {editando ? 'Salvar e marcar revisado' : 'Adicionar item'}</button>
      </div>
    </form>
  )
}

export default function Inventario() {
  useTitulo('Inventário turístico')
  const { avisar } = useAvisos()
  const [itens, setItens] = useState(inventarioInicial)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [situacao, setSituacao] = useState('todas')
  const [editando, setEditando] = useState(null)

  const termo = normalizar(busca.trim())
  const lista = itens.filter(
    (i) =>
      (!termo || normalizar(`${i.nome} ${i.local}`).includes(termo)) &&
      (categoria === 'todas' || i.categoria === categoria) &&
      (situacao === 'todas' || i.situacao === situacao),
  )
  const precisamRevisao = itens.filter((i) => i.situacao !== 'em-dia').length

  const salvar = (dados) => {
    if (dados.id) {
      setItens((l) => l.map((i) => (i.id === dados.id ? { ...dados, atualizado: hojeIso(), situacao: 'em-dia' } : i)))
      avisar('Item atualizado', { texto: `${dados.nome} está em dia até ${dataCurta(hojeIso()).replace(/\d{4}$/, (a) => Number(a) + 1)}.` })
    } else {
      setItens((l) => [{ ...dados, id: Math.max(...l.map((i) => i.id)) + 1, atualizado: hojeIso(), situacao: 'em-dia' }, ...l])
      avisar('Item adicionado ao inventário', { texto: dados.nome })
    }
    setEditando(null)
  }

  const exportar = () =>
    baixarCsv('inventario-turistico-srs.csv', [
      ['Nome', 'Localização', 'Categoria', 'Última atualização', 'Situação'],
      ...itens.map((i) => [i.nome, i.local, i.categoria, i.atualizado, SITUACAO_INVENTARIO[i.situacao].rotulo]),
    ])

  const limpar = () => {
    setBusca('')
    setCategoria('todas')
    setSituacao('todas')
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Painel da Prefeitura · Fase 2" titulo="Inventário turístico" cor="var(--ciano)">
        <button type="button" className="ot-btn ot-btn--secundario" onClick={exportar}><Icone nome="download" /> Exportar</button>
        <button type="button" className="ot-btn ot-btn--primario" onClick={() => setEditando(VAZIO)}><Icone nome="mais" /> Novo item</button>
      </TopoPainel>
      <p className="corpo suave" style={{ marginTop: -12, marginBottom: 24 }}>Atrativos, equipamentos e serviços do município, com data da última atualização.</p>

      <div className="grade-3">
        {GRUPOS.map((g) => (
          <div key={g.rotulo} className="ot-mini ot-mini--linha">
            <span className="ot-indicador__icone" style={{ '--cor': g.cor, width: 56, height: 56 }}><Icone nome={g.icone} /></span>
            <div>
              <span className="ot-mini__v ot-num">{g.base + itens.filter(g.filtro).length - inventarioInicial.filter(g.filtro).length}</span>
              <span className="corpo-s" style={{ display: 'block', fontWeight: 700 }}>{g.rotulo}</span>
            </div>
          </div>
        ))}
      </div>

      {precisamRevisao > 0 ? (
        <Aviso tipo="alerta" style={{ marginTop: 24 }} titulo={`${precisamRevisao} ${precisamRevisao === 1 ? 'item precisa' : 'itens precisam'} de revisão`}>
          O inventário deve ser revisado a cada 12 meses. Enviamos um lembrete para o responsável de cada item 30 dias antes.{' '}
          <button type="button" className="link-botao" onClick={() => setSituacao(situacao === 'todas' ? 'revisar' : 'todas')}>
            {situacao === 'todas' ? 'Mostrar só esses' : 'Mostrar todos'}
          </button>
        </Aviso>
      ) : (
        <Aviso tipo="sucesso" style={{ marginTop: 24 }} titulo="Inventário em dia">Todos os itens foram revisados nos últimos 12 meses.</Aviso>
      )}

      <section className="ot-cartao" style={{ padding: '28px 28px 12px', marginTop: 24 }}>
        <div className="inventario__filtros">
          <div className="ot-entrada-icone" style={{ flex: 1, minWidth: 0 }}>
            <Icone nome="busca" />
            <input className="ot-entrada" type="search" placeholder="Buscar no inventário" aria-label="Buscar no inventário" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <select className="ot-selecao" aria-label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS_INVENTARIO.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="ot-selecao" aria-label="Situação" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="todas">Qualquer situação</option>
            {Object.entries(SITUACAO_INVENTARIO).map(([id, s]) => <option key={id} value={id}>{s.rotulo}</option>)}
          </select>
        </div>

        {lista.length ? (
          <div className="ot-tabela-moldura">
            <table className="ot-tabela ot-tabela--cartoes">
              <thead>
                <tr>
                  <th>Nome e localização</th>
                  <th>Categoria</th>
                  <th>Última atualização</th>
                  <th>Situação</th>
                  <th><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const s = SITUACAO_INVENTARIO[i.situacao]
                  return (
                    <tr key={i.id}>
                      <td><strong>{i.nome}</strong><span className="ot-tabela__sub">{i.local}</span></td>
                      <td data-rotulo="Categoria">{i.categoria}</td>
                      <td data-rotulo="Atualizado em">{dataCurta(i.atualizado)}</td>
                      <td data-rotulo="Situação"><Selo situacao={s.selo} icone={s.icone}>{s.rotulo}</Selo></td>
                      <td className="ot-tabela__acoes">
                        <button type="button" className="ot-btn ot-btn--fantasma ot-btn--p" onClick={() => setEditando(i)} aria-label={`Editar ${i.nome}`}>
                          <Icone nome="lapis" tamanho="s" /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ot-vazio">
            <span className="ot-vazio__icone ot-bolha"><Icone nome="busca" tamanho="l" /></span>
            <h3 className="titulo-3">Nenhum item encontrado</h3>
            <button type="button" className="ot-btn ot-btn--secundario" onClick={limpar}>Limpar filtros</button>
          </div>
        )}
      </section>
      <p className="ot-fonte" style={{ marginTop: 12 }}>Itens, datas e contagens de exemplo para o protótipo.</p>

      <Dialogo aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar item' : 'Novo item do inventário'}>
        {editando && <FormularioItem key={editando.id || 'novo'} item={editando.id ? editando : null} aoSalvar={salvar} aoFechar={() => setEditando(null)} />}
      </Dialogo>
    </div>
  )
}
