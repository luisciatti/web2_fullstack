import { useEffect, useState } from 'react'
import Editor from './Editor.jsx'
import Login from './Login.jsx'
import Projetos from './Projetos.jsx'
import Sobre from './Sobre.jsx'
import { logout as encerrarSessao, readAuth } from './api.js'

const HASH_SOBRE = '#sobre-o-projeto'

const lerHash = () => (typeof window === 'undefined' ? '' : window.location.hash)

export default function App() {
  const [tela, setTela] = useState('login')
  const [projetoId, setProjetoId] = useState('novo')
  const [hash, setHash] = useState(lerHash)
  const [modoLogin, setModoLogin] = useState('login')

  useEffect(() => {
    const auth = readAuth()
    if (auth.accessToken) setTela('projetos')
  }, [])

  useEffect(() => {
    const atualizarHash = () => setHash(lerHash())
    window.addEventListener('hashchange', atualizarHash)
    return () => window.removeEventListener('hashchange', atualizarHash)
  }, [])

  useEffect(() => {
    if (hash === HASH_SOBRE) window.scrollTo(0, 0)
  }, [hash])

  const logout = () => {
    encerrarSessao()
    setTela('login')
  }

  const sairDoSobre = (modo) => {
    setModoLogin(modo)
    window.location.hash = 'inicio'
    window.scrollTo(0, 0)
  }

  if (hash === HASH_SOBRE) {
    return (
      <Sobre
        autenticado={tela !== 'login'}
        onEntrar={() => sairDoSobre('login')}
        onComecar={() => sairDoSobre('cadastro')}
      />
    )
  }

  if (tela === 'login') {
    return <Login key={modoLogin} modoInicial={modoLogin} onLoggedIn={() => setTela('projetos')} />
  }

  if (tela === 'projetos') {
    return <Projetos onNew={() => { setProjetoId('novo'); setTela('editor') }} onOpen={(id) => { setProjetoId(id); setTela('editor') }} onLogout={logout} />
  }

  return <Editor projectId={projetoId} onBack={() => setTela('projetos')} onLogout={logout} onProjectSaved={(id) => { setProjetoId(id) }} />
}
