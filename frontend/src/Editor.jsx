import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import mermaid from 'mermaid'
import { apiFetch, clearAuth } from './api.js'
import { EXEMPLO_MODELO, createProjetoVazio, modeloParaTexto, parseModelo } from './modelo.js'

const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default function Editor({ projectId, onBack, onLogout, onProjectSaved }) {
    const [project, setProject] = useState(createProjetoVazio())
    const [text, setText] = useState(EXEMPLO_MODELO)
    const [erro, setErro] = useState('')
    const [saving, setSaving] = useState(false)
    const [resultado, setResultado] = useState(null)
    const [loadingProject, setLoadingProject] = useState(false)
    const [currentProjectId, setCurrentProjectId] = useState(projectId)

    const isNovo = currentProjectId === 'novo' || projectId === 'novo'

    useEffect(() => {
        const carregar = async () => {
            if (projectId === 'novo') {
                setCurrentProjectId('novo')
                setProject(createProjetoVazio())
                setText(EXEMPLO_MODELO)
                setErro('')
                return
            }

            setLoadingProject(true)
            setErro('')

            try {
                const data = await apiFetch(`/api/projetos/${projectId}`)
                const projetoCarregado = data || createProjetoVazio()
                setCurrentProjectId(projetoCarregado.id || projectId)
                setProject(projetoCarregado)
                setText(modeloParaTexto(projetoCarregado))
            } catch (err) {
                setErro(err.message)
                if (err.message === 'Sessão expirada. Entre novamente.') {
                    clearAuth()
                    onLogout()
                }
            } finally {
                setLoadingProject(false)
            }
        }

        carregar()
    }, [projectId, onLogout])

    useEffect(() => {
        const render = async (id, diagram) => {
            const el = document.getElementById(id)
            if (!el || !diagram) return
            mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
            try {
                const { svg } = await mermaid.render(`${id}-svg`, diagram)
                el.innerHTML = svg
            } catch {
                el.innerHTML = `<pre>${escapeHtml(diagram)}</pre>`
            }
        }

        render('uml-diagram', resultado?.uml)
        render('cloud-diagram', resultado?.cloud)
    }, [resultado])

    const aplicarTexto = () => {
        try {
            const next = parseModelo(text)
            setProject(next)
            setErro('')
        } catch (err) {
            setErro(err.message)
        }
    }

    const salvar = async () => {
        try {
            const next = parseModelo(text)
            setProject(next)
            setErro('')
            setSaving(true)

            const payload = {
                nome: next.nome,
                linguagem: next.linguagem,
                framework: next.framework,
                provedorCloud: next.provedorCloud,
                classes: next.classes,
                relacoes: next.relacoes,
                servicosCloud: next.servicosCloud,
                conexoesCloud: next.conexoesCloud,
            }

            const response = isNovo
                ? await apiFetch('/api/projetos', { method: 'POST', body: payload })
                : await apiFetch(`/api/projetos/${currentProjectId}`, { method: 'PUT', body: payload })

            const id = response?.id || currentProjectId
            if (response?.id) {
                setCurrentProjectId(response.id)
                onProjectSaved?.(response.id)
            }
            const gerado = await apiFetch(`/api/projetos/${id}/gerar`, { method: 'POST' })
            setResultado(gerado)
            setProject((prev) => ({ ...prev, ...(response || {}), id: id || prev.id }))
            setText(modeloParaTexto({ ...next, ...(response || {}), id: id || next.id }))
        } catch (err) {
            setErro(err.message)
            if (err.message === 'Sessão expirada. Entre novamente.') {
                clearAuth()
                onLogout()
            }
        } finally {
            setSaving(false)
        }
    }

    const baixarTudo = async () => {
        if (!resultado?.artefatos?.length) {
            setErro('Ainda não há artefatos para baixar.')
            return
        }

        try {
            const zip = new JSZip()
            for (const artefato of resultado.artefatos) {
                const nome = String(artefato?.nome || 'arquivo.txt')
                const caminho = nome.replace(/\\/g, '/')
                const conteudo = artefato?.conteudo || ''
                let destino = caminho

                if (caminho.includes('/src/main/java/')) {
                    destino = caminho.replace(/^.*?src\/main\/java\//, 'src/main/java/')
                } else if (caminho.includes('/src/main/resources/')) {
                    destino = caminho.replace(/^.*?src\/main\/resources\//, 'src/main/resources/')
                } else if (caminho.includes('/infra/') || caminho.includes('infra/')) {
                    destino = `infra/${caminho.split('/').pop()}`
                } else if (caminho.includes('/docs/') || caminho.includes('docs/')) {
                    destino = `docs/${caminho.split('/').pop()}`
                } else if (caminho.endsWith('pom.xml')) {
                    destino = 'pom.xml'
                }

                zip.file(destino, conteudo)
            }

            const blob = await zip.generateAsync({ type: 'blob' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.href = url
            link.download = 'projeto-gerado.zip'
            link.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            setErro(err.message || 'Não foi possível baixar o pacote.')
        }
    }

    const agrupado = useMemo(() => {
        const mapa = { JAVA: [], CONFIG: [], INFRA: [], DIAGRAM: [] }
        for (const artefato of resultado?.artefatos || []) {
            const nome = String(artefato?.nome || '').toLowerCase()
            const tipo = nome.endsWith('.java') || nome.includes('java') ? 'JAVA' : nome.endsWith('.yml') || nome.endsWith('.yaml') || nome.endsWith('.xml') ? 'CONFIG' : nome.includes('diagram') || nome.includes('uml') || nome.includes('cloud') ? 'DIAGRAM' : 'INFRA'
            mapa[tipo].push(artefato)
        }
        return mapa
    }, [resultado])

    if (loadingProject) {
        return (
            <div className="shell">
                <div className="card wide">
                    <div className="topline">
                        <h1>{isNovo ? 'Novo projeto' : 'Editar projeto'}</h1>
                        <div className="actions">
                            <button type="button" onClick={onBack}>Voltar</button>
                        </div>
                    </div>
                    <div className="error">Carregando...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="shell">
            <div className="card wide">
                <div className="topline">
                    <h1>{isNovo ? 'Novo projeto' : 'Editar projeto'}</h1>
                    <div className="actions">
                        <button type="button" onClick={onBack}>Voltar</button>
                        <button type="button" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar e gerar'}</button>
                    </div>
                </div>

                {erro && <div className="error">{erro}</div>}

                <div className="editor-grid">
                    <div>
                        <label>
                            Nome
                            <input value={project.nome} onChange={(event) => setProject({ ...project, nome: event.target.value })} />
                        </label>
                        <label>
                            Provedor
                            <select value={project.provedorCloud} onChange={(event) => setProject({ ...project, provedorCloud: event.target.value })}>
                                <option value="aws">AWS</option>
                                <option value="oci">OCI</option>
                            </select>
                        </label>
                        <label>
                            Modelo em texto
                            <textarea rows="18" value={text} onChange={(event) => setText(event.target.value)} />
                        </label>
                        <div className="actions"><button type="button" onClick={() => setText(EXEMPLO_MODELO)}>Carregar exemplo</button><button type="button" className="muted" onClick={aplicarTexto}>Carregar no formulário</button></div>
                    </div>

                    <aside className="help">
                        <strong>Formato</strong>
                        <pre>{`Classe Pedido
  id: Long
  valor: BigDecimal
  calcularTotal(): BigDecimal
Relação: Pedido -> Cliente (MANY_TO_ONE)
Serviço: db RDS DATA engine=mysql instanceType=db.t3.micro
Conexão: api -> db "API para banco"`}</pre>
                        <p>Não use senhas reais em arquivos de exemplo.</p>
                    </aside>
                </div>

                {resultado && (
                    <div className="resultado">
                        <div className="topline">
                            <h2>Resultado</h2>
                            <button type="button" onClick={baixarTudo}>Baixar tudo (.zip)</button>
                        </div>
                        <div className="diagrams">
                            <div className="diagram-box">
                                <h3>UML</h3>
                                <div id="uml-diagram" />
                            </div>
                            <div className="diagram-box">
                                <h3>Cloud</h3>
                                <div id="cloud-diagram" />
                            </div>
                        </div>

                        <div className="artefatos">
                            {Object.entries(agrupado).map(([grupo, itens]) => itens.length ? (
                                <div key={grupo} className="grupo">
                                    <h3>{grupo}</h3>
                                    {itens.map((artefato, idx) => (
                                        <details key={`${grupo}-${idx}`} open>
                                            <summary>{artefato.nome}</summary>
                                            <pre>{artefato.conteudo || ''}</pre>
                                        </details>
                                    ))}
                                </div>
                            ) : null)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
