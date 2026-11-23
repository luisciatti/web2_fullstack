import { useEffect, useState } from 'react'
import Editor from './Editor.jsx'
import Login from './Login.jsx'
import Projetos from './Projetos.jsx'
import Sobre from './Sobre.jsx'
import AdminUsuarios from './AdminUsuarios.jsx'
import { logout as encerrarSessao, readAuth } from './api.js'

// Rotas por hash:
//   #inicio   → página inicial pública (sobre o projeto) — padrão
//   #acesso   → login / criar conta
//   #projetos → área logada (Meus projetos e Editor)
export const ROTAS = {
  inicio: '#inicio',
  acesso: '#acesso',
  projetos: '#projetos',
  usuarios: '#usuarios',
}

export function rotaDoHash(hash) {
  if (hash === ROTAS.acesso) return 'acesso'
  if (hash === ROTAS.projetos) return 'projetos'
  if (hash === ROTAS.usuarios || /^#usuarios\/[^/]+$/.test(hash)) return 'usuarios'
  return 'inicio'
}

const lerHash = () => (typeof window === 'undefined' ? '' : window.location.hash)

const estaAutenticado = () => {
  if (typeof window === 'undefined') return false
  return Boolean(readAuth().accessToken)
}

function ehAdministrador(accessToken) {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { roles } = JSON.parse(atob(payload))
    return Array.isArray(roles) && roles.includes('ROLE_ADMIN')
  } catch {
    return false
  }
}

function lerUsuarioId(hash) {
  try {
    return decodeURIComponent(hash.slice(ROTAS.usuarios.length + 1))
  } catch {
    return ''
  }
}

function navegar(hash, { substituir = false } = {}) {
  if (window.location.hash === hash) return
  if (substituir) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}

export default function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado)
  const [tela, setTela] = useState('projetos')
  const [projetoId, setProjetoId] = useState('novo')
  const [hash, setHash] = useState(lerHash)
  const [modoLogin, setModoLogin] = useState('login')

  const rota = rotaDoHash(hash)
  const administrador = autenticado && ehAdministrador(readAuth().accessToken)

  useEffect(() => {
    const atualizarHash = () => setHash(lerHash())
    window.addEventListener('hashchange', atualizarHash)
    return () => window.removeEventListener('hashchange', atualizarHash)
  }, [])

  // Normaliza o endereço e protege as rotas.
  useEffect(() => {
    if (rota === 'inicio' && hash !== ROTAS.inicio) navegar(ROTAS.inicio, { substituir: true })
    else if (rota === 'acesso' && autenticado) navegar(ROTAS.projetos, { substituir: true })
    else if (rota === 'projetos' && !autenticado) navegar(ROTAS.acesso, { substituir: true })
    else if (rota === 'usuarios' && !administrador) navegar(autenticado ? ROTAS.projetos : ROTAS.acesso, { substituir: true })
  }, [rota, hash, autenticado, administrador])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [rota, hash])

  const irParaAcesso = (modo) => {
    setModoLogin(modo)
    navegar(ROTAS.acesso)
  }

  const irParaProjetos = () => {
    setTela('projetos')
    navegar(ROTAS.projetos)
  }

  const entrou = () => {
    setAutenticado(true)
    setTela('projetos')
    navegar(ROTAS.projetos)
  }

  const logout = () => {
    encerrarSessao()
    setAutenticado(false)
    setTela('projetos')
    setModoLogin('login')
    navegar(ROTAS.acesso)
  }

  if (rota === 'inicio') {
    return (
      <Sobre
        autenticado={autenticado}
        onEntrar={() => (autenticado ? irParaProjetos() : irParaAcesso('login'))}
        onComecar={() => (autenticado ? irParaProjetos() : irParaAcesso('cadastro'))}
      />
    )
  }

  if (rota === 'acesso') {
    if (autenticado) return null
    return <Login key={modoLogin} modoInicial={modoLogin} onLoggedIn={entrou} />
  }

  if (!autenticado) return null

  if (rota === 'usuarios') {
    if (!administrador) return null
    const usuarioId = lerUsuarioId(hash)
    return <AdminUsuarios key={usuarioId} usuarioId={usuarioId} onProjetos={irParaProjetos} onLogout={logout} />
  }

  if (tela === 'projetos') {
    return <Projetos administrador={administrador} onNew={() => { setProjetoId('novo'); setTela('editor') }} onOpen={(id) => { setProjetoId(id); setTela('editor') }} onLogout={logout} />
  }

  return <Editor projectId={projetoId} onBack={() => setTela('projetos')} onLogout={logout} onProjectSaved={(id) => { setProjetoId(id) }} />
}
