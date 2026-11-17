import { useEffect, useMemo, useRef, useState } from 'react'
import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import PublicButton from './components/public/PublicButton.jsx'
import { apiFetch } from './api.js'
import './Login.css'
import './Projetos.css'

function normalizarTexto(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
}

export function filtrarEOrdenarProjetos(
    lista,
    busca,
    ordenacao = 'az'
) {
    const termo = normalizarTexto(busca).trim()

    const comparador = new Intl.Collator('pt-BR', {
        sensitivity: 'base',
        numeric: true
    })

    return (Array.isArray(lista) ? lista : [])
        .filter((projeto) =>
            normalizarTexto(projeto?.nome).includes(termo)
        )
        .sort((a, b) => {
            const resultado = comparador.compare(
                String(a?.nome ?? ''),
                String(b?.nome ?? '')
            )

            return ordenacao === 'za'
                ? -resultado
                : resultado
        })
}

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

export async function excluirProjetoConfirmado(
    projeto,
    {
        confirmar = (mensagem) => window.confirm(mensagem),
        aoConfirmar = () => { },
        requisicao = apiFetch
    } = {}
) {
    if (projeto?.id == null) {
        throw new Error('Projeto sem identificador válido.')
    }

    const nome = String(projeto.nome || 'sem nome')

    const confirmado = confirmar(
        `Deseja excluir permanentemente o projeto "${nome}"?\n\n` +
        'Esta ação não pode ser desfeita.'
    )

    if (!confirmado) {
        return false
    }

    aoConfirmar()

    await requisicao(
        `/api/projetos/${encodeURIComponent(String(projeto.id))}`,
        { method: 'DELETE' }
    )

    return true
}

export function removerProjetoDaLista(lista, id) {
    return lista.filter(
        (projeto) => String(projeto.id) !== String(id)
    )
}

// Representa visualmente um projeto na listagem.
function ProjetoCard({
    projeto,
    onOpen,
    onDelete,
    excluindo,
    exclusaoEmAndamento
}) {
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
                    onClick={() => onDelete(projeto)}
                    disabled={exclusaoEmAndamento}
                    aria-busy={excluindo}
                    aria-label={
                        excluindo
                            ? `Excluindo projeto ${projeto.nome || 'sem nome'}`
                            : `Excluir projeto ${projeto.nome || 'sem nome'}`
                    }
                    title="Excluir projeto"
                >
                    {excluindo ? 'Excluindo...' : 'Excluir'}
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
    const [ordenacao, setOrdenacao] = useState('az')
    const [sessaoExpirada, setSessaoExpirada] = useState(false)
    const [excluindoId, setExcluindoId] = useState(null)
    const [erroExclusao, setErroExclusao] = useState('')
    const [sessaoExpiradaExclusao, setSessaoExpiradaExclusao] = useState(false)
    const [projetoParaExcluir, setProjetoParaExcluir] = useState(null)
    const dialogExclusaoRef = useRef(null)

    useEffect(() => {
        if (
            projetoParaExcluir &&
            dialogExclusaoRef.current &&
            !dialogExclusaoRef.current.open
        ) {
            dialogExclusaoRef.current.showModal()
        }
    }, [projetoParaExcluir])

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
    const solicitarExclusao = (projeto) => {
        if (excluindoId !== null) return

        setErroExclusao('')
        setSessaoExpiradaExclusao(false)
        setProjetoParaExcluir(projeto)
    }

    const excluir = async () => {
        const projeto = projetoParaExcluir

        if (!projeto || excluindoId !== null) return

        try {
            const excluido = await excluirProjetoConfirmado(
                projeto,
                {
                    confirmar: () => true,
                    aoConfirmar: () => setExcluindoId(projeto.id)
                }
            )

            if (excluido) {
                setLista((anterior) =>
                    removerProjetoDaLista(anterior, projeto.id)
                )

                setProjetoParaExcluir(null)
            }
        } catch (error) {
            const resultado = interpretarErroProjetos(error)

            setErroExclusao(resultado.mensagem)
            setSessaoExpiradaExclusao(resultado.sessaoExpirada)
            setProjetoParaExcluir(null)
        } finally {
            setExcluindoId(null)
        }
    }

    // Filtra os projetos localmente.
    const projetosFiltrados = useMemo(() => {
        return filtrarEOrdenarProjetos(lista, busca, ordenacao)
    }, [lista, busca, ordenacao])

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
        <header className="public-header">
            <div className="public-header__inner">
                <a
                    className="public-header__brand"
                    href="#inicio"
                    aria-label="DiagramCode — início"
                >
                    <DiagramCodeLogo />
                </a>

                <nav className="public-nav" aria-label="Navegação principal">
                    <a href="#inicio" className="public-nav__home">
                        Início
                    </a>

                    <PublicButton
                        className="projects-header-logout"
                        variant="outline"
                        onClick={onLogout}
                    >
                        Sair
                    </PublicButton>
                </nav>
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
                        <div className="projects-filters">
                            <input
                                type="search"
                                className="projects-search"
                                aria-label="Buscar projetos"
                                placeholder="Buscar projeto pelo nome..."
                                value={busca}
                                onChange={(event) => setBusca(event.target.value)}
                            />

                            <label className="projects-sort-control">
                                <span>Ordenar por</span>

                                <select
                                    className="projects-sort"
                                    value={ordenacao}
                                    onChange={(event) =>
                                        setOrdenacao(event.target.value)
                                    }
                                >
                                    <option value="az">Nome: A–Z</option>
                                    <option value="za">Nome: Z–A</option>
                                </select>
                            </label>
                        </div>

                        <span
                            className="projects-count"
                            aria-live="polite"
                        >
                            {carregando
                                ? 'Carregando...'
                                : erro
                                    ? 'Projetos indisponíveis'
                                    : `${projetosFiltrados.length} ${projetosFiltrados.length === 1
                                        ? 'projeto encontrado'
                                        : 'projetos encontrados'
                                    }`
                            }
                        </span>
                    </div>

                    {erroExclusao && (
                        <div className="projects-action-error" role="alert">
                            <p>
                                <strong>Não foi possível excluir o projeto.</strong>
                                {' '}
                                {erroExclusao}
                            </p>

                            {sessaoExpiradaExclusao ? (
                                <button
                                    type="button"
                                    className="projects-btn projects-btn-secondary"
                                    onClick={onLogout}
                                >
                                    Entrar novamente
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="projects-btn projects-btn-secondary"
                                    onClick={() => setErroExclusao('')}
                                >
                                    Fechar
                                </button>
                            )}
                        </div>
                    )}

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
                                    onDelete={solicitarExclusao}
                                    excluindo={
                                        excluindoId !== null &&
                                        String(excluindoId) === String(projeto.id)
                                    }
                                    exclusaoEmAndamento={excluindoId !== null}
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
                                {busca.trim()
                                    ? 'Nenhum projeto encontrado'
                                    : 'Você ainda não tem projetos'
                                }
                            </h2>

                            <p>
                                {busca.trim()
                                    ? 'Tente pesquisar outro nome ou tecnologia.'
                                    : 'Crie seu primeiro projeto para começar seus diagramas.'
                                }
                            </p>

                            <button
                                type="button"
                                className="projects-btn projects-btn-primary"
                                onClick={busca.trim() ? () => setBusca('') : onNew}
                            >
                                {busca.trim() ? 'Limpar busca' : '+ Criar projeto'}
                            </button>
                        </div>
                    )}
                </section>
                {/* Modal de confirmação de exclusão */}
                {projetoParaExcluir && (
                    <dialog
                        ref={dialogExclusaoRef}
                        className="projects-delete-dialog"
                        aria-labelledby="projects-delete-title"
                        aria-describedby="projects-delete-description"
                        onCancel={(event) => {
                            event.preventDefault()

                            if (excluindoId === null) {
                                setProjetoParaExcluir(null)
                            }
                        }}
                    >
                        <h2 id="projects-delete-title">
                            Excluir projeto?
                        </h2>

                        <p id="projects-delete-description">
                            Você está prestes a excluir permanentemente o projeto{' '}
                            <strong>
                                "{projetoParaExcluir.nome || 'sem nome'}"
                            </strong>.
                            {' '}Esta ação não pode ser desfeita.
                        </p>

                        <div className="projects-delete-dialog-actions">
                            <button
                                type="button"
                                className="projects-btn projects-btn-secondary"
                                onClick={() => setProjetoParaExcluir(null)}
                                disabled={excluindoId !== null}
                                autoFocus
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="projects-btn projects-btn-danger"
                                onClick={excluir}
                                disabled={excluindoId !== null}
                                aria-busy={excluindoId !== null}
                            >
                                {excluindoId !== null
                                    ? 'Excluindo...'
                                    : 'Sim, excluir projeto'
                                }
                            </button>
                        </div>
                    </dialog>
                )}

                <p className="projects-footer">
                    Seus projetos ficam disponíveis apenas para sua conta.
                </p>
            </div>
        </main>
    )
}
