import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { apiFetch, clearAuth } from './api.js'

const TIPOS_ATRIBUTO = ['String', 'Long', 'Integer', 'Double', 'BigDecimal', 'Boolean', 'LocalDate', 'LocalDateTime']
const TIPOS_RETORNO = ['void', 'String', 'Long', 'Integer', 'Double', 'BigDecimal', 'Boolean']
const TIPOS_RELACAO = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']
const TIPOS_SERVICO = {
    aws: ['VPC', 'EC2', 'ASG', 'ALB', 'RDS', 'S3', 'LAMBDA', 'SQS', 'SNS', 'CLOUDWATCH', 'DYNAMODB'],
    oci: ['VCN', 'INSTANCE', 'DATABASE', 'OBJECT_STORAGE', 'LOAD_BALANCER'],
}

const EXEMPLO_PROJETO = {
    nome: 'Pedido',
    linguagem: 'java',
    framework: 'spring-boot',
    provedorCloud: 'aws',
    classes: [
        { nome: 'Pedido', atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'valor', tipo: 'BigDecimal' }], metodos: [{ nome: 'calcularTotal', tipoRetorno: 'BigDecimal' }] },
        { nome: 'Cliente', atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'nome', tipo: 'String' }], metodos: [] },
    ],
    relacoes: [{ origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' }],
    servicosCloud: [
        { id: 'db', tipo: 'RDS', categoria: 'DATA', configuracao: { engine: 'mysql', instanceType: 'db.t3.micro' } },
        { id: 'api', tipo: 'EC2', categoria: 'COMPUTE', configuracao: { instanceType: 't3.micro' } },
    ],
    conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'API para banco' }],
}

export function createProjetoVazio() {
    return {
        nome: '',
        linguagem: 'java',
        framework: 'spring-boot',
        provedorCloud: 'aws',
        classes: [],
        relacoes: [],
        servicosCloud: [],
        conexoesCloud: [],
    }
}

export function normalizeProjeto(data = {}) {
    return {
        id: data.id || '',
        usuarioId: data.usuarioId || '',
        nome: data.nome || '',
        linguagem: data.linguagem || 'java',
        framework: data.framework || 'spring-boot',
        provedorCloud: data.provedorCloud || 'aws',
        classes: Array.isArray(data.classes) ? data.classes.map((classe) => ({
            nome: classe?.nome || '',
            atributos: Array.isArray(classe?.atributos) ? classe.atributos.map((atributo) => ({
                nome: atributo?.nome || '',
                tipo: atributo?.tipo || '',
            })) : [],
            metodos: Array.isArray(classe?.metodos) ? classe.metodos.map((metodo) => ({
                nome: metodo?.nome || '',
                tipoRetorno: metodo?.tipoRetorno || metodo?.tipo || '',
            })) : [],
        })) : [],
        relacoes: Array.isArray(data.relacoes) ? data.relacoes.map((relacao) => ({
            origem: relacao?.origem || '',
            destino: relacao?.destino || '',
            tipo: relacao?.tipo || '',
        })) : [],
        servicosCloud: Array.isArray(data.servicosCloud) ? data.servicosCloud.map((servico) => ({
            id: servico?.id || '',
            tipo: servico?.tipo || '',
            categoria: servico?.categoria || 'COMPUTE',
            configuracao: servico?.configuracao && typeof servico.configuracao === 'object'
                ? Object.fromEntries(Object.entries(servico.configuracao).map(([chave, valor]) => [chave, String(valor ?? '')]))
                : {},
        })) : [],
        conexoesCloud: Array.isArray(data.conexoesCloud) ? data.conexoesCloud.map((conexao) => ({
            de: conexao?.de || '',
            para: conexao?.para || '',
            rotulo: conexao?.rotulo || '',
        })) : [],
    }
}

export function buildPayloadProjeto(projeto) {
    const base = normalizeProjeto(projeto)
    const payload = {
        nome: String(base.nome || '').trim(),
        linguagem: String(base.linguagem || 'java').trim(),
        framework: String(base.framework || 'spring-boot').trim(),
        provedorCloud: String(base.provedorCloud || 'aws').trim(),
        classes: (base.classes || []).map((classe) => ({
            nome: String(classe.nome || '').trim(),
            atributos: (classe.atributos || []).map((atributo) => ({
                nome: String(atributo.nome || '').trim(),
                tipo: String(atributo.tipo || '').trim(),
            })).filter((atributo) => atributo.nome || atributo.tipo),
            metodos: (classe.metodos || []).map((metodo) => ({
                nome: String(metodo.nome || '').trim(),
                tipoRetorno: String(metodo.tipoRetorno || '').trim(),
            })).filter((metodo) => metodo.nome || metodo.tipoRetorno),
        })),
        relacoes: (base.relacoes || []).map((relacao) => ({
            origem: String(relacao.origem || '').trim(),
            destino: String(relacao.destino || '').trim(),
            tipo: String(relacao.tipo || '').trim(),
        })).filter((relacao) => relacao.origem || relacao.destino || relacao.tipo),
        servicosCloud: (base.servicosCloud || []).map((servico) => ({
            id: String(servico.id || '').trim(),
            tipo: String(servico.tipo || '').trim(),
            categoria: String(servico.categoria || 'COMPUTE').trim(),
            configuracao: Object.fromEntries(Object.entries(servico.configuracao || {}).map(([chave, valor]) => [String(chave), String(valor ?? '')])),
        })).filter((servico) => servico.id || servico.tipo || servico.categoria),
        conexoesCloud: (base.conexoesCloud || []).map((conexao) => ({
            de: String(conexao.de || '').trim(),
            para: String(conexao.para || '').trim(),
            rotulo: String(conexao.rotulo || '').trim(),
        })).filter((conexao) => conexao.de || conexao.para || conexao.rotulo),
    }

    delete payload.id
    delete payload.usuarioId
    return payload
}

export function renomearClasse(projeto, indice, nomeNovo) {
    const nomeAntigo = projeto.classes?.[indice]?.nome || ''
    const nomeFinal = String(nomeNovo || '').trim()
    return {
        ...projeto,
        classes: (projeto.classes || []).map((classe, index) => index === indice ? { ...classe, nome: nomeFinal } : classe),
        relacoes: (projeto.relacoes || []).map((relacao) => ({
            ...relacao,
            origem: relacao.origem === nomeAntigo ? nomeFinal : relacao.origem,
            destino: relacao.destino === nomeAntigo ? nomeFinal : relacao.destino,
        })),
    }
}

export function removerClasse(projeto, indice) {
    const nome = projeto.classes?.[indice]?.nome || ''
    return {
        ...projeto,
        classes: (projeto.classes || []).filter((_, index) => index !== indice),
        relacoes: (projeto.relacoes || []).filter((relacao) => relacao.origem !== nome && relacao.destino !== nome),
    }
}

export function validarProjeto(projeto) {
    const erros = []
    const nomeProjeto = String(projeto?.nome || '').trim()
    if (!nomeProjeto) erros.push('O nome do projeto é obrigatório.')

    const nomesClasses = new Set()
    for (const classe of projeto.classes || []) {
        const nome = String(classe?.nome || '').trim()
        if (!nome) erros.push('Há uma classe com nome vazio.')
        else if (nomesClasses.has(nome)) erros.push(`A classe "${nome}" está duplicada.`)
        else nomesClasses.add(nome)

        for (const atributo of classe?.atributos || []) {
            const nomeAtributo = String(atributo?.nome || '').trim()
            const tipoAtributo = String(atributo?.tipo || '').trim()
            if (!nomeAtributo || !tipoAtributo) erros.push(`Atributo inválido em "${nome || 'classe sem nome'}".`)
        }

        for (const metodo of classe?.metodos || []) {
            const nomeMetodo = String(metodo?.nome || '').trim()
            const retornoMetodo = String(metodo?.tipoRetorno || '').trim()
            if (!nomeMetodo || !retornoMetodo) erros.push(`Método inválido em "${nome || 'classe sem nome'}".`)
        }
    }

    for (const relacao of projeto.relacoes || []) {
        const origem = String(relacao?.origem || '').trim()
        const destino = String(relacao?.destino || '').trim()
        const tipo = String(relacao?.tipo || '').trim()
        if (!origem || !destino || !tipo) erros.push('Há uma relação incompleta.')
    }

    const idsServicos = new Set()
    for (const servico of projeto.servicosCloud || []) {
        const id = String(servico?.id || '').trim()
        if (!id) erros.push('Há um serviço sem identificador.')
        else if (idsServicos.has(id)) erros.push(`O serviço "${id}" está duplicado.`)
        else idsServicos.add(id)

        const tipo = String(servico?.tipo || '').trim()
        if (!tipo) erros.push(`O serviço "${id || 'sem id'}" está sem tipo.`)
    }

    for (const conexao of projeto.conexoesCloud || []) {
        const de = String(conexao?.de || '').trim()
        const para = String(conexao?.para || '').trim()
        if (!de || !para) erros.push('Há uma conexão incompleta.')
    }

    return erros
}

const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

let mermaidInstancePromise = null
const loadMermaid = async () => {
    if (!mermaidInstancePromise) {
        mermaidInstancePromise = import('mermaid').then((module) => {
            const mermaid = module.default
            mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
            return mermaid
        })
    }
    return mermaidInstancePromise
}

export function DiagramPanel({ title, status = 'idle', diagram = '', error = '', emptyMessage = 'A UML aparece aqui depois de Salvar e gerar.' }) {
    const hasDiagram = status === 'success' && diagram
    const hasError = status === 'error'

    return (
        <div className="diagram-box">
            <h3>{title}</h3>
            {status === 'idle' && <p className="diagram-placeholder">{emptyMessage}</p>}
            {status === 'loading' && <div className="diagram-status">Gerando...</div>}
            {hasDiagram && <div className="diagram-canvas" dangerouslySetInnerHTML={{ __html: diagram }} />}
            {hasError && (
                <div className="diagram-status error">
                    <strong>Erro ao renderizar o diagrama:</strong>
                    <p>{error}</p>
                    {diagram && <pre>{diagram}</pre>}
                </div>
            )}
        </div>
    )
}

export default function Editor({ projectId, onBack, onLogout, onProjectSaved }) {
    const [project, setProject] = useState(createProjetoVazio())
    const [erro, setErro] = useState('')
    const [saving, setSaving] = useState(false)
    const [resultado, setResultado] = useState(null)
    const [loadingProject, setLoadingProject] = useState(false)
    const [currentProjectId, setCurrentProjectId] = useState(projectId)
    const [diagramState, setDiagramState] = useState({ uml: { status: 'idle', diagram: '', error: '' }, cloud: { status: 'idle', diagram: '', error: '' } })

    const problemas = useMemo(() => validarProjeto(project), [project])
    const isNovo = currentProjectId === 'novo' || projectId === 'novo'

    useEffect(() => {
        const carregar = async () => {
            if (projectId === 'novo') {
                setCurrentProjectId('novo')
                setProject(createProjetoVazio())
                setErro('')
                setResultado(null)
                setDiagramState({ uml: { status: 'idle', diagram: '', error: '' }, cloud: { status: 'idle', diagram: '', error: '' } })
                return
            }

            setLoadingProject(true)
            setErro('')

            try {
                const data = await apiFetch(`/api/projetos/${projectId}`)
                const projetoCarregado = normalizeProjeto(data)
                setCurrentProjectId(projetoCarregado.id || projectId)
                setProject(projetoCarregado)
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
        let isCurrent = true

        const renderDiagram = async (key, containerId, diagramText) => {
            if (!diagramText) {
                if (isCurrent) {
                    setDiagramState((prev) => ({ ...prev, [key]: { status: 'idle', diagram: '', error: '' } }))
                }
                return
            }

            if (isCurrent) {
                setDiagramState((prev) => ({ ...prev, [key]: { status: 'loading', diagram: '', error: '' } }))
            }

            try {
                const mermaid = await loadMermaid()
                const renderId = `${containerId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
                const { svg } = await mermaid.render(renderId, diagramText)

                if (!isCurrent) return

                const el = document.getElementById(containerId)
                if (el) el.innerHTML = svg

                setDiagramState((prev) => ({ ...prev, [key]: { status: 'success', diagram: svg, error: '' } }))
            } catch (error) {
                if (!isCurrent) return

                const message = error?.message || 'Erro ao renderizar o diagrama.'
                const el = document.getElementById(containerId)
                if (el) {
                    el.innerHTML = `<pre>${escapeHtml(diagramText)}</pre>`
                }

                setDiagramState((prev) => ({
                    ...prev,
                    [key]: {
                        status: 'error',
                        diagram: diagramText,
                        error: message,
                    },
                }))
            }
        }

        renderDiagram('uml', 'uml-diagram', resultado?.uml)
        renderDiagram('cloud', 'cloud-diagram', resultado?.cloud)

        return () => {
            isCurrent = false
        }
    }, [resultado])

    const atualizarProvedor = (valor) => {
        const tiposValidos = TIPOS_SERVICO[valor] || TIPOS_SERVICO.aws
        setProject((prev) => ({
            ...prev,
            provedorCloud: valor,
            servicosCloud: (prev.servicosCloud || []).map((servico) => (
                tiposValidos.includes(servico.tipo) ? servico : { ...servico, tipo: tiposValidos[0] || '' }
            )),
        }))
        setErro('Tipos incompatíveis foram ajustados para o provedor atual.')
    }

    const adicionarClasse = () => {
        setProject((prev) => ({ ...prev, classes: [...(prev.classes || []), { nome: '', atributos: [], metodos: [] }] }))
    }

    const atualizarClasse = (indice, campo, valor) => {
        setProject((prev) => {
            if (campo !== 'nome') {
                return { ...prev, classes: prev.classes.map((classe, index) => index === indice ? { ...classe, [campo]: valor } : classe) }
            }
            return renomearClasse(prev, indice, valor)
        })
    }

    const removerClasseLocal = (indice) => {
        setProject((prev) => removerClasse(prev, indice))
    }

    const adicionarAtributo = (classeIndex) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index === classeIndex ? {
                ...classe,
                atributos: [...(classe.atributos || []), { nome: '', tipo: TIPOS_ATRIBUTO[0] }],
            } : classe),
        }))
    }

    const atualizarAtributo = (classeIndex, atributoIndex, campo, valor) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index !== classeIndex ? classe : {
                ...classe,
                atributos: (classe.atributos || []).map((atributo, atributoPosicao) => (
                    atributoPosicao === atributoIndex ? { ...atributo, [campo]: valor } : atributo
                )),
            }),
        }))
    }

    const removerAtributo = (classeIndex, atributoIndex) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index === classeIndex ? {
                ...classe,
                atributos: (classe.atributos || []).filter((_, currentIndex) => currentIndex !== atributoIndex),
            } : classe),
        }))
    }

    const adicionarMetodo = (classeIndex) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index === classeIndex ? {
                ...classe,
                metodos: [...(classe.metodos || []), { nome: '', tipoRetorno: TIPOS_RETORNO[0] }],
            } : classe),
        }))
    }

    const atualizarMetodo = (classeIndex, metodoIndex, campo, valor) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index !== classeIndex ? classe : {
                ...classe,
                metodos: (classe.metodos || []).map((metodo, metodoPosicao) => (
                    metodoPosicao === metodoIndex ? { ...metodo, [campo]: valor } : metodo
                )),
            }),
        }))
    }

    const removerMetodo = (classeIndex, metodoIndex) => {
        setProject((prev) => ({
            ...prev,
            classes: prev.classes.map((classe, index) => index === classeIndex ? {
                ...classe,
                metodos: (classe.metodos || []).filter((_, currentIndex) => currentIndex !== metodoIndex),
            } : classe),
        }))
    }

    const adicionarRelacao = () => {
        setProject((prev) => ({ ...prev, relacoes: [...(prev.relacoes || []), { origem: '', destino: '', tipo: TIPOS_RELACAO[0] }] }))
    }

    const atualizarRelacao = (indice, campo, valor) => {
        setProject((prev) => ({
            ...prev,
            relacoes: prev.relacoes.map((relacao, index) => index === indice ? { ...relacao, [campo]: valor } : relacao),
        }))
    }

    const removerRelacao = (indice) => {
        setProject((prev) => ({ ...prev, relacoes: prev.relacoes.filter((_, index) => index !== indice) }))
    }

    const adicionarServico = () => {
        setProject((prev) => ({
            ...prev,
            servicosCloud: [...(prev.servicosCloud || []), { id: '', tipo: TIPOS_SERVICO[prev.provedorCloud || 'aws'][0], categoria: 'COMPUTE', configuracao: {} }],
        }))
    }

    const atualizarServico = (indice, campo, valor) => {
        setProject((prev) => ({
            ...prev,
            servicosCloud: prev.servicosCloud.map((servico, index) => index === indice ? { ...servico, [campo]: valor } : servico),
        }))
    }

    const removerServico = (indice) => {
        setProject((prev) => {
            const servicoRemovido = prev.servicosCloud[indice]
            return {
                ...prev,
                servicosCloud: prev.servicosCloud.filter((_, indexServico) => indexServico !== indice),
                conexoesCloud: (prev.conexoesCloud || []).filter((conexao) => conexao.de !== servicoRemovido?.id && conexao.para !== servicoRemovido?.id),
            }
        })
    }

    const adicionarLinhaConfiguracao = (servicoIndex) => {
        setProject((prev) => ({
            ...prev,
            servicosCloud: prev.servicosCloud.map((servico, index) => index === servicoIndex ? {
                ...servico,
                configuracao: { ...(servico.configuracao || {}), '': '' },
            } : servico),
        }))
    }

    const atualizarLinhaConfiguracao = (servicoIndex, chaveAntiga, valorChave, valorValor) => {
        setProject((prev) => ({
            ...prev,
            servicosCloud: prev.servicosCloud.map((servico, index) => {
                if (index !== servicoIndex) return servico
                const atual = { ...(servico.configuracao || {}) }
                if (chaveAntiga && chaveAntiga !== valorChave) delete atual[chaveAntiga]
                if (valorChave.trim()) atual[valorChave.trim()] = String(valorValor ?? '')
                return { ...servico, configuracao: atual }
            }),
        }))
    }

    const removerLinhaConfiguracao = (servicoIndex, chave) => {
        setProject((prev) => ({
            ...prev,
            servicosCloud: prev.servicosCloud.map((servico, index) => {
                if (index !== servicoIndex) return servico
                const atual = { ...(servico.configuracao || {}) }
                delete atual[chave]
                return { ...servico, configuracao: atual }
            }),
        }))
    }

    const adicionarConexao = () => {
        setProject((prev) => ({ ...prev, conexoesCloud: [...(prev.conexoesCloud || []), { de: '', para: '', rotulo: '' }] }))
    }

    const atualizarConexao = (indice, campo, valor) => {
        setProject((prev) => ({
            ...prev,
            conexoesCloud: prev.conexoesCloud.map((conexao, index) => index === indice ? { ...conexao, [campo]: valor } : conexao),
        }))
    }

    const removerConexao = (indice) => {
        setProject((prev) => ({ ...prev, conexoesCloud: prev.conexoesCloud.filter((_, index) => index !== indice) }))
    }

    const carregarExemplo = () => {
        setProject(normalizeProjeto(EXEMPLO_PROJETO))
        setErro('')
    }

    const salvar = async () => {
        const erros = validarProjeto(project)
        if (erros.length > 0) {
            setErro(erros.join(' • '))
            return
        }

        try {
            setErro('')
            setSaving(true)
            const payload = buildPayloadProjeto(project)
            const isCreate = currentProjectId === 'novo' || !currentProjectId
            const response = await apiFetch(isCreate ? '/api/projetos' : `/api/projetos/${currentProjectId}`, {
                method: isCreate ? 'POST' : 'PUT',
                body: payload,
            })

            if (response?.id) {
                setCurrentProjectId(response.id)
                onProjectSaved?.(response.id)
            }

            const gerado = await apiFetch(`/api/projetos/${response?.id || currentProjectId}/gerar`, { method: 'POST' })
            if (import.meta.env.DEV && gerado?.uml) {
                console.debug('[Editor] resposta.uml recebido do backend:', gerado.uml)
            }
            setResultado(gerado)
            setProject((prev) => ({ ...prev, ...(response || {}), id: response?.id || prev.id || currentProjectId }))
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

    const nomesClasses = (project.classes || []).map((classe) => classe.nome).filter(Boolean)
    const idsServicos = (project.servicosCloud || []).map((servico) => servico.id).filter(Boolean)

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
                        <button type="button" onClick={salvar} disabled={saving || problemas.length > 0}>{saving ? 'Salvando...' : 'Salvar e gerar'}</button>
                    </div>
                </div>

                {erro && <div className="error">{erro}</div>}
                {problemas.length > 0 && (
                    <div className="error list-error">
                        <strong>Problemas do formulário:</strong>
                        <ul>{problemas.map((problema) => <li key={problema}>{problema}</li>)}</ul>
                    </div>
                )}

                <div className="editor-layout">
                    <div className="editor-stack">
                        <fieldset>
                            <legend>Projeto</legend>
                            <div className="grid-2">
                                <label>
                                    Nome
                                    <input value={project.nome} onChange={(event) => setProject((prev) => ({ ...prev, nome: event.target.value }))} />
                                </label>
                                <label>
                                    Provedor
                                    <select value={project.provedorCloud} onChange={(event) => atualizarProvedor(event.target.value)}>
                                        <option value="aws">aws</option>
                                        <option value="oci">oci</option>
                                    </select>
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Classes</legend>
                            {(project.classes || []).map((classe, classeIndex) => (
                                <div key={`classe-${classeIndex}`} className="card-inside">
                                    <div className="grid-2">
                                        <label>
                                            Nome da classe
                                            <input value={classe.nome} onChange={(event) => atualizarClasse(classeIndex, 'nome', event.target.value)} />
                                        </label>
                                        <div className="actions end">
                                            <button type="button" className="muted" onClick={() => adicionarAtributo(classeIndex)}>Adicionar atributo</button>
                                            <button type="button" className="muted" onClick={() => adicionarMetodo(classeIndex)}>Adicionar método</button>
                                            <button type="button" className="danger" onClick={() => removerClasseLocal(classeIndex)}>Remover</button>
                                        </div>
                                    </div>

                                    <div className="nested-list">
                                        {(classe.atributos || []).map((atributo, atributoIndex) => (
                                            <div key={`atributo-${classeIndex}-${atributoIndex}`} className="row-grid">
                                                <input value={atributo.nome} placeholder="nome do atributo" onChange={(event) => atualizarAtributo(classeIndex, atributoIndex, 'nome', event.target.value)} />
                                                <select value={atributo.tipo} onChange={(event) => atualizarAtributo(classeIndex, atributoIndex, 'tipo', event.target.value)}>
                                                    {TIPOS_ATRIBUTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                                </select>
                                                <button type="button" className="danger" onClick={() => removerAtributo(classeIndex, atributoIndex)}>Remover</button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="nested-list">
                                        {(classe.metodos || []).map((metodo, metodoIndex) => (
                                            <div key={`metodo-${classeIndex}-${metodoIndex}`} className="row-grid">
                                                <input value={metodo.nome} placeholder="nome do método" onChange={(event) => atualizarMetodo(classeIndex, metodoIndex, 'nome', event.target.value)} />
                                                <select value={metodo.tipoRetorno} onChange={(event) => atualizarMetodo(classeIndex, metodoIndex, 'tipoRetorno', event.target.value)}>
                                                    {TIPOS_RETORNO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                                </select>
                                                <button type="button" className="danger" onClick={() => removerMetodo(classeIndex, metodoIndex)}>Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={adicionarClasse}>Adicionar classe</button>
                        </fieldset>

                        <fieldset>
                            <legend>Relações</legend>
                            {(project.relacoes || []).map((relacao, relacaoIndex) => (
                                <div key={`relacao-${relacaoIndex}`} className="card-inside row-grid">
                                    <select value={relacao.origem} onChange={(event) => atualizarRelacao(relacaoIndex, 'origem', event.target.value)}>
                                        <option value="">Origem</option>
                                        {nomesClasses.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                                    </select>
                                    <select value={relacao.destino} onChange={(event) => atualizarRelacao(relacaoIndex, 'destino', event.target.value)}>
                                        <option value="">Destino</option>
                                        {nomesClasses.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                                    </select>
                                    <select value={relacao.tipo} onChange={(event) => atualizarRelacao(relacaoIndex, 'tipo', event.target.value)}>
                                        <option value="">Tipo</option>
                                        {TIPOS_RELACAO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                    </select>
                                    <button type="button" className="danger" onClick={() => removerRelacao(relacaoIndex)}>Remover</button>
                                </div>
                            ))}
                            <button type="button" onClick={adicionarRelacao}>Adicionar relação</button>
                        </fieldset>

                        <fieldset>
                            <legend>Serviços cloud</legend>
                            {(project.servicosCloud || []).map((servico, servicoIndex) => (
                                <div key={`servico-${servicoIndex}`} className="card-inside">
                                    <div className="row-grid">
                                        <input value={servico.id} placeholder="id do serviço" onChange={(event) => atualizarServico(servicoIndex, 'id', event.target.value)} />
                                        <select value={servico.tipo} onChange={(event) => atualizarServico(servicoIndex, 'tipo', event.target.value)}>
                                            {(TIPOS_SERVICO[project.provedorCloud || 'aws'] || []).map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                        </select>
                                        <select value={servico.categoria} onChange={(event) => atualizarServico(servicoIndex, 'categoria', event.target.value)}>
                                            {['COMPUTE', 'DATA', 'STORAGE', 'NETWORK', 'API', 'MESSAGING', 'OBSERVABILITY'].map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
                                        </select>
                                        <button type="button" className="danger" onClick={() => removerServico(servicoIndex)}>Remover</button>
                                    </div>
                                    <div className="nested-list">
                                        {Object.entries(servico.configuracao || {}).map(([chave, valor]) => (
                                            <div key={`config-${servicoIndex}-${chave}`} className="row-grid">
                                                <input value={chave} onChange={(event) => atualizarLinhaConfiguracao(servicoIndex, chave, event.target.value, valor)} />
                                                <input value={valor} onChange={(event) => atualizarLinhaConfiguracao(servicoIndex, chave, chave, event.target.value)} />
                                                <button type="button" className="danger" onClick={() => removerLinhaConfiguracao(servicoIndex, chave)}>Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="muted" onClick={() => adicionarLinhaConfiguracao(servicoIndex)}>Adicionar linha de config</button>
                                </div>
                            ))}
                            <button type="button" onClick={adicionarServico}>Adicionar serviço</button>
                        </fieldset>

                        <fieldset>
                            <legend>Conexões</legend>
                            {(project.conexoesCloud || []).map((conexao, conexaoIndex) => (
                                <div key={`conexao-${conexaoIndex}`} className="card-inside row-grid">
                                    <select value={conexao.de} onChange={(event) => atualizarConexao(conexaoIndex, 'de', event.target.value)}>
                                        <option value="">De</option>
                                        {idsServicos.map((id) => <option key={id} value={id}>{id}</option>)}
                                    </select>
                                    <select value={conexao.para} onChange={(event) => atualizarConexao(conexaoIndex, 'para', event.target.value)}>
                                        <option value="">Para</option>
                                        {idsServicos.map((id) => <option key={id} value={id}>{id}</option>)}
                                    </select>
                                    <input value={conexao.rotulo} placeholder="rótulo" onChange={(event) => atualizarConexao(conexaoIndex, 'rotulo', event.target.value)} />
                                    <button type="button" className="danger" onClick={() => removerConexao(conexaoIndex)}>Remover</button>
                                </div>
                            ))}
                            <button type="button" onClick={adicionarConexao}>Adicionar conexão</button>
                        </fieldset>

                        <div className="actions">
                            <button type="button" onClick={carregarExemplo}>Carregar exemplo</button>
                        </div>

                        <details>
                            <summary>Ver JSON que será enviado</summary>
                            <pre>{JSON.stringify(buildPayloadProjeto(project), null, 2)}</pre>
                        </details>
                    </div>

                    <aside className="uml-panel">
                        <DiagramPanel
                            title="UML"
                            status={diagramState.uml.status}
                            diagram={diagramState.uml.diagram || resultado?.uml || ''}
                            error={diagramState.uml.error}
                            emptyMessage="A UML aparece aqui depois de Salvar e gerar."
                        />
                    </aside>
                </div>

                {resultado && (
                    <div className="resultado">
                        <p className="mini-note">V0 — versão inicial simples. Foco: validar o backend e o que ele gera.</p>
                        <div className="topline">
                            <h2>Resultado</h2>
                            <button type="button" onClick={baixarTudo}>Baixar tudo (.zip)</button>
                        </div>
                        <div className="diagrams">
                            <DiagramPanel
                                title="Cloud"
                                status={diagramState.cloud.status}
                                diagram={diagramState.cloud.diagram || resultado?.cloud || ''}
                                error={diagramState.cloud.error}
                                emptyMessage="O diagrama Cloud aparece aqui depois de Salvar e gerar."
                            />
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
