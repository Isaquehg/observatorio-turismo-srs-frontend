import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Aviso, Sobretitulo } from '../componentes/Basicos'
import { PERFIS, useSessao } from '../contexto/Sessao'
import { useAvisos } from '../contexto/Avisos'
import { useTitulo } from '../util/ganchos'
import './entrar.css'

// Textos de ajuda do modo "Criar conta"
const DICA_CADASTRO = {
  turista: 'Use um e-mail que você consulta com frequência. Ele será o seu acesso.',
  comerciante: 'Informe o CNPJ do estabelecimento e o nome de quem responde por ele.',
  prefeitura: 'O acesso é liberado pela SMCELT depois de conferir o e-mail institucional.',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function mascaraCnpj(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function validar(perfil, usuario, senha, cadastro) {
  const erros = {}
  if (cadastro) {
    if (cadastro.nome.trim().length < 3) erros.nome = 'Digite seu nome completo.'
    if (senha && senha !== cadastro.confirmar) erros.confirmar = 'As senhas não são iguais.'
  }
  const u = usuario.trim()
  if (!u) {
    erros.usuario = PERFIS[perfil].vazio
  } else if (perfil === 'comerciante') {
    if (!/^[\d./-]+$/.test(u)) erros.usuario = 'Digite só os números do CNPJ, como 12.345.678/0001-90.'
    else if (u.replace(/\D/g, '').length !== 14) erros.usuario = 'O CNPJ tem 14 números. Confira se faltou algum.'
  } else if (!EMAIL.test(u)) {
    erros.usuario = 'Esse e-mail não parece completo. Confira se tem @ e o domínio.'
  } else if (perfil === 'prefeitura' && !u.toLowerCase().endsWith('@pmsrs.mg.gov.br')) {
    erros.usuario = 'Use seu e-mail institucional, terminado em @pmsrs.mg.gov.br.'
  }
  if (!senha) erros.senha = 'Digite sua senha.'
  else if (senha.length < 6) erros.senha = 'A senha tem pelo menos 6 caracteres.'
  return erros
}

export default function Entrar() {
  useTitulo('Entrar')
  const [params, setParams] = useSearchParams()
  const local = useLocation()
  const navegar = useNavigate()
  const { entrar } = useSessao()
  const { avisar } = useAvisos()

  const inicial = PERFIS[params.get('perfil')] ? params.get('perfil') : 'comerciante'
  const [perfil, setPerfil] = useState(inicial)
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [manter, setManter] = useState(true)
  const [criar, setCriar] = useState(params.get('modo') === 'criar')
  const [nome, setNome] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const usuarioRef = useRef(null)
  const senhaRef = useRef(null)
  const nomeRef = useRef(null)
  const p = PERFIS[perfil]

  useEffect(() => {
    setErros({})
  }, [perfil, criar])

  const escolher = (id) => {
    setPerfil(id)
    setUsuario('')
    setParams(criar ? { perfil: id, modo: 'criar' } : { perfil: id }, { replace: true, state: local.state })
  }

  // Setas do teclado entre os perfis, como num grupo de rádio
  const aoTeclarPerfis = (e) => {
    const ids = Object.keys(PERFIS)
    const i = ids.indexOf(perfil)
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!passo) return
    e.preventDefault()
    const proximo = ids[(i + passo + ids.length) % ids.length]
    escolher(proximo)
    e.currentTarget.querySelector(`[data-perfil="${proximo}"]`)?.focus()
  }

  const alternarModo = () => {
    const proximo = !criar
    setCriar(proximo)
    setSenha('')
    setConfirmar('')
    setParams(proximo ? { perfil, modo: 'criar' } : { perfil }, { replace: true, state: local.state })
  }

  const enviar = (e) => {
    e.preventDefault()
    const encontrados = validar(perfil, usuario, senha, criar && { nome, confirmar })
    setErros(encontrados)
    if (encontrados.nome) return nomeRef.current?.focus()
    if (encontrados.usuario) return usuarioRef.current?.focus()
    if (encontrados.senha) return senhaRef.current?.focus()
    if (encontrados.confirmar) return document.getElementById('confirmar')?.focus()

    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      // Prefeitura: o acesso é liberado pela SMCELT, então o cadastro vira um pedido
      if (criar && perfil === 'prefeitura') {
        avisar('Pedido enviado', { texto: 'A SMCELT confere o seu e-mail institucional e libera o acesso. Você recebe a resposta por e-mail.', duracao: 8000 })
        alternarModo()
        return
      }
      const sessao = entrar(perfil, usuario.trim(), manter, criar ? nome.trim() : undefined)
      avisar(criar ? `Conta criada, ${sessao.nome.split(' ')[0]}!` : `Olá, ${sessao.nome.split(' ')[0]}!`, {
        texto: perfil === 'turista' ? 'Separamos dicas de onde ficar, comer e passear.' : 'Você entrou na sua área.',
      })
      navegar(local.state?.voltarPara || p.inicio, { replace: true })
    }, 650)
  }

  return (
    <div className="entrar">
      <section className="entrar__arte ot-gradiente">
        <Link to="/" className="entrar__logo" aria-label="Voltar para o início do site">
          <img src="logos/observatorio-branco.png" alt="" />
        </Link>
        <div className="entrar__boas-vindas">
          <Sobretitulo>Plataforma de dados abertos</Sobretitulo>
          <h1 className="display-l" style={{ marginTop: 16 }}>
            Boas-vindas ao <span className="ot-marca ot-marca--bloco">Observatório</span> do Turismo
          </h1>
          <p className="corpo-l entrar__abertura">
            Os números do turismo de Santa Rita do Sapucaí, num lugar só — para quem visita, empreende ou cuida da cidade.
          </p>
        </div>
        <img className="entrar__cidade" src="ilustracoes/cidade.svg" alt="" />
        <Adesivo tipo="explosao" cor="var(--amarelo)" tamanho={96} className="entrar__explosao" />
      </section>

      <section className="entrar__form surgir">
        <Link className="ot-btn ot-btn--fantasma ot-btn--p entrar__voltar" to="/">
          <Icone nome="seta-esq" tamanho="s" /> Voltar para o site
        </Link>
        <div>
          <h2 className="titulo-1">{criar ? 'Criar sua conta' : 'Como você quer entrar?'}</h2>
          <p className="corpo suave" style={{ marginTop: 8 }}>Escolha seu perfil. Cada um vê o que precisa.</p>
        </div>

        {local.state?.restrita && (
          <Aviso tipo="alerta" icone="cadeado" titulo="Essa página pede login">
            Entre com o perfil indicado para continuar de onde parou.
          </Aviso>
        )}

        <div className="entrar__perfis" role="radiogroup" aria-label="Perfil de acesso" onKeyDown={aoTeclarPerfis}>
          {Object.values(PERFIS).map((item) => (
            <button
              key={item.id}
              type="button"
              className="ot-perfil"
              role="radio"
              data-perfil={item.id}
              aria-checked={perfil === item.id}
              tabIndex={perfil === item.id ? 0 : -1}
              style={{ '--cor': item.cor }}
              onClick={() => escolher(item.id)}
            >
              <span className="ot-perfil__arte"><img src={item.arte} alt="" /></span>
              <span className="ot-perfil__marca">{perfil === item.id && <Icone nome="check" tamanho="s" />}</span>
              <span className="ot-perfil__corpo">
                <span className="ot-perfil__titulo">{item.titulo}</span>
                <span className="ot-perfil__texto">{item.texto}</span>
              </span>
            </button>
          ))}
        </div>

        <form className="entrar__campos" onSubmit={enviar} noValidate>
          <div className="ot-aviso" style={{ background: p.cor }}>
            <Icone nome={p.icone} />
            <div>
              <strong>{criar ? 'Cadastro' : 'Entrando'} como {p.titulo.toLowerCase()}</strong>
              {criar ? DICA_CADASTRO[perfil] : p.dica}
            </div>
          </div>

          {criar && (
            <div className="ot-campo">
              <label className="ot-rotulo" htmlFor="nome">{perfil === 'comerciante' ? 'Nome do responsável' : 'Nome completo'}</label>
              <input ref={nomeRef} className="ot-entrada" id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" aria-invalid={!!erros.nome} aria-describedby={erros.nome ? 'nome-erro' : undefined} />
              {erros.nome && <span className="ot-ajuda ot-ajuda--erro" id="nome-erro"><Icone nome="alerta" tamanho="s" /> {erros.nome}</span>}
            </div>
          )}

          <div className="ot-campo">
            <label className="ot-rotulo" htmlFor="usuario">{p.campo}</label>
            <input
              ref={usuarioRef}
              className="ot-entrada"
              id="usuario"
              name="usuario"
              value={usuario}
              onChange={(e) => {
                const v = e.target.value
                setUsuario(perfil === 'comerciante' ? mascaraCnpj(v) : v)
              }}
              inputMode={perfil === 'comerciante' ? 'numeric' : 'email'}
              autoComplete={perfil === 'comerciante' ? 'username' : 'email'}
              placeholder={{ turista: 'voce@email.com', comerciante: '00.000.000/0000-00', prefeitura: 'nome@pmsrs.mg.gov.br' }[perfil]}
              aria-invalid={!!erros.usuario}
              aria-describedby={erros.usuario ? 'usuario-erro' : undefined}
            />
            {erros.usuario && (
              <span className="ot-ajuda ot-ajuda--erro" id="usuario-erro"><Icone nome="alerta" tamanho="s" /> {erros.usuario}</span>
            )}
          </div>

          <div className="ot-campo">
            <div className="entrar__senha-cab">
              <label className="ot-rotulo" htmlFor="senha">Senha</label>
              {!criar && <button type="button" className="link-botao" onClick={() => avisar('Enviamos as instruções', { texto: 'Se o cadastro existir, um link para criar nova senha chega no seu e-mail em alguns minutos.', tipo: 'info', duracao: 7000 })}>
                Esqueci minha senha
              </button>}
            </div>
            <div className="ot-entrada-icone">
              <Icone nome="cadeado" />
              <input
                ref={senhaRef}
                className="ot-entrada"
                id="senha"
                name="senha"
                type={verSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={criar ? 'new-password' : 'current-password'}
                aria-invalid={!!erros.senha}
                aria-describedby={erros.senha ? 'senha-erro' : 'senha-ajuda'}
                style={{ paddingRight: 92 }}
              />
              <button type="button" className="ot-entrada-icone__acao" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha}>
                {verSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {erros.senha ? (
              <span className="ot-ajuda ot-ajuda--erro" id="senha-erro"><Icone nome="alerta" tamanho="s" /> {erros.senha}</span>
            ) : (
              <span className="ot-ajuda" id="senha-ajuda">Protótipo: qualquer senha com 6 caracteres ou mais funciona.</span>
            )}
          </div>

          {criar && (
            <div className="ot-campo">
              <label className="ot-rotulo" htmlFor="confirmar">Confirmar senha</label>
              <input className="ot-entrada" id="confirmar" name="confirmar" type={verSenha ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" aria-invalid={!!erros.confirmar} aria-describedby={erros.confirmar ? 'confirmar-erro' : undefined} />
              {erros.confirmar && <span className="ot-ajuda ot-ajuda--erro" id="confirmar-erro"><Icone nome="alerta" tamanho="s" /> {erros.confirmar}</span>}
            </div>
          )}

          <label className="ot-check">
            <input type="checkbox" checked={manter} onChange={(e) => setManter(e.target.checked)} /> Manter conectado neste aparelho
          </label>

          <button className="ot-btn ot-btn--primario ot-btn--g ot-btn--largo" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? (
              <>
                <span className="girando" aria-hidden="true" /> {criar ? 'Criando…' : 'Entrando…'}
              </>
            ) : (
              <>
                {criar ? (perfil === 'prefeitura' ? 'Pedir acesso' : 'Criar conta') : 'Entrar'} <Icone nome="seta" />
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '1.0625rem' }}>
            {criar ? 'Já tem conta?' : 'Primeiro acesso?'}{' '}
            <button type="button" className="link-botao" style={{ fontWeight: 700 }} onClick={alternarModo}>
              {criar ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </form>

        {Object.keys(erros).length > 0 && (
          <Aviso tipo="erro" titulo="Faltou pouco">Confira os campos marcados acima.</Aviso>
        )}

        <div className="entrar__publico">
          <span className="ot-indicador__icone" style={{ '--cor': 'var(--amarelo)' }}><Icone nome="olho" /></span>
          <p>
            <strong>Só quer ver os dados?</strong>
            <br />
            <span className="suave">Os indicadores públicos estão abertos. Não precisa de conta.</span>
          </p>
          <Link className="ot-btn ot-btn--secundario ot-btn--p" to="/indicadores-publicos">Acessar sem login</Link>
        </div>
      </section>
    </div>
  )
}
