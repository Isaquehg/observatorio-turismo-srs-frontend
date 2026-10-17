import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Icone from '../componentes/Icone'
import { Adesivo } from '../componentes/Adesivo'
import { Aviso, Sobretitulo } from '../componentes/Basicos'
import { PERFIS, useSessao } from '../contexto/Sessao'
import { useAvisos } from '../contexto/Avisos'
import { useTitulo } from '../util/ganchos'
import './entrar.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function mascaraCnpj(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function validar(perfil, usuario, senha) {
  const erros = {}
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
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const usuarioRef = useRef(null)
  const senhaRef = useRef(null)
  const p = PERFIS[perfil]

  useEffect(() => {
    setErros({})
  }, [perfil])

  const escolher = (id) => {
    setPerfil(id)
    setUsuario('')
    setParams({ perfil: id }, { replace: true, state: local.state })
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

  const enviar = (e) => {
    e.preventDefault()
    const encontrados = validar(perfil, usuario, senha)
    setErros(encontrados)
    if (encontrados.usuario) return usuarioRef.current?.focus()
    if (encontrados.senha) return senhaRef.current?.focus()

    setEnviando(true)
    setTimeout(() => {
      const sessao = entrar(perfil, usuario.trim(), manter)
      avisar(`Olá, ${sessao.nome.split(' ')[0]}!`, { texto: perfil === 'turista' ? 'Separamos dicas de onde ficar, comer e passear.' : 'Você entrou na sua área.' })
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
          <h2 className="titulo-1">Como você quer entrar?</h2>
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
              <strong>Entrando como {p.titulo.toLowerCase()}</strong>
              {p.dica}
            </div>
          </div>

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
              <button type="button" className="link-botao" onClick={() => avisar('Enviamos as instruções', { texto: 'Se o cadastro existir, um link para criar nova senha chega no seu e-mail em alguns minutos.', tipo: 'info', duracao: 7000 })}>
                Esqueci minha senha
              </button>
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
                autoComplete="current-password"
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

          <label className="ot-check">
            <input type="checkbox" checked={manter} onChange={(e) => setManter(e.target.checked)} /> Manter conectado neste aparelho
          </label>

          <button className="ot-btn ot-btn--primario ot-btn--g ot-btn--largo" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? (
              <>
                <span className="girando" aria-hidden="true" /> Entrando…
              </>
            ) : (
              <>
                Entrar <Icone nome="seta" />
              </>
            )}
          </button>

          {perfil === 'comerciante' && (
            <p style={{ textAlign: 'center', fontSize: '1.0625rem' }}>
              Primeiro acesso do seu negócio? <Link to="/sobre#contato" style={{ fontWeight: 700 }}>Peça seu cadastro</Link>
            </p>
          )}
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
