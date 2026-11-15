
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from './api.js'
import './Projetos.css'

export async function buscarProjetos() {
    const dados = await apiFetch('/api/projetos')

    if (!Array.isArray(dados)) {
        throw new Error(
            'Resposta inesperada do servidor ao listar projetos.'
        )
    }

    if (dados.some((projeto) =>
        !projeto ||
        typeof projeto !== 'object' ||
        projeto.id == null
    )) {
        throw new Error(
            'A lista contém informações inválidas de projetos.'
        )
    }

    return dados
}

export function interpretarErroProjetos(error) {
    const mensagemOriginal = error instanceof Error
        ? error.message
        : 'Não foi possível carregar os projetos.'

    const sessaoExpirada =
        mensagemOriginal === 'Sessão expirada. Entre novamente.'

    return {
        sessaoExpirada,
        mensagem: sessaoExpirada
            ? 'Sua sessão expirou. Entre novamente para acessar seus projetos.'
            : mensagemOriginal
    }
}

// Representa visualmente um projeto na listagem.
function ProjetoCard({ projeto, onOpen, onDelete }) {
    const quantidadeClasses = Array.isArray(projeto.classes)
        ? projeto.classes.length
        : 0

    return (
        <article className="projects-card">
            <div className="projects-card-top">
                <span className="projects-card-icon" aria-hidden="true">
                    ▦
                </span>

                {projeto.linguagem && (
                    <span className="projects-badge">
                        {projeto.linguagem}
                    </span>
                )}
            </div>

            <h2 className="projects-card-title">
                {projeto.nome || 'Projeto sem nome'}
            </h2>

            {projeto.descricao && (
                <p className="projects-card-description">
                    {projeto.descricao}
                </p>
            )}

            <div className="projects-card-details">
                {projeto.framework && (
                    <span>Framework: {projeto.framework}</span>
                )}

                {projeto.provedorCloud && (
                    <span>Cloud: {projeto.provedorCloud}</span>
                )}

                <span>
                    {quantidadeClasses}
                    {quantidadeClasses === 1 ? ' classe UML' : ' classes UML'}
                </span>
            </div>

            <div className="projects-card-actions">
                <button
                    type="button"
                    className="projects-btn projects-btn-primary"
                    onClick={() => onOpen(projeto.id)}
                >
                    Abrir projeto <span aria-hidden="true">→</span>
                </button>

                <button
                    type="button"
                    className="projects-btn projects-btn-delete"
                    onClick={() => onDelete(projeto.id)}
                    aria-label={`Excluir projeto ${projeto.nome || 'sem nome'}`}
                    title="Excluir projeto"
                >
                    Excluir
                </button>
            </div>
        </article>
    )
}

// Componente principal. Mantemos as três props do App.jsx.
export default function Projetos({ onNew, onOpen, onLogout }) {
    const [lista, setLista] = useState([])
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [busca, setBusca] = useState('')
    const [sessaoExpirada, setSessaoExpirada] = useState(false)

    // Busca a lista de projetos do usuário.
    const carregar = async () => {
    setCarregando(true)
    setErro('')
    setSessaoExpirada(false)

    try {
        const projetos = await buscarProjetos()

        setLista(projetos)
    } catch (error) {
        const resultado = interpretarErroProjetos(error)

        setLista([])
        setErro(resultado.mensagem)
        setSessaoExpirada(resultado.sessaoExpirada)
    } finally {
        setCarregando(false)
    }
}

    useEffect(() => {
        carregar()
    }, [])

    // Mantém a exclusão que já funcionava antes.
    const excluir = async (id) => {
        if (!window.confirm('Excluir este projeto?')) return

        try {
            await apiFetch(`/api/projetos/${id}`, {
                method: 'DELETE'
            })

            await carregar()
        } catch (err) {
            setErro(err.message)
        }
    }

    // Filtra os projetos localmente.
    const projetosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()

        if (!termo) return lista

        return lista.filter((projeto) =>
            [
                projeto.nome,
                projeto.linguagem,
                projeto.framework,
                projeto.provedorCloud
            ].some((campo) =>
                String(campo || '').toLowerCase().includes(termo)
            )
        )
    }, [lista, busca])

    // Indicadores calculados a partir dos dados recebidos.
    const projetosComClasses = lista.filter(
        (projeto) => Array.isArray(projeto.classes)
            && projeto.classes.length > 0
    ).length

    const linguagensUtilizadas = new Set(
        lista
            .map((projeto) => projeto.linguagem?.trim().toLowerCase())
            .filter(Boolean)
    ).size

    const mostrarIndicadores = !carregando && !erro

    return (
        <main className="projects-page">
            <header className="projects-header">
                <div className="projects-header-inner">
                    <div className="projects-brand">
                        <span aria-hidden="true">✦</span> DiagramCode
                    </div>

                    <span
                        className="projects-current-page"
                        aria-current="page"
                    >
                        Meus projetos
                    </span>

                    <button
                        type="button"
                        className="projects-btn projects-btn-secondary"
                        onClick={onLogout}
                    >
                        Sair
                    </button>
                </div>
            </header>

            <div className="projects-content">
                <div className="projects-heading">
                    <div className="projects-heading-text">
                        <p className="projects-eyebrow">
                            ÁREA DE TRABALHO
                        </p>

                        <h1>Meus projetos</h1>

                        <p className="projects-subtitle">
                            Organize seus diagramas e continue
                            de onde parou.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="projects-btn projects-btn-primary projects-new"
                        onClick={onNew}
                    >
                        + Novo projeto
                    </button>
                </div>

                <section
                    className="projects-stats"
                    aria-label="Resumo dos projetos"
                >
                    <div className="projects-stat">
                        <span>Projetos criados</span>
                        <strong>
                            {mostrarIndicadores ? lista.length : '—'}
                        </strong>
                    </div>

                    <div className="projects-stat">
                        <span>Com classes UML</span>
                        <strong>
                            {mostrarIndicadores ? projetosComClasses : '—'}
                        </strong>
                    </div>

                    <div className="projects-stat">
                        <span>Linguagens utilizadas</span>
                        <strong>
                            {mostrarIndicadores ? linguagensUtilizadas : '—'}
                        </strong>
                    </div>
                </section>

                <section
                    className="projects-section"
                    aria-label="Lista de projetos"
                >
                    <div className="projects-toolbar">
                        <input
                            type="search"
                            className="projects-search"
                            aria-label="Buscar projetos"
                            placeholder="Buscar projeto pelo nome..."
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                        />

                        <span
                            className="projects-count"
                            aria-live="polite"
                        >
                            {carregando
                                ? 'Carregando...'
                                : erro
                                    ? 'Projetos indisponíveis'
                                    : `${projetosFiltrados.length} ${
                                        projetosFiltrados.length === 1
                                            ? 'projeto encontrado'
                                            : 'projetos encontrados'
                                    }`
                            }
                        </span>
                    </div>

                    {erro && !carregando && (
                        <div className="projects-error" role="alert">
                            <h2>
                                {sessaoExpirada
                                    ? 'Sessão expirada'
                                    : 'Não foi possível carregar seus projetos'
                                }
                            </h2>

                            <p>{erro}</p>

                            <button
                                type="button"
                                className="projects-btn projects-btn-secondary"
                                onClick={sessaoExpirada ? onLogout : carregar}
                            >
                                {sessaoExpirada
                                    ? 'Entrar novamente'
                                    : 'Tentar novamente'
                                }
                            </button>
                        </div>
                    )}

                    {carregando && !erro && (
                        <div className="projects-empty" role="status">
                            Carregando seus projetos...
                        </div>
                    )}

                    {!carregando && !erro && projetosFiltrados.length > 0 && (
                        <div className="projects-grid">
                            {projetosFiltrados.map((projeto) => (
                                <ProjetoCard
                                    key={projeto.id}
                                    projeto={projeto}
                                    onOpen={onOpen}
                                    onDelete={excluir}
                                />
                            ))}
                        </div>
                    )}

                    {!carregando && !erro && projetosFiltrados.length === 0 && (
                        <div className="projects-empty">
                            <span className="projects-empty-icon" aria-hidden="true">
                                ▦
                            </span>

                            <h2>
                                {busca
                                    ? 'Nenhum projeto encontrado'
                                    : 'Você ainda não tem projetos'
                                }
                            </h2>

                            <p>
                                {busca
                                    ? 'Tente pesquisar outro nome ou tecnologia.'
                                    : 'Crie seu primeiro projeto para começar seus diagramas.'
                                }
                            </p>

                            <button
                                type="button"
                                className="projects-btn projects-btn-primary"
                                onClick={busca ? () => setBusca('') : onNew}
                            >
                                {busca ? 'Limpar busca' : '+ Criar projeto'}
                            </button>
                        </div>
                    )}
                </section>

                <p className="projects-footer">
                    Seus projetos ficam disponíveis apenas para sua conta.
                </p>
            </div>
        </main>
    )
}
