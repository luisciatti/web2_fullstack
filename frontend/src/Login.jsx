import { useState } from 'react'
import { authRequest, saveAuth } from './api.js'

export default function Login({ onLoggedIn }) {
    const [modo, setModo] = useState('login')
    const [form, setForm] = useState({ nome: '', email: '', senha: '' })
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        setErro('')
        setLoading(true)

        try {
            const payload = { email: form.email, senha: form.senha }
            if (modo === 'cadastro') payload.nome = form.nome
            const path = modo === 'cadastro' ? '/api/auth/register' : '/api/auth/login'
            const data = await authRequest(path, payload)
            saveAuth(data)
            onLoggedIn()
        } catch (err) {
            setErro(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="shell">
            <div className="card small">
                <h1>Web2</h1>
                <div className="segmented">
                    <button className={modo === 'login' ? 'active' : ''} type="button" onClick={() => setModo('login')}>Entrar</button>
                    <button className={modo === 'cadastro' ? 'active' : ''} type="button" onClick={() => setModo('cadastro')}>Cadastrar</button>
                </div>
                <form onSubmit={submit}>
                    {modo === 'cadastro' && (
                        <label>
                            Nome
                            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required minLength={2} maxLength={80} />
                        </label>
                    )}
                    <label>
                        E-mail
                        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
                    </label>
                    <label>
                        Senha
                        <input value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} type="password" required minLength={8} maxLength={72} />
                    </label>
                    {erro && <div className="error">{erro}</div>}
                    <button disabled={loading} type="submit">{loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar'}</button>
                </form>
            </div>
        </div>
    )
}
