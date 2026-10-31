import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Aviso, Campo } from '../../componentes/Basicos'
import { useAvisos } from '../../contexto/Avisos'
import { MEU_NEGOCIO } from '../../dados/painel'
import { AREAS, CHAVE_ESTABELECIMENTO, FAIXAS_PRECO } from '../../dados/explorar'
import { ler, gravar } from '../../util/armazenamento'
import { useTitulo } from '../../util/ganchos'
import { TopoPainel } from './InicioComerciante'
import '../painel.css'

// Como o negócio aparece para turistas em /explorar e /turista
const VITRINE = {
  area: 'Centro',
  descricao: 'Pousada tranquila no Centro, com café da manhã mineiro e jardim.',
  destaques: 'Café da manhã mineiro, Jardim, Wi-Fi',
  preco: '$$',
  publicar: true,
}

export default function Estabelecimento() {
  useTitulo('Meu estabelecimento')
  const { avisar } = useAvisos()
  const [dados, setDados] = useState(() => ({ ...MEU_NEGOCIO, ...VITRINE, ...ler(CHAVE_ESTABELECIMENTO, {}) }))
  const [salvo, setSalvo] = useState(dados)
  const [erros, setErros] = useState({})
  const alterado = JSON.stringify(dados) !== JSON.stringify(salvo)

  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }))

  const salvar = (e) => {
    e.preventDefault()
    const novos = {}
    if (!dados.responsavel.trim()) novos.responsavel = 'Informe o nome de quem responde pelo negócio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email)) novos.email = 'Digite um e-mail válido.'
    if (dados.telefone.replace(/\D/g, '').length < 10) novos.telefone = 'Inclua o DDD, como (35) 99999-9999.'
    if (dados.publicar && dados.descricao.trim().length < 20) novos.descricao = 'Escreva ao menos 20 caracteres para os turistas entenderem o seu negócio.'
    setErros(novos)
    if (Object.keys(novos).length) return document.getElementById(Object.keys(novos)[0])?.focus()
    gravar(CHAVE_ESTABELECIMENTO, { responsavel: dados.responsavel, email: dados.email, telefone: dados.telefone, endereco: dados.endereco, area: dados.area, descricao: dados.descricao.trim(), destaques: dados.destaques, preco: dados.preco, publicar: dados.publicar })
    setSalvo(dados)
    avisar('Dados atualizados', { texto: dados.publicar ? 'Seu estabelecimento já aparece com as novas informações para os turistas.' : 'As mudanças já valem. Seu estabelecimento está oculto para os turistas.' })
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo="Meu estabelecimento" />

      <div className="painel__grade">
        <form className="ot-cartao formulario" onSubmit={salvar} noValidate>
          <h2 className="titulo-3">Contato e responsável</h2>
          <div className="form-grade">
            <Campo id="nome" rotulo="Nome do estabelecimento" ajuda="Para mudar o nome, fale com a SMCELT.">
              <input id="nome" className="ot-entrada" value={dados.nome} readOnly aria-readonly="true" style={{ background: 'var(--superficie-2)' }} />
            </Campo>
            <Campo id="cnpj" rotulo="CNPJ">
              <input id="cnpj" className="ot-entrada ot-num" value={dados.cnpj} readOnly aria-readonly="true" style={{ background: 'var(--superficie-2)' }} />
            </Campo>
            <Campo id="responsavel" rotulo="Responsável" erro={erros.responsavel}>
              <input id="responsavel" className="ot-entrada" value={dados.responsavel} onChange={mudar('responsavel')} autoComplete="name" aria-invalid={!!erros.responsavel} />
            </Campo>
            <Campo id="telefone" rotulo="Telefone ou WhatsApp" erro={erros.telefone}>
              <input id="telefone" type="tel" className="ot-entrada" value={dados.telefone} onChange={mudar('telefone')} autoComplete="tel" aria-invalid={!!erros.telefone} />
            </Campo>
            <div className="form-grade__largo">
              <Campo id="email" rotulo="E-mail para avisos" erro={erros.email}>
                <input id="email" type="email" className="ot-entrada" value={dados.email} onChange={mudar('email')} autoComplete="email" aria-invalid={!!erros.email} />
              </Campo>
            </div>
            <div className="form-grade__largo">
              <Campo id="endereco" rotulo="Endereço">
                <input id="endereco" className="ot-entrada" value={dados.endereco} onChange={mudar('endereco')} autoComplete="street-address" />
              </Campo>
            </div>
          </div>

          <h2 className="titulo-3" style={{ marginTop: 36 }}>Capacidade cadastrada</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>Usada para conferir os envios mensais.</p>
          <dl className="capacidade">
            <div><dt>Quartos</dt><dd className="ot-num">{dados.quartos}</dd></div>
            <div><dt>Leitos</dt><dd className="ot-num">{dados.leitos}</dd></div>
            <div><dt>Tipo</dt><dd>{dados.tipo}</dd></div>
          </dl>
          <Aviso titulo="Ampliou ou reformou?" icone="info">
            Mudanças de capacidade passam pela SMCELT. Escreva para <a href="mailto:turismo@pmsrs.mg.gov.br">turismo@pmsrs.mg.gov.br</a>.
          </Aviso>

          <h2 className="titulo-3" style={{ marginTop: 36 }}>Como os turistas veem você</h2>
          <p className="corpo-s suave" style={{ marginTop: 4 }}>
            Aparece em <Link to="/explorar">Explorar</Link> e na área do turista. A foto é cadastrada pela SMCELT.
          </p>
          <label className="ot-check" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={dados.publicar} onChange={(e) => setDados((d) => ({ ...d, publicar: e.target.checked }))} /> Mostrar meu estabelecimento para turistas
          </label>
          <div className="form-grade">
            <Campo id="area" rotulo="Área onde você opera" ajuda="Escolha a região da cidade.">
              <select id="area" className="ot-selecao" value={dados.area} onChange={mudar('area')}>
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Campo>
            <Campo id="preco" rotulo="Faixa de preço">
              <select id="preco" className="ot-selecao" value={dados.preco} onChange={mudar('preco')}>
                {Object.entries(FAIXAS_PRECO).map(([v, r]) => <option key={v} value={v}>{v} · {r}</option>)}
              </select>
            </Campo>
            <div className="form-grade__largo">
              <Campo id="descricao" rotulo="Descrição" erro={erros.descricao} ajuda={`${dados.descricao.length}/160 caracteres`}>
                <textarea id="descricao" className="ot-entrada" rows={3} maxLength={160} value={dados.descricao} onChange={mudar('descricao')} aria-invalid={!!erros.descricao} />
              </Campo>
            </div>
            <div className="form-grade__largo">
              <Campo id="destaques" rotulo="Destaques" ajuda="Até 3, separados por vírgula. Ex.: Wi-Fi, Piscina, Aceita pets.">
                <input id="destaques" className="ot-entrada" value={dados.destaques} onChange={mudar('destaques')} />
              </Campo>
            </div>
          </div>

          <div className="formulario__acoes">
            <span className="corpo-s suave">{alterado ? 'Há mudanças não salvas.' : 'Tudo salvo.'}</span>
            <div className="formulario__acoes-dir">
              <button type="button" className="ot-btn ot-btn--fantasma" disabled={!alterado} onClick={() => { setDados(salvo); setErros({}) }}>
                Desfazer
              </button>
              <button type="submit" className="ot-btn ot-btn--primario" disabled={!alterado}>
                <Icone nome="check" /> Salvar alterações
              </button>
            </div>
          </div>
        </form>

        <aside className="pilha" style={{ gap: 20 }}>
          <section className="ot-cartao cadastur-mini" style={{ alignItems: 'flex-start' }}>
            <span className="ot-indicador__icone" style={{ '--cor': 'var(--ciano)' }}><Icone nome="escudo" /></span>
            <div style={{ flex: 1 }}>
              <strong>Cadastur ativo</strong>
              <p className="corpo-s suave">Válido até {dados.cadasturValidade}. Avisamos 60 dias antes de vencer.</p>
            </div>
          </section>
          <section className="ot-cartao dica dica--rosa">
            <img src="ilustracoes/comerciante.svg" alt="" className="dica__arte" />
            <h2 className="titulo-3">Precisa de ajuda?</h2>
            <p className="corpo-s">A Coordenação de Turismo atende de segunda a sexta, das 8h às 17h.</p>
            <a href="tel:+5535991191112" className="ot-btn ot-btn--secundario ot-btn--p" style={{ alignSelf: 'flex-start' }}>
              <Icone nome="telefone" tamanho="s" /> (35) 99119-1112
            </a>
          </section>
        </aside>
      </div>
    </div>
  )
}
