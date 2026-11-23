import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { renderizarMermaid } from '../../diagramas/renderizarMermaid.js'
import { arquivoInicial, linguagemDoArquivo, listarArquivos, montarArvore } from './arvoreArquivos.js'
import { tokensPorLinha } from './destacarCodigo.js'
import './CodeWorkspace.css'

const ICONES = {
    java: { texto: 'J', classe: 'java' },
    xml: { texto: '<>', classe: 'xml' },
    yaml: { texto: 'Y', classe: 'yaml' },
    hcl: { texto: 'TF', classe: 'hcl' },
    mermaid: { texto: '◇', classe: 'mermaid' },
    json: { texto: '{}', classe: 'json' },
    markdown: { texto: 'M', classe: 'markdown' },
    texto: { texto: '≡', classe: 'texto' },
}

function IconeArquivo({ caminho }) {
    const icone = ICONES[linguagemDoArquivo(caminho).id] || ICONES.texto
    return <span className={`code-ws__file-icon is-${icone.classe}`} aria-hidden="true">{icone.texto}</span>
}

function Pasta({ no, nivel, fechadas, alternar, ativo, abrir }) {
    const fechada = fechadas.has(no.caminho)
    return (
        <li role="treeitem" aria-expanded={!fechada}>
            <button
                type="button"
                className="code-ws__tree-row"
                style={{ paddingLeft: 8 + nivel * 12 }}
                onClick={() => alternar(no.caminho)}
            >
                <span className="code-ws__chevron" aria-hidden="true">{fechada ? '›' : '⌄'}</span>
                <span className="code-ws__folder-name">{no.nome}</span>
            </button>
            {!fechada && (
                <ul role="group">
                    {no.pastas.map((pasta) => (
                        <Pasta key={pasta.caminho} no={pasta} nivel={nivel + 1} fechadas={fechadas} alternar={alternar} ativo={ativo} abrir={abrir} />
                    ))}
                    {no.arquivos.map((arquivo) => (
                        <ItemArquivo key={arquivo.caminho} arquivo={arquivo} nivel={nivel + 1} ativo={ativo} abrir={abrir} />
                    ))}
                </ul>
            )}
        </li>
    )
}

function ItemArquivo({ arquivo, nivel, ativo, abrir }) {
    const selecionado = ativo === arquivo.caminho
    return (
        <li role="treeitem" aria-selected={selecionado}>
            <button
                type="button"
                className={`code-ws__tree-row${selecionado ? ' is-active' : ''}`}
                style={{ paddingLeft: 20 + nivel * 12 }}
                onClick={() => abrir(arquivo.caminho)}
                title={arquivo.caminho}
            >
                <IconeArquivo caminho={arquivo.caminho} />
                <span>{arquivo.nome}</span>
            </button>
        </li>
    )
}

function VisualizadorCodigo({ arquivo }) {
    const linguagem = linguagemDoArquivo(arquivo.caminho).id
    const linhas = useMemo(() => tokensPorLinha(arquivo.conteudo, linguagem), [arquivo.conteudo, linguagem])

    if (!arquivo.conteudo) {
        return <p className="code-ws__empty" role="status">Este arquivo está vazio.</p>
    }

    return (
        <div className="code-ws__code" role="region" aria-label={`Conteúdo de ${arquivo.nome}`} tabIndex={0}>
            <pre>
                <code>
                    {linhas.map((tokens, indice) => (
                        <span className="code-ws__line" key={indice}>
                            <span className="code-ws__line-number" aria-hidden="true">{indice + 1}</span>
                            <span className="code-ws__line-content">
                                {tokens.length === 0 ? '​' : tokens.map((token, posicao) => (
                                    <span key={posicao} className={`tok-${token.tipo}`}>{token.texto}</span>
                                ))}
                            </span>
                        </span>
                    ))}
                </code>
            </pre>
        </div>
    )
}

function PreviaDiagrama({ fonte }) {
    const id = useId()
    const [resultado, setResultado] = useState(null)
    const codigo = String(fonte || '').trim()

    useLayoutEffect(() => {
        setResultado(null)
        if (!codigo) return undefined
        const prefixo = `code-ws-${id.replace(/[^a-zA-Z0-9_]/g, '')}`
        return renderizarMermaid(codigo, prefixo, 'code-ws__temporary', setResultado)
    }, [codigo, id])

    const estado = !codigo ? 'empty' : resultado?.fonte === codigo ? resultado.status : 'loading'

    return (
        <div className="code-ws__preview" aria-busy={estado === 'loading'}>
            {estado === 'empty' && <p role="status">Diagrama vazio.</p>}
            {estado === 'loading' && <p role="status">Desenhando o diagrama…</p>}
            {estado === 'error' && <p role="alert">Não foi possível desenhar este diagrama. Veja o código-fonte na aba Código.</p>}
            {estado === 'success' && (
                <div className="code-ws__preview-canvas" dangerouslySetInnerHTML={{ __html: resultado.svg }} />
            )}
        </div>
    )
}

/**
 * Janela estilo VS Code com os arquivos gerados: explorador em árvore,
 * abas, código com realce e números de linha, cópia e download do ZIP.
 */
export default function CodeWorkspace({ aberto, resultado, nomeProjeto = '', onFechar, onBaixar }) {
    const tituloId = useId()
    const arquivos = useMemo(() => listarArquivos(resultado?.artefatos), [resultado])
    const arvore = useMemo(() => montarArvore(arquivos), [arquivos])
    const porCaminho = useMemo(() => new Map(arquivos.map((arquivo) => [arquivo.caminho, arquivo])), [arquivos])

    const [abas, setAbas] = useState([])
    const [ativo, setAtivo] = useState('')
    const [fechadas, setFechadas] = useState(() => new Set())
    const [filtro, setFiltro] = useState('')
    const [copiado, setCopiado] = useState(false)
    const [modoDiagrama, setModoDiagrama] = useState('previa')
    const [baixando, setBaixando] = useState(false)
    const botaoFecharRef = useRef(null)

    // Ao abrir (ou receber um novo resultado), começa pela primeira classe.
    useEffect(() => {
        if (!aberto) return
        const inicial = arquivoInicial(arquivos)
        setAbas(inicial ? [inicial.caminho] : [])
        setAtivo(inicial?.caminho || '')
        setFiltro('')
        setFechadas(new Set())
    }, [aberto, arquivos])

    useEffect(() => {
        if (!aberto) return undefined
        const focoAnterior = document.activeElement
        botaoFecharRef.current?.focus()
        const overflowAnterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const teclas = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onFechar?.()
            }
        }
        document.addEventListener('keydown', teclas)

        return () => {
            document.removeEventListener('keydown', teclas)
            document.body.style.overflow = overflowAnterior
            if (focoAnterior instanceof HTMLElement) focoAnterior.focus?.()
        }
    }, [aberto, onFechar])

    if (!aberto) return null

    const arquivoAtivo = porCaminho.get(ativo) || null
    const linguagem = arquivoAtivo ? linguagemDoArquivo(arquivoAtivo.caminho) : null
    const ehDiagrama = linguagem?.id === 'mermaid'
    const totalLinhas = arquivoAtivo ? arquivoAtivo.conteudo.split('\n').length : 0
    const termo = filtro.trim().toLowerCase()
    const filtrados = termo ? arquivos.filter((arquivo) => arquivo.caminho.toLowerCase().includes(termo)) : []
    const nomeRaiz = (nomeProjeto || 'projeto').toUpperCase()

    const abrir = (caminho) => {
        setAbas((atual) => atual.includes(caminho) ? atual : [...atual, caminho])
        setAtivo(caminho)
        setCopiado(false)
    }

    const fecharAba = (caminho) => {
        setAbas((atual) => {
            const restantes = atual.filter((item) => item !== caminho)
            if (caminho === ativo) {
                const posicao = atual.indexOf(caminho)
                setAtivo(restantes[Math.min(posicao, restantes.length - 1)] || '')
            }
            return restantes
        })
    }

    const alternarPasta = (caminho) => {
        setFechadas((atual) => {
            const proxima = new Set(atual)
            if (proxima.has(caminho)) proxima.delete(caminho)
            else proxima.add(caminho)
            return proxima
        })
    }

    const copiar = async () => {
        if (!arquivoAtivo) return
        try {
            await navigator.clipboard.writeText(arquivoAtivo.conteudo)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1500)
        } catch {
            setCopiado(false)
        }
    }

    const baixar = async () => {
        if (!onBaixar || baixando) return
        setBaixando(true)
        try {
            await onBaixar()
        } finally {
            setBaixando(false)
        }
    }

    return (
        <div className="code-ws__overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onFechar?.() }}>
            <section className="code-ws" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
                <header className="code-ws__titlebar">
                    <span className="code-ws__dots" aria-hidden="true"><i /><i /><i /></span>
                    <h2 id={tituloId}>
                        {nomeProjeto || 'Projeto'} — Código gerado
                    </h2>
                    <div className="code-ws__title-actions">
                        <button type="button" onClick={baixar} disabled={!onBaixar || baixando || !arquivos.length}>
                            {baixando ? 'Preparando…' : '⤓ Baixar .zip'}
                        </button>
                        <button type="button" ref={botaoFecharRef} className="code-ws__close" onClick={onFechar} aria-label="Fechar código gerado">
                            ✕
                        </button>
                    </div>
                </header>

                <div className="code-ws__body">
                    <nav className="code-ws__activity" aria-hidden="true">
                        <span className="is-active">⧉</span>
                        <span>⌕</span>
                        <span>⑂</span>
                    </nav>

                    <aside className="code-ws__explorer" aria-label="Explorador de arquivos">
                        <p className="code-ws__explorer-title">EXPLORER</p>
                        <label className="code-ws__search">
                            <span className="sr-only">Buscar arquivo</span>
                            <input
                                type="search"
                                placeholder="Buscar arquivo…"
                                value={filtro}
                                onChange={(event) => setFiltro(event.target.value)}
                            />
                        </label>
                        <p className="code-ws__root">⌄ {nomeRaiz}</p>

                        {arquivos.length === 0 ? (
                            <p className="code-ws__empty">Nenhum arquivo gerado.</p>
                        ) : termo ? (
                            <ul className="code-ws__tree" role="tree" aria-label="Resultados da busca">
                                {filtrados.length === 0 && <li className="code-ws__empty">Nenhum arquivo encontrado.</li>}
                                {filtrados.map((arquivo) => (
                                    <ItemArquivo key={arquivo.caminho} arquivo={arquivo} nivel={0} ativo={ativo} abrir={abrir} />
                                ))}
                            </ul>
                        ) : (
                            <ul className="code-ws__tree" role="tree" aria-label="Arquivos do projeto">
                                {arvore.pastas.map((pasta) => (
                                    <Pasta key={pasta.caminho} no={pasta} nivel={0} fechadas={fechadas} alternar={alternarPasta} ativo={ativo} abrir={abrir} />
                                ))}
                                {arvore.arquivos.map((arquivo) => (
                                    <ItemArquivo key={arquivo.caminho} arquivo={arquivo} nivel={0} ativo={ativo} abrir={abrir} />
                                ))}
                            </ul>
                        )}
                    </aside>

                    <div className="code-ws__editor">
                        <div className="code-ws__tabs" role="tablist" aria-label="Arquivos abertos">
                            {abas.map((caminho) => {
                                const arquivo = porCaminho.get(caminho)
                                if (!arquivo) return null
                                const selecionada = caminho === ativo
                                return (
                                    <div key={caminho} className={`code-ws__tab${selecionada ? ' is-active' : ''}`}>
                                        <button type="button" role="tab" aria-selected={selecionada} onClick={() => setAtivo(caminho)} title={caminho}>
                                            <IconeArquivo caminho={caminho} />
                                            {arquivo.nome}
                                        </button>
                                        <button type="button" className="code-ws__tab-close" aria-label={`Fechar ${arquivo.nome}`} onClick={() => fecharAba(caminho)}>
                                            ×
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {arquivoAtivo ? (
                            <>
                                <div className="code-ws__breadcrumb">
                                    <span>{arquivoAtivo.caminho.split('/').join(' › ')}</span>
                                    <div className="code-ws__breadcrumb-actions">
                                        {ehDiagrama && (
                                            <div className="code-ws__segmented" role="group" aria-label="Modo de exibição">
                                                <button type="button" aria-pressed={modoDiagrama === 'previa'} onClick={() => setModoDiagrama('previa')}>Prévia</button>
                                                <button type="button" aria-pressed={modoDiagrama === 'codigo'} onClick={() => setModoDiagrama('codigo')}>Código</button>
                                            </div>
                                        )}
                                        <button type="button" onClick={copiar}>{copiado ? '✓ Copiado' : '⧉ Copiar'}</button>
                                    </div>
                                </div>
                                {ehDiagrama && modoDiagrama === 'previa'
                                    ? <PreviaDiagrama fonte={arquivoAtivo.conteudo} />
                                    : <VisualizadorCodigo arquivo={arquivoAtivo} />}
                            </>
                        ) : (
                            <div className="code-ws__welcome">
                                <strong>DiagramCode</strong>
                                <p>Selecione um arquivo no explorador para ver o código.</p>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="code-ws__statusbar">
                    <span>⑂ main</span>
                    <span>{arquivos.length} {arquivos.length === 1 ? 'arquivo gerado' : 'arquivos gerados'}</span>
                    <span className="code-ws__status-spacer" />
                    {arquivoAtivo && (
                        <>
                            <span>{totalLinhas} {totalLinhas === 1 ? 'linha' : 'linhas'}</span>
                            <span>UTF-8</span>
                            <span>{linguagem.nome}</span>
                        </>
                    )}
                </footer>
            </section>
        </div>
    )
}
