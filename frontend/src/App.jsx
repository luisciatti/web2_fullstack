import { useEffect, useState } from 'react'
import Editor from './Editor.jsx'
import Login from './Login.jsx'
import Projetos from './Projetos.jsx'
import { readAuth } from './api.js'

export default function App() {
  const [tela, setTela] = useState('login')
  const [projetoId, setProjetoId] = useState('novo')

  useEffect(() => {
    const auth = readAuth()
    if (auth.accessToken) setTela('projetos')
  }, [])

  const logout = () => {
    localStorage.removeItem('web2_min_auth')
    setTela('login')
  }

  if (tela === 'login') {
    return <Login onLoggedIn={() => setTela('projetos')} />
  }

  if (tela === 'projetos') {
    return <Projetos onNew={() => { setProjetoId('novo'); setTela('editor') }} onOpen={(id) => { setProjetoId(id); setTela('editor') }} onLogout={logout} />
  }

  return <Editor projectId={projetoId} onBack={() => setTela('projetos')} onLogout={logout} onProjectSaved={(id) => { setProjetoId(id) }} />
}
