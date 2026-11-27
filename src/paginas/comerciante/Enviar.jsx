import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icone from '../../componentes/Icone'
import { Adesivo } from '../../componentes/Adesivo'
import { Aviso, Campo } from '../../componentes/Basicos'
import { useEnvios } from '../../contexto/Envios'
import { useAvisos } from '../../contexto/Avisos'
import {
  MOTIVOS_VIAGEM,
  ORIGENS_HOSPEDES,
  motivoParaCodigo,
  origemParaCodigo,
} from '../../util/enviosApi'
import { MESES_LONGOS, mesAnoLongo, numero } from '../../util/formatar'
import { ler, gravar } from '../../util/armazenamento'
import { useTitulo } from '../../util/ganchos'
import { periodoAtual } from './prazo'
import { TopoPainel } from './InicioComerciante'
import '../painel.css'

const ETAPAS = ['Período', 'Ocupação', 'Hóspedes', 'Revisar e enviar']
const CHAVE_RASCUNHO = 'ot-srs:rascunho'

const diasNoMes = (ano, mes) => new Date(ano, mes, 0).getDate()
const soNumeros = (v) => v.replace(/\D/g, '').slice(0, 6)
const n = (v) => (v === '' ? NaN : Number(v))

function opcoesDePeriodo(extra = null) {
  const { ano, mes } = periodoAtual()
  const lista = [0, 1, 2].map((i) => {
    const d = new Date(ano, mes - 1 - i, 1)
    return { ano: d.getFullYear(), mes: d.getMonth() + 1 }
  })
  if (extra?.ano && extra?.mes && !lista.some((p) => p.ano === extra.ano && p.mes === extra.mes)) {
    lista.push({ ano: extra.ano, mes: extra.mes })
  }
  return lista
}

function validarEtapa(etapa, d, capacidade) {
  const e = {}
  const dias = diasNoMes(d.ano, d.mes)
  if (etapa === 1) {
    if (!(n(d.quartos) > 0)) e.quartos = 'Informe quantos quartos estavam disponíveis.'
    else if (capacidade.quartos != null && n(d.quartos) > capacidade.quartos) {
      e.quartos = `Maior que a capacidade cadastrada (${capacidade.quartos} quartos). Se aumentou, atualize em Meu estabelecimento.`
    }
    if (!(n(d.leitos) > 0)) e.leitos = 'Informe o número de leitos.'
    else if (n(d.leitos) < n(d.quartos)) e.leitos = 'O número de leitos não pode ser menor que o de quartos.'
    else if (capacidade.leitos != null && n(d.leitos) > capacidade.leitos) {
      e.leitos = `Maior que a capacidade cadastrada (${capacidade.leitos} leitos). Se aumentou, atualize em Meu estabelecimento.`
    }
    if (d.diarias === '') e.diarias = 'Informe as diárias vendidas, mesmo que seja 0.'
    else if (n(d.quartos) > 0 && n(d.diarias) > n(d.quartos) * dias) {
      e.diarias = `Passa do possível: com ${d.quartos} quartos em ${dias} dias, o máximo é ${numero(n(d.quartos) * dias)}.`
    }
    if (d.funcionarios === '') e.funcionarios = 'Informe o número de funcionários, mesmo que seja 0.'
  }
  if (etapa === 2) {
    if (!(n(d.hospedes) > 0)) e.hospedes = 'Informe quantos hóspedes você recebeu no mês.'
    else if (n(d.hospedes) > n(d.leitos) * dias) {
      e.hospedes = 'Esse número passa da capacidade de leitos do mês. Confira, por favor.'
    }
    if (!d.motivo) e.motivo = 'Escolha o motivo mais comum.'
    if (!d.origem) e.origem = 'Escolha de onde veio a maioria.'
  }
  if (etapa === 3 && !d.confirmo) e.confirmo = 'Marque a confirmação para enviar.'
  return e
}

function CampoNumero({ id, valor, aoMudar, erro, ...resto }) {
  return (
    <Campo id={id} erro={erro} {...resto}>
      <input
        id={id}
        className="ot-entrada ot-num"
        inputMode="numeric"
        autoComplete="off"
        value={valor}
        onChange={(e) => aoMudar(soNumeros(e.target.value))}
        aria-invalid={!!erro}
        aria-describedby={`${id}-ajuda`}
        placeholder={resto.placeholder}
      />
    </Campo>
  )
}

export default function Enviar() {
  useTitulo('Enviar dados')
  const [params] = useSearchParams()
  const { envios, estabelecimento, salvarEnvio } = useEnvios()
  const { avisar } = useAvisos()
  const tituloRef = useRef(null)

  const idParam = params.get('id') ? Number(params.get('id')) : null
  const anoParam = params.get('ano')
  const mesParam = params.get('mes')
  const doLink = useMemo(
    () => (mesParam ? { ano: Number(anoParam), mes: Number(mesParam) } : null),
    [anoParam, mesParam],
  )

  const envioEmEdicao = useMemo(() => {
    if (idParam) {
      return envios.find((item) => item.id === idParam && ['draft', 'returned'].includes(item.status)) || null
    }
    if (doLink) {
      return (
        envios.find(
          (item) =>
            item.ano === doLink.ano &&
            item.mes === doLink.mes &&
            ['draft', 'returned'].includes(item.status),
        ) || null
      )
    }
    return null
  }, [envios, idParam, doLink])

  const periodos = useMemo(
    () => opcoesDePeriodo(envioEmEdicao || doLink),
    [envioEmEdicao, doLink],
  )

  const [dados, setDados] = useState(() => {
    const base = {
      ano: periodos[0].ano,
      mes: periodos[0].mes,
      quartos: '',
      leitos: '',
      diarias: '',
      funcionarios: '',
      hospedes: '',
      motivo: '',
      origem: '',
      observacoes: '',
      confirmo: false,
    }
    if (doLink) return { ...base, ...doLink }
    return { ...base, ...ler(CHAVE_RASCUNHO, {}) }
  })

  const [etapa, setEtapa] = useState(0)
  const [erros, setErros] = useState({})
  const [erroApi, setErroApi] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [salvandoRascunho, setSalvandoRascunho] = useState(false)
  const [envioConcluido, setEnvioConcluido] = useState(null)
  const primeiraVez = useRef(true)
  const hidratadoRef = useRef(null)

  // Hydrates form defaults from the merchant's registered capacity when creating a fresh submission
  useEffect(() => {
    if (!estabelecimento || envioEmEdicao) return
    setDados((atual) => ({
      ...atual,
      quartos:
        atual.quartos === '' && estabelecimento.rooms_count != null
          ? String(estabelecimento.rooms_count)
          : atual.quartos,
      leitos:
        atual.leitos === '' && estabelecimento.beds_count != null
          ? String(estabelecimento.beds_count)
          : atual.leitos,
    }))
  }, [estabelecimento, envioEmEdicao])

  // Pre-fills all fields when correcting a returned submission or resuming a backend draft
  useEffect(() => {
    if (!envioEmEdicao || hidratadoRef.current === envioEmEdicao.id) return
    hidratadoRef.current = envioEmEdicao.id
    setDados({
      ano: envioEmEdicao.ano,
      mes: envioEmEdicao.mes,
      quartos: envioEmEdicao.quartos == null ? '' : String(envioEmEdicao.quartos),
      leitos: envioEmEdicao.leitos == null ? '' : String(envioEmEdicao.leitos),
      diarias: envioEmEdicao.diarias == null ? '' : String(envioEmEdicao.diarias),
      funcionarios: envioEmEdicao.funcionarios == null ? '' : String(envioEmEdicao.funcionarios),
      hospedes: envioEmEdicao.hospedes == null ? '' : String(envioEmEdicao.hospedes),
      motivo: envioEmEdicao.motivoViagem || '',
      origem: envioEmEdicao.origemHospedes || '',
      observacoes: envioEmEdicao.observacoes || '',
      confirmo: false,
    })
  }, [envioEmEdicao])

  useEffect(() => {
    if (!doLink && !idParam && ler(CHAVE_RASCUNHO, null)) {
      avisar('Rascunho recuperado', { texto: 'Continuamos de onde você parou.', tipo: 'info' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Leva o foco para o título a cada etapa: quem usa leitor de tela sabe onde está
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    tituloRef.current?.focus()
  }, [etapa, envioConcluido])

  const mudar = (campo) => (valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }))
    if (erroApi) setErroApi('')
  }

  const capacidade = {
    quartos: estabelecimento?.rooms_count ?? null,
    leitos: estabelecimento?.beds_count ?? null,
  }
  const dias = diasNoMes(dados.ano, dados.mes)
  const ocupacao =
    n(dados.quartos) > 0 && dados.diarias !== ''
      ? Math.round((n(dados.diarias) / (n(dados.quartos) * dias)) * 100)
      : null
  const nomeMes = MESES_LONGOS[dados.mes - 1]
  const vinculoPendente = estabelecimento?.link_status === 'pending'

  const montarPayload = (submit) => ({
    idExistente: envioEmEdicao?.id,
    ano: dados.ano,
    mes: dados.mes,
    roomsAvailable: dados.quartos === '' ? null : n(dados.quartos),
    bedsAvailable: dados.leitos === '' ? null : n(dados.leitos),
    roomNightsSold: dados.diarias === '' ? null : n(dados.diarias),
    employeesCount: dados.funcionarios === '' ? null : n(dados.funcionarios),
    guestsCount: dados.hospedes === '' ? null : n(dados.hospedes),
    mainTravelReason: motivoParaCodigo(dados.motivo),
    mainOrigin: origemParaCodigo(dados.origem),
    notes: dados.observacoes,
    submit,
  })

  const avancar = () => {
    setErroApi('')
    const e = validarEtapa(etapa, dados, capacidade)
    setErros(e)
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus()
      return
    }
    if (etapa < 3) setEtapa(etapa + 1)
    else enviar()
  }

  const enviar = async () => {
    setEnviando(true)
    setErroApi('')
    try {
      const resultado = await salvarEnvio(montarPayload(true))
      gravar(CHAVE_RASCUNHO, null)
      setEnvioConcluido(resultado)
    } catch (causa) {
      const primeiroDetalhe = Array.isArray(causa?.detalhes)
        ? causa.detalhes.find((item) => item?.message)?.message
        : ''
      setErroApi(primeiroDetalhe || causa?.message || 'Não foi possível enviar os dados para a Prefeitura.')
    } finally {
      setEnviando(false)
    }
  }

  const salvarRascunho = async () => {
    setSalvandoRascunho(true)
    setErroApi('')
    try {
      await salvarEnvio(montarPayload(false))
      gravar(CHAVE_RASCUNHO, null)
      avisar('Rascunho salvo', { texto: 'Seus números foram salvos com segurança na sua conta.' })
    } catch (causa) {
      // Keeps a local copy so the merchant never loses progress if offline
      gravar(CHAVE_RASCUNHO, dados)
      avisar('Rascunho salvo neste aparelho', {
        texto: causa?.message || 'Não foi possível salvar no servidor agora, mas guardamos localmente.',
        tipo: 'alerta',
      })
    } finally {
      setSalvandoRascunho(false)
    }
  }

  if (envioConcluido) {
    const ocupacaoFinal = envioConcluido.ocupacao ?? ocupacao
    return (
      <div className="surgir">
        <TopoPainel sobretitulo="Área do comerciante" titulo="Enviar dados" />
        <section className="concluido">
          <div className="concluido__arte" aria-hidden="true">
            <img src="ilustracoes/comerciante.svg" alt="" />
            <Adesivo tipo="explosao" cor="var(--amarelo)" tamanho={90} style={{ left: 20, top: 20 }} />
          </div>
          <div className="concluido__texto">
            <span className="ot-selo ot-selo--publicado"><Icone nome="check-circulo" /> Envio recebido</span>
            <h2 className="titulo-1" ref={tituloRef} tabIndex={-1}>Obrigado! {nomeMes.replace(/^./, (l) => l.toUpperCase())} foi enviado.</h2>
            <p className="corpo-l suave">
              A equipe da SMCELT confere os números em até 3 dias úteis. Se algo estiver fora do esperado, a gente avisa por e-mail e você corrige por aqui.
            </p>
            <dl className="concluido__resumo">
              <div><dt>Ocupação</dt><dd className="ot-num">{ocupacaoFinal == null ? '—' : `${ocupacaoFinal}%`}</dd></div>
              <div><dt>Hóspedes</dt><dd className="ot-num">{numero(envioConcluido.hospedes ?? n(dados.hospedes))}</dd></div>
              <div><dt>Diárias</dt><dd className="ot-num">{numero(envioConcluido.diarias ?? n(dados.diarias))}</dd></div>
            </dl>
            <div className="linha-acoes">
              <Link to="/comerciante" className="ot-btn ot-btn--primario">Voltar ao início</Link>
              <Link to="/comerciante/historico" className="ot-btn ot-btn--secundario">Ver meu histórico</Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="surgir">
      <TopoPainel sobretitulo="Área do comerciante" titulo="Enviar dados do mês" />

      {vinculoPendente && (
        <Aviso tipo="alerta" style={{ marginBottom: 20 }} titulo="Vínculo em confirmação pela SMCELT">
          Você já pode preencher seus dados, mas o envio oficial será liberado assim que a SMCELT confirmar o vínculo com o estabelecimento.
        </Aviso>
      )}

      <div className="painel__grade">
        <section className="ot-cartao formulario">
          <ol className="ot-passos" aria-label="Etapas do envio">
            {ETAPAS.map((rotulo, i) => (
              <li key={rotulo} data-estado={i < etapa ? 'feito' : i === etapa ? 'atual' : undefined} aria-current={i === etapa ? 'step' : undefined}>
                <span>{i + 1}. {rotulo}</span>
              </li>
            ))}
          </ol>
          <p className="passos-movel">Etapa {etapa + 1} de {ETAPAS.length} · <strong>{ETAPAS[etapa]}</strong></p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              avancar()
            }}
            noValidate
          >
            {etapa === 0 && (
              <div className="etapa">
                <h2 className="titulo-2" ref={tituloRef} tabIndex={-1}>De qual mês são os dados?</h2>
                <p className="corpo suave">Normalmente é o mês que acabou de passar.</p>
                <fieldset className="escolha-mes">
                  <legend className="sr-only">Mês de referência</legend>
                  {periodos.map((p) => {
                    const marcado = p.ano === dados.ano && p.mes === dados.mes
                    return (
                      <label key={`${p.ano}-${p.mes}`} className="escolha-mes__opcao" data-marcado={marcado}>
                        <input type="radio" name="periodo" checked={marcado} onChange={() => setDados((d) => ({ ...d, ano: p.ano, mes: p.mes }))} />
                        <span className="escolha-mes__mes">{MESES_LONGOS[p.mes - 1]}</span>
                        <span className="corpo-s suave">{p.ano}</span>
                      </label>
                    )
                  })}
                </fieldset>
                {(envioEmEdicao?.situacao === 'recusado' || doLink) && (
                  <Aviso tipo="alerta" titulo="Corrigindo um envio devolvido">
                    {envioEmEdicao?.motivo || 'Confira os números solicitados pela SMCELT nas próximas etapas.'}
                  </Aviso>
                )}
                <div className="ot-aviso">
                  <Icone nome="info" />
                  <div>
                    <strong>Tenha à mão</strong>
                    O livro de hóspedes ou o relatório do seu sistema de reservas de {mesAnoLongo(dados.ano, dados.mes)}.
                  </div>
                </div>
              </div>
            )}

            {etapa === 1 && (
              <div className="etapa">
                <h2 className="titulo-2" ref={tituloRef} tabIndex={-1}>Como foi a ocupação em {nomeMes}?</h2>
                <p className="corpo suave">Use os números do seu sistema de reservas ou do livro de hóspedes.</p>
                <div className="form-grade">
                  <CampoNumero id="quartos" rotulo="Quartos disponíveis" extra="(unidades habitacionais)" ajuda="Quantos quartos estavam disponíveis para venda." valor={dados.quartos} aoMudar={mudar('quartos')} erro={erros.quartos} />
                  <CampoNumero id="leitos" rotulo="Leitos" ajuda="Soma de camas de solteiro; casal conta como 2." valor={dados.leitos} aoMudar={mudar('leitos')} erro={erros.leitos} />
                  <CampoNumero id="diarias" rotulo="Diárias vendidas no mês" ajuda="Cada quarto ocupado por uma noite = 1 diária." valor={dados.diarias} aoMudar={mudar('diarias')} erro={erros.diarias} placeholder="Ex.: 342" />
                  <CampoNumero id="funcionarios" rotulo="Funcionários no mês" ajuda="Contando você, se trabalha no negócio." valor={dados.funcionarios} aoMudar={mudar('funcionarios')} erro={erros.funcionarios} placeholder="Ex.: 6" />
                </div>
                <div className="calculo" aria-live="polite">
                  <Icone nome="ocupacao" />
                  {ocupacao == null ? (
                    <p>Preencha quartos e diárias para ver sua <strong>taxa de ocupação</strong> calculada aqui.</p>
                  ) : (
                    <p>
                      <strong>Sua ocupação em {nomeMes}: {ocupacao}%</strong>
                      <br />
                      <span className="suave">Calculada automaticamente: {numero(n(dados.diarias))} diárias ÷ ({dados.quartos} quartos × {dias} dias).</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {etapa === 2 && (
              <div className="etapa">
                <h2 className="titulo-2" ref={tituloRef} tabIndex={-1}>Quem se hospedou com você?</h2>
                <p className="corpo suave">Uma estimativa já ajuda bastante. Não pedimos nome de ninguém.</p>
                <div className="form-grade">
                  <CampoNumero id="hospedes" rotulo="Hóspedes no mês" ajuda="Pessoas diferentes que fizeram check-in." valor={dados.hospedes} aoMudar={mudar('hospedes')} erro={erros.hospedes} placeholder="Ex.: 480" />
                  <Campo id="motivo" rotulo="Motivo mais comum da viagem" erro={erros.motivo}>
                    <select id="motivo" className="ot-selecao" value={dados.motivo} onChange={(e) => mudar('motivo')(e.target.value)} aria-invalid={!!erros.motivo}>
                      <option value="">Escolha uma opção</option>
                      {MOTIVOS_VIAGEM.map((m) => <option key={m.codigo} value={m.rotulo}>{m.rotulo}</option>)}
                    </select>
                  </Campo>
                  <Campo id="origem" rotulo="De onde veio a maioria" erro={erros.origem}>
                    <select id="origem" className="ot-selecao" value={dados.origem} onChange={(e) => mudar('origem')(e.target.value)} aria-invalid={!!erros.origem}>
                      <option value="">Escolha uma opção</option>
                      {ORIGENS_HOSPEDES.map((m) => <option key={m.codigo} value={m.rotulo}>{m.rotulo}</option>)}
                    </select>
                  </Campo>
                  <Campo id="observacoes" rotulo="Algo fora do comum?" extra="(opcional)" ajuda="Reforma, evento na cidade, quartos fechados…">
                    <input id="observacoes" className="ot-entrada" value={dados.observacoes} onChange={(e) => mudar('observacoes')(e.target.value)} />
                  </Campo>
                </div>
              </div>
            )}

            {etapa === 3 && (
              <div className="etapa">
                <h2 className="titulo-2" ref={tituloRef} tabIndex={-1}>Confira antes de enviar</h2>
                <p className="corpo suave">Depois de enviado, só dá para alterar se a Prefeitura devolver.</p>
                <div className="revisao">
                  <div className="revisao__bloco">
                    <div className="revisao__cab">
                      <h3>Período</h3>
                      <button type="button" className="link-botao" onClick={() => setEtapa(0)}>Alterar</button>
                    </div>
                    <p>{mesAnoLongo(dados.ano, dados.mes).replace(/^./, (l) => l.toUpperCase())}</p>
                  </div>
                  <div className="revisao__bloco">
                    <div className="revisao__cab">
                      <h3>Ocupação</h3>
                      <button type="button" className="link-botao" onClick={() => setEtapa(1)}>Alterar</button>
                    </div>
                    <dl>
                      <div><dt>Quartos</dt><dd>{dados.quartos}</dd></div>
                      <div><dt>Leitos</dt><dd>{dados.leitos}</dd></div>
                      <div><dt>Diárias vendidas</dt><dd>{numero(n(dados.diarias))}</dd></div>
                      <div><dt>Funcionários</dt><dd>{dados.funcionarios}</dd></div>
                      <div><dt>Taxa de ocupação</dt><dd><strong>{ocupacao}%</strong></dd></div>
                    </dl>
                  </div>
                  <div className="revisao__bloco">
                    <div className="revisao__cab">
                      <h3>Hóspedes</h3>
                      <button type="button" className="link-botao" onClick={() => setEtapa(2)}>Alterar</button>
                    </div>
                    <dl>
                      <div><dt>Hóspedes</dt><dd>{numero(n(dados.hospedes))}</dd></div>
                      <div><dt>Motivo mais comum</dt><dd>{dados.motivo}</dd></div>
                      <div><dt>Origem da maioria</dt><dd>{dados.origem}</dd></div>
                      {dados.observacoes && <div><dt>Observações</dt><dd>{dados.observacoes}</dd></div>}
                    </dl>
                  </div>
                </div>
                <label className="ot-check" style={{ alignItems: 'flex-start', marginTop: 8 }}>
                  <input
                    id="confirmo"
                    type="checkbox"
                    checked={dados.confirmo}
                    onChange={(e) => mudar('confirmo')(e.target.checked)}
                    style={{ marginTop: 2 }}
                    aria-invalid={!!erros.confirmo}
                  />
                  <span>Confirmo que os números são do meu estabelecimento e estão corretos.</span>
                </label>
                {erros.confirmo && <span className="ot-ajuda ot-ajuda--erro"><Icone nome="alerta" tamanho="s" /> {erros.confirmo}</span>}
                {erroApi && (
                  <Aviso tipo="erro" titulo="Não foi possível enviar">
                    {erroApi}
                  </Aviso>
                )}
              </div>
            )}

            <div className="formulario__acoes">
              {etapa > 0 ? (
                <button type="button" className="ot-btn ot-btn--secundario" disabled={enviando} onClick={() => { setErros({}); setErroApi(''); setEtapa(etapa - 1) }}>
                  <Icone nome="seta-esq" /> Voltar
                </button>
              ) : (
                <span />
              )}
              <div className="formulario__acoes-dir">
                <button
                  type="button"
                  className="ot-btn ot-btn--fantasma"
                  disabled={enviando || salvandoRascunho}
                  aria-busy={salvandoRascunho}
                  onClick={salvarRascunho}
                >
                  {salvandoRascunho ? 'Salvando…' : 'Salvar rascunho'}
                </button>
                <button
                  type="submit"
                  className="ot-btn ot-btn--primario"
                  disabled={enviando || salvandoRascunho}
                  aria-busy={enviando}
                >
                  {enviando ? (
                    <>
                      <span className="girando" aria-hidden="true" /> Enviando…
                    </>
                  ) : etapa === 3 ? (
                    <>Enviar para a Prefeitura <Icone nome="check" /></>
                  ) : (
                    <>Continuar <Icone nome="seta" /></>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="pilha" style={{ gap: 20 }}>
          <section className="ot-cartao dica">
            <span className="dica__icone ot-bolha"><Icone nome="pergunta" /></span>
            <h2 className="titulo-3">Onde acho esses números?</h2>
            <ul className="dica__lista">
              <li><strong>Diárias:</strong> no relatório mensal do sistema de reservas, ou somando as noites do livro de hóspedes.</li>
              <li><strong>Hóspedes:</strong> número de fichas de check-in (FNRH) do mês.</li>
              <li><strong>Funcionários:</strong> fixos e temporários que trabalharam no mês.</li>
            </ul>
          </section>
          <section className="ot-cartao dica dica--rosa">
            <h2 className="titulo-3">Seus dados estão protegidos</h2>
            <p className="corpo-s">
              Só a equipe da SMCELT vê os números do seu negócio. No site, eles aparecem somados aos de outros estabelecimentos.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
