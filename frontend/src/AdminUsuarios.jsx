import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import PublicButton from './components/public/PublicButton.jsx'
import BotaoTema from './tema/BotaoTema.jsx'
import './AdminUsuarios.css'

const compararNomes = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true }).compare
const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')

function corresponde(busca, ...campos) {
    const termo = normalizar(busca.trim())
    return campos.some((campo) => normalizar(campo).includes(termo))
}

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

function Status({ ativo }) {
    return <span className={`admin-usuarios__status${ativo ? ' admin-usuarios__status--ativo' : ''}`}>{ativo ? 'Ativo' : 'Inativo'}</span>
}

function ListaUsuarios({ usuarios }) {
    const [busca, setBusca] = useState('')
    const [status, setStatus] = useState('todos')
    const [ordem, setOrdem] = useState('az')
    const ativos = usuarios.filter(({ ativo }) => ativo).length
    const lista = usuarios.filter((usuario) =>
        (status === 'todos' || (status === 'ativos') === Boolean(usuario.ativo))
        && corresponde(busca, usuario.nome, usuario.email, usuario.id),
    ).sort((a, b) => ordem === 'az' ? compararNomes(a.nome, b.nome) : compararNomes(b.nome, a.nome))

    return (
        <>
            <dl className="admin-usuarios__resumo">
                <div><dt>Usuários cadastrados</dt><dd>{usuarios.length}</dd></div>
                <div><dt>Ativos</dt><dd>{ativos}</dd></div>
                <div><dt>Inativos</dt><dd>{usuarios.length - ativos}</dd></div>
            </dl>
            <div className="admin-usuarios__painel">
                <div className="admin-usuarios__filtros">
                    <label>Buscar usuários
                        <input type="search" placeholder="Nome, e-mail ou ID" value={busca} onChange={(event) => setBusca(event.target.value)} />
                    </label>
                    <label>Status
                        <select value={status} onChange={(event) => setStatus(event.target.value)}>
                            <option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option>
                        </select>
                    </label>
                    <label>Ordenar por nome
                        <select value={ordem} onChange={(event) => setOrdem(event.target.value)}>
                            <option value="az">A–Z</option><option value="za">Z–A</option>
                        </select>
                    </label>
                </div>
                <p className="admin-usuarios__contagem" role="status">{lista.length} de {usuarios.length} usuários</p>
                {lista.length ? (
                    <Tabela titulo="Usuários cadastrados" colunas={['Nome', 'E-mail', 'ID', 'Status', 'Projetos']}>
                        {lista.map((usuario) => (
                            <tr key={usuario.id}>
                                <th scope="row">{usuario.nome}</th>
                                <td>{usuario.email}</td>
                                <td><code>{usuario.id}</code></td>
                                <td><Status ativo={usuario.ativo} /></td>
                                <td>
                                    <a className="admin-usuarios__acao" href={`#usuarios/${encodeURIComponent(usuario.id)}`} aria-label={`Ver projetos de ${usuario.nome}`}>
                                        Ver projetos <span aria-hidden="true">→</span>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </Tabela>
                ) : <p className="admin-usuarios__vazio">{usuarios.length ? 'Nenhum usuário corresponde aos filtros.' : 'Nenhum usuário cadastrado.'}</p>}
            </div>
        </>
    )
}

function ProjetosDoUsuario({ usuario, projetos }) {
    const [busca, setBusca] = useState('')
    const lista = projetos.filter((projeto) => corresponde(
        busca, projeto.nome, projeto.id, projeto.linguagem, projeto.framework, projeto.provedorCloud,
    ))
    return (
        <>
            <div className="admin-usuarios__perfil">
                <div>
                    <h2>{usuario.nome}</h2>
                    <p>{usuario.email}</p>
                    <code>{usuario.id}</code>
                </div>
                <Status ativo={usuario.ativo} />
            </div>
            <div className="admin-usuarios__painel">
                <div className="admin-usuarios__filtros">
                    <label>Buscar projetos
                        <input type="search" placeholder="Nome, ID ou tecnologia" value={busca} onChange={(event) => setBusca(event.target.value)} />
                    </label>
                </div>
                <p className="admin-usuarios__contagem" role="status">{lista.length} de {projetos.length} projetos</p>
                {lista.length ? (
                    <Tabela titulo="Projetos cadastrados" colunas={['Nome', 'ID', 'Linguagem', 'Framework', 'Provedor Cloud']}>
                        {lista.map((projeto) => (
                            <tr key={projeto.id}>
                                <th scope="row">{projeto.nome}</th>
                                <td><code>{projeto.id}</code></td>
                                <td>{projeto.linguagem}</td>
                                <td>{projeto.framework}</td>
                                <td>{projeto.provedorCloud}</td>
                            </tr>
                        ))}
                    </Tabela>
                ) : <p className="admin-usuarios__vazio">{projetos.length ? 'Nenhum projeto corresponde à busca.' : 'Este usuário ainda não tem projetos.'}</p>}
            </div>
        </>
    )
}

export default function AdminUsuarios({ usuarioId, onProjetos, onLogout }) {
    const [consulta, setConsulta] = useState({ carregando: true })
    const [tentativa, setTentativa] = useState(0)
    const { carregando, dados, erro } = consulta

    function atualizar() {
        setConsulta((anterior) => ({ dados: anterior.dados, carregando: true }))
        setTentativa((atual) => atual + 1)
    }

    useEffect(() => {
        let atual = true
        const url = usuarioId
            ? `/api/admin/usuarios/${encodeURIComponent(usuarioId)}/projetos`
            : '/api/admin/usuarios'
        apiFetch(url)
            .then((dados) => { if (atual) setConsulta({ dados }) })
            .catch((falha) => {
                if (atual) setConsulta((anterior) => ({
                    dados: anterior.dados,
                    erro: falha.message || 'Não foi possível carregar os dados.',
                }))
            })
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

            <section className="admin-usuarios__conteudo" aria-labelledby="admin-usuarios-titulo" aria-busy={carregando || undefined}>
                {usuarioId && <a className="admin-usuarios__voltar" href="#usuarios">← Voltar para usuários</a>}
                <div className="admin-usuarios__titulo">
                    <h1 id="admin-usuarios-titulo">{usuarioId ? 'Projetos do usuário' : 'Usuários'}</h1>
                    {dados && <button type="button" className="admin-usuarios__botao" onClick={atualizar} disabled={carregando}>Atualizar lista</button>}
                </div>
                {carregando && <p role="status">Carregando {usuarioId ? 'projetos' : 'usuários'}…</p>}
                {erro && (
                    <div className="admin-usuarios__erro">
                        <p role="alert">{erro}</p>
                        {!dados && <button type="button" className="admin-usuarios__botao" onClick={atualizar}>Tentar novamente</button>}
                    </div>
                )}
                {dados && (usuarioId ? <ProjetosDoUsuario {...dados} /> : <ListaUsuarios usuarios={dados} />)}
            </section>
        </main>
    )
}
