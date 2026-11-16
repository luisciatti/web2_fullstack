import { useState } from 'react'
import { authRequest, saveAuth } from './api.js'
import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import DiagramPreview from './components/public/DiagramPreview.jsx'
import PublicButton from './components/public/PublicButton.jsx'
import './Login.css'

export default function Login({ onLoggedIn, onLogin, onSignup }) {
    const [modo, setModo] = useState('login')
    const [form, setForm] = useState({ nome: '', email: '', senha: '' })
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)

    const trocarModo = (novoModo) => {
        setModo(novoModo)
        setErro('')

        if (novoModo === 'login') onLogin?.()
        if (novoModo === 'cadastro') onSignup?.()
    }

    const atualizarCampo = (campo) => (event) => {
        setForm((atual) => ({ ...atual, [campo]: event.target.value }))
    }

    const submit = async (event) => {
        event.preventDefault()
        if (loading) return

        setErro('')
        setLoading(true)

        try {
            const payload = { email: form.email.trim(), senha: form.senha }
            if (modo === 'cadastro') payload.nome = form.nome.trim()

            const path = modo === 'cadastro' ? '/api/auth/register' : '/api/auth/login'
            const data = await authRequest(path, payload)
            saveAuth(data)
            onLoggedIn?.()
        } catch (err) {
            setErro(err?.message || 'Não foi possível acessar sua conta. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const cadastro = modo === 'cadastro'

    return (
        <div className="public-auth" id="inicio">
            <header className="public-header">
                <div className="public-header__inner">
                    <a
                        className="public-header__brand"
                        href="#inicio"
                        aria-label="DiagramCode — início"
                        onClick={() => trocarModo('login')}
                    >
                        <DiagramCodeLogo />
                    </a>

                    <nav className="public-nav" aria-label="Navegação principal">
                        <a
                            href="#inicio"
                            className="public-nav__home"
                            onClick={() => trocarModo('login')}
                        >
                            Início
                        </a>
                        <a href="#sobre-o-projeto" className="public-nav__about">
                            Sobre o projeto
                        </a>
                        <PublicButton
                            className="public-nav__signup"
                            variant="outline"
                            onClick={() => trocarModo('cadastro')}
                        >
                            Criar conta
                        </PublicButton>
                    </nav>
                </div>
            </header>

            <main className="public-main">
                <section className="public-hero-panel" id="sobre-o-projeto" aria-labelledby="public-hero-title">
                    <div className="public-hero-copy">
                        <span className="public-eyebrow">Editor de diagramas</span>
                        <h1 id="public-hero-title">Transforme suas ideias em diagramas.</h1>
                        <p>
                            Acesse seus projetos, organize classes e métodos e continue
                            modelando seus sistemas em UML.
                        </p>
                    </div>

                    <DiagramPreview />
                    <p className="public-hero-caption">
                        Salve seus projetos para criar, visualizar e evoluir suas ideias.
                    </p>
                </section>

                <section className="public-login-panel" aria-labelledby="public-login-title">
                    <div className="public-login-heading">
                        <span className="public-eyebrow public-login-heading__eyebrow">
                            Bem-vindo de volta
                        </span>
                        <h2 id="public-login-title">
                            {cadastro ? 'Crie sua conta' : 'Entre na sua conta'}
                        </h2>
                        <p>
                            {cadastro
                                ? 'Cadastre-se no DiagramCode e comece a organizar seus projetos.'
                                : 'Acesse o DiagramCode e continue seus projetos.'}
                        </p>
                    </div>

                    <div className="public-login-form-card">
                        <form className="public-login-form" onSubmit={submit}>
                            {cadastro && (
                                <label className="public-field" htmlFor="public-name">
                                    Nome
                                    <span className="public-input-wrap">
                                        <svg viewBox="0 0 20 20" aria-hidden="true">
                                            <circle cx="10" cy="6" r="3" />
                                            <path d="M4 17c.5-3 2.5-4.5 6-4.5s5.5 1.5 6 4.5" />
                                        </svg>
                                        <input
                                            id="public-name"
                                            name="nome"
                                            type="text"
                                            value={form.nome}
                                            onChange={atualizarCampo('nome')}
                                            placeholder="Seu nome"
                                            autoComplete="name"
                                            required
                                            minLength={2}
                                            maxLength={80}
                                        />
                                    </span>
                                </label>
                            )}

                            <label className="public-field" htmlFor="public-email">
                                E-mail
                                <span className="public-input-wrap">
                                    <svg viewBox="0 0 20 20" aria-hidden="true">
                                        <rect x="2.5" y="4" width="15" height="12" rx="2" />
                                        <path d="m3.5 5 6.5 5 6.5-5" />
                                    </svg>
                                    <input
                                        id="public-email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={atualizarCampo('email')}
                                        placeholder="seuemail@exemplo.com"
                                        autoComplete="email"
                                        required
                                    />
                                </span>
                            </label>

                            <label className="public-field public-password-field" htmlFor="public-password">
                                Senha
                                <span className="public-input-wrap">
                                    <svg viewBox="0 0 20 20" aria-hidden="true">
                                        <rect x="3.5" y="8.5" width="13" height="9" rx="2" />
                                        <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
                                    </svg>
                                    <input
                                        id="public-password"
                                        name="senha"
                                        type={mostrarSenha ? 'text' : 'password'}
                                        value={form.senha}
                                        onChange={atualizarCampo('senha')}
                                        placeholder="Digite sua senha"
                                        autoComplete={cadastro ? 'new-password' : 'current-password'}
                                        required
                                        minLength={8}
                                        maxLength={72}
                                    />
                                    <button
                                        className="public-password-toggle"
                                        type="button"
                                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                        aria-pressed={mostrarSenha}
                                        onClick={() => setMostrarSenha((atual) => !atual)}
                                    >
                                        {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </span>
                            </label>

                            {erro && <div className="public-error" role="alert">{erro}</div>}

                            <PublicButton className="public-submit" type="submit" disabled={loading}>
                                {loading
                                    ? 'Aguarde...'
                                    : cadastro
                                        ? 'Criar conta'
                                        : 'Entrar'}
                            </PublicButton>
                        </form>

                        <div className="public-register-prompt">
                            <span>{cadastro ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}</span>
                            <button
                                className="public-text-button"
                                type="button"
                                onClick={() => trocarModo(cadastro ? 'login' : 'cadastro')}
                            >
                                {cadastro ? 'Entrar' : 'Criar conta'}
                            </button>
                        </div>
                    </div>

                    <div className="public-login-note">
                        <span aria-hidden="true">✦</span>
                        <span>Seus projetos ficam associados à sua conta.</span>
                    </div>
                </section>
            </main>

            <footer className="public-footer">
                <span>DiagramCode</span>
                <span>Modelagem visual de software</span>
            </footer>
        </div>
    )
}
