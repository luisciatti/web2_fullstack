import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import PublicButton from './components/public/PublicButton.jsx'
import BotaoTema from './tema/BotaoTema.jsx'
import './AdminUsuarios.css'

function Tabela({ titulo, colunas, children }) {
    return (
        <div className="admin-usuarios__rolagem" tabIndex={0} role="region" aria-label={titulo}>
            <table>
                <thead><tr>{colunas.map((coluna) => <th key={coluna} scope="col">{coluna}</th>)}</tr></thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    )
}

export default function AdminUsuarios({ usuarioId, onProjetos, onLogout }) {
    const [consulta, setConsulta] = useState({ carregando: true })
    const [tentativa, setTentativa] = useState(0)
    const { carregando, dados, erro } = consulta

    useEffect(() => {
        let atual = true
        const url = usuarioId
            ? `/api/admin/usuarios/${encodeURIComponent(usuarioId)}/projetos`
            : '/api/admin/usuarios'
        apiFetch(url)
            .then((dados) => { if (atual) setConsulta({ dados }) })
            .catch((falha) => { if (atual) setConsulta({ erro: falha.message || 'Não foi possível carregar os dados.' }) })
        return () => { atual = false }
    }, [usuarioId, tentativa])

    return (
        <main className="admin-usuarios">
            <header className="public-header">
                <div className="public-header__inner">
                    <a className="public-header__brand" href="#inicio" aria-label="DiagramCode — início"><DiagramCodeLogo /></a>
                    <nav className="public-nav" aria-label="Navegação principal">
                        <a className="public-nav__home" href="#projetos" onClick={onProjetos}>Meus projetos</a>
                        <BotaoTema />
                        <PublicButton variant="outline" onClick={onLogout}>Sair</PublicButton>
                    </nav>
                </div>
            </header>

            <section className="admin-usuarios__conteudo" aria-labelledby="admin-usuarios-titulo">
                {usuarioId && <a href="#usuarios">Voltar para usuários</a>}
                <h1 id="admin-usuarios-titulo">{usuarioId ? 'Projetos do usuário' : 'Usuários'}</h1>
                {carregando && <p role="status">Carregando {usuarioId ? 'projetos' : 'usuários'}…</p>}
                {erro && (
                    <div>
                        <p role="alert">{erro}</p>
                        <PublicButton variant="outline" onClick={() => {
                            setConsulta({ carregando: true })
                            setTentativa((atual) => atual + 1)
                        }}>Tentar novamente</PublicButton>
                    </div>
                )}
                {dados && !usuarioId && (dados.length ? (
                    <Tabela titulo="Usuários cadastrados" colunas={['ID', 'Nome', 'E-mail', 'Status', 'Projetos']}>
                        {dados.map((usuario) => (
                            <tr key={usuario.id}>
                                <td>{usuario.id}</td>
                                <th scope="row">{usuario.nome}</th>
                                <td>{usuario.email}</td>
                                <td>{usuario.ativo ? 'Ativo' : 'Inativo'}</td>
                                <td>
                                    <a href={`#usuarios/${encodeURIComponent(usuario.id)}`} aria-label={`Ver projetos de ${usuario.nome}`}>
                                        Ver projetos
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </Tabela>
                ) : <p>Nenhum usuário cadastrado.</p>)}
                {dados && usuarioId && (
                    <>
                        <h2>{dados.usuario.nome}</h2>
                        <p>{dados.usuario.email}</p>
                        {dados.projetos.length ? (
                            <Tabela titulo="Projetos cadastrados" colunas={['ID', 'Nome', 'Linguagem', 'Framework', 'Provedor Cloud']}>
                                {dados.projetos.map((projeto) => (
                                    <tr key={projeto.id}>
                                        <td>{projeto.id}</td>
                                        <th scope="row">{projeto.nome}</th>
                                        <td>{projeto.linguagem}</td>
                                        <td>{projeto.framework}</td>
                                        <td>{projeto.provedorCloud}</td>
                                    </tr>
                                ))}
                            </Tabela>
                        ) : <p>Este usuário ainda não tem projetos.</p>}
                    </>
                )}
            </section>
        </main>
    )
}
