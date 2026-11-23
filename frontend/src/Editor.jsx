import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import EditorUmlSlot from './components/editor/EditorUmlSlot.jsx'
import ClassManager from './components/editor/ClassManager.jsx'
import AttributeEditor, { TIPOS_ATRIBUTO } from './components/editor/AttributeEditor.jsx'
import MethodEditor, { TIPOS_RETORNO } from './components/editor/MethodEditor.jsx'
import { TIPOS_RELACAO } from './components/editor/RelationsEditor.jsx'
import ClassRelationsEditor from './components/editor/ClassRelationsEditor.jsx'
import CloudServicesPanel from './components/cloud/CloudServicesPanel.jsx'
import CloudConnectionsPanel from './components/cloud/CloudConnectionsPanel.jsx'
import CloudPreview from './components/cloud/CloudPreview.jsx'
import { gerarMermaidCloud } from './diagramas/gerarMermaidCloud.js'
import CodeWorkspace from './components/geracao/CodeWorkspace.jsx'
import BotaoTema from './tema/BotaoTema.jsx'
import { useTema } from './tema/tema.js'
import { gerarProjetoExemplo, projetoTemConteudo } from './exemploProjeto.js'
import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import './Editor.css'
import { apiFetch, clearAuth } from './api.js'

const TIPOS_SERVICO = {
    aws: ['VPC', 'EC2', 'ASG', 'ALB', 'RDS', 'S3', 'LAMBDA', 'SQS', 'SNS', 'CLOUDWATCH', 'DYNAMODB'],
    oci: ['VCN', 'INSTANCE', 'DATABASE', 'OBJECT_STORAGE', 'LOAD_BALANCER'],
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
    const nomeFinal = String(nomeNovo ?? '')
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

        if (!origem || !destino || !tipo) {
            erros.push('Há uma relação incompleta.')
            continue
        }

        if (!nomesClasses.has(origem) || !nomesClasses.has(destino)) {
            erros.push(
                `Relação inválida: "${origem}" ou "${destino}" não corresponde a uma classe do projeto.`
            )
        }

        if (!TIPOS_RELACAO.includes(tipo)) {
            erros.push(`Tipo de relação inválido: "${tipo}".`)
        }
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
            mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
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
export async function persistirProjeto(projeto, projectId, request = apiFetch) {
    const isCreate = projectId === 'novo' || !projectId

    const response = await request(
        isCreate ? '/api/projetos' : `/api/projetos/${projectId}`,
        {
            method: isCreate ? 'POST' : 'PUT',
            body: buildPayloadProjeto(projeto),
        }
    )

    if (isCreate && !response?.id) {
        throw new Error(
            'O servidor não retornou o ID do projeto criado.'
        )
    }

    return {
        id: response?.id || projectId,
        isCreate,
    }
}

export default function Editor({ projectId, onBack, onLogout, onProjectSaved }) {
    const [project, setProject] = useState(createProjetoVazio())
    const [selectedClassIndex, setSelectedClassIndex] = useState(0)
    const [erro, setErro] = useState('')
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [snapshotSalvo, setSnapshotSalvo] = useState(null)
    const [snapshotErroSalvar, setSnapshotErroSalvar] = useState(null)
    const ultimoProjectIdTratadoRef = useRef(null)
    const idCriadoLocalmenteRef = useRef(null)
    const nomeClasseInputRef = useRef(null)
    const deveFocarNomeClasseRef = useRef(false)
    const nomeProjetoInputRef = useRef(null)
    const [visao, setVisao] = useState('uml')
    const [ideAberta, setIdeAberta] = useState(false)
    const tema = useTema()
    const [resultado, setResultado] = useState(null)
    const [loadingProject, setLoadingProject] = useState(false)
    const [currentProjectId, setCurrentProjectId] = useState(projectId)
    const [, setDiagramState] = useState({ uml: { status: 'idle', diagram: '', error: '' }, cloud: { status: 'idle', diagram: '', error: '' } })

    const problemas = useMemo(() => validarProjeto(project), [project])
    const snapshotAtual = useMemo(
        () => JSON.stringify(buildPayloadProjeto(project)),
        [project]
    )

    const temAlteracoesNaoSalvas =
    snapshotSalvo === null || snapshotAtual !== snapshotSalvo

    const houveErroNesteEstado =
    snapshotErroSalvar !== null &&
    snapshotErroSalvar === snapshotAtual

    const statusSalvamento = saving
    ? 'Salvando...'
    : houveErroNesteEstado
        ? 'Erro ao salvar'
        : temAlteracoesNaoSalvas
            ? 'Alterações não salvas'
            : 'Salvo'
    const isNovo = currentProjectId === 'novo' || projectId === 'novo'

    useEffect(() => {
        if (!deveFocarNomeClasseRef.current) return

        deveFocarNomeClasseRef.current = false
        nomeClasseInputRef.current?.focus()
    }, [project.classes.length])

    useEffect(() => {
        if (ultimoProjectIdTratadoRef.current === projectId) return

        ultimoProjectIdTratadoRef.current = projectId

        if (idCriadoLocalmenteRef.current === projectId) {
            idCriadoLocalmenteRef.current = null
            return
        }

        const carregar = async () => {
        if (projectId === 'novo') {
            setCurrentProjectId('novo')
            setProject(createProjetoVazio())
            setSnapshotSalvo(null)
            setSnapshotErroSalvar(null)
            setSelectedClassIndex(0)
                setErro('')
                setResultado(null)
                setDiagramState({ uml: { status: 'idle', diagram: '', error: '' }, cloud: { status: 'idle', diagram: '', error: '' } })
                return
            }

            setLoadingProject(true)
            setErro('')
            setSnapshotSalvo(null)
            setSnapshotErroSalvar(null)

            try {
                const data = await apiFetch(`/api/projetos/${projectId}`)
                const projetoCarregado = normalizeProjeto(data)

                setCurrentProjectId(projetoCarregado.id || projectId)
                setProject(projetoCarregado)

                setSnapshotSalvo(
                    JSON.stringify(buildPayloadProjeto(projetoCarregado))
                )
                setSnapshotErroSalvar(null)
                setSelectedClassIndex(0)
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

        renderDiagram('cloud', 'cloud-diagram', resultado?.cloud)

        return () => {
            isCurrent = false
        }
    }, [resultado])

    const adicionarClasse = () => {
        deveFocarNomeClasseRef.current = true
        setSelectedClassIndex(project.classes?.length || 0)

        setProject((prev) => ({
            ...prev,
            classes: [
                ...(prev.classes || []),
                {
                    nome: '',
                    atributos: [],
                    metodos: []
                }
            ]
        }))
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
        const classe = project.classes?.[indice]
        if (!classe) return

        const nome = classe.nome.trim() || `Classe ${indice + 1}`

        if (!window.confirm(`Excluir a classe "${nome}" e suas relações?`)) {
            return
        }

        setProject((prev) => removerClasse(prev, indice))

        setSelectedClassIndex((prev) => {
            const proximo = prev > indice ? prev - 1 : prev
            return Math.min(
                proximo,
                Math.max(0, project.classes.length - 2)
            )
        })
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

    const adicionarRelacaoDaClasse = (nomeOrigem) => {
        if (!nomeOrigem) return
        setProject((prev) => {
            const outras = (prev.classes || [])
                .map((classe) => String(classe.nome || '').trim())
                .filter((nome) => nome && nome !== nomeOrigem)
            return {
                ...prev,
                relacoes: [
                    ...(prev.relacoes || []),
                    { origem: nomeOrigem, destino: outras[0] || nomeOrigem, tipo: TIPOS_RELACAO[0] },
                ],
            }
        })
    }

    const irParaDiagrama = (novaVisao = 'uml') => {
        setVisao(novaVisao)
        requestAnimationFrame(() => {
            document.getElementById('editor-diagrama')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
        })
    }

    const focarNomeProjeto = () => {
        nomeProjetoInputRef.current?.focus()
        nomeProjetoInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
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

    const adicionarConexao = () => {
        setProject((prev) => ({ ...prev, conexoesCloud: [...(prev.conexoesCloud || []), { de: '', para: '', rotulo: '' }] }))
    }

    const gerarExemplo = () => {
        if (
            projetoTemConteudo(project) &&
            typeof window !== 'undefined' &&
            !window.confirm('Substituir as classes e a arquitetura atuais pelo projeto de exemplo?')
        ) {
            return
        }

        setProject((prev) => normalizeProjeto(gerarProjetoExemplo({
            nome: prev.nome,
            provedorCloud: prev.provedorCloud,
        })))
        setSelectedClassIndex(0)
        setErro('')
    }

    const salvarProjeto = async () => {
        if (saving) return

        const erros = validarProjeto(project)

        if (erros.length > 0) {
            setErro(erros.join(' • '))
            setSnapshotErroSalvar(snapshotAtual)
            return
        }

        const payload = buildPayloadProjeto(project)
        const snapshotEnviado = JSON.stringify(payload)

        const isCreate =
            currentProjectId === 'novo' || !currentProjectId

        try {
            setErro('')
            setSnapshotErroSalvar(null)
            setSaving(true)

            const { id: idSalvo } = await persistirProjeto(
                project,
                currentProjectId
            )

            if (isCreate) {
                idCriadoLocalmenteRef.current = idSalvo
                setCurrentProjectId(idSalvo)
            }

            setProject((prev) =>
                prev.id === idSalvo
                    ? prev
                    : { ...prev, id: idSalvo }
            )

            setSnapshotSalvo(snapshotEnviado)
            setSnapshotErroSalvar(null)

            if (isCreate) {
                onProjectSaved?.(idSalvo)
            }
        } catch (err) {
            setErro(err.message || 'Não foi possível salvar o projeto.')
            setSnapshotErroSalvar(snapshotEnviado)

            if (err.message === 'Sessão expirada. Entre novamente.') {
                clearAuth()
                onLogout()
            }
        } finally {
            setSaving(false)
        }
    }
    const gerarCodigo = async () => {
        if (saving || generating) return

        if (
            !currentProjectId ||
            currentProjectId === 'novo' ||
            temAlteracoesNaoSalvas
        ) {
            setErro('Salve as alterações antes de gerar código.')
            return
        }

        const erros = validarProjeto(project)

        if (erros.length > 0) {
            setErro(erros.join(' • '))
            return
        }

        try {
            setErro('')
            setGenerating(true)

            const gerado = await apiFetch(
                `/api/projetos/${currentProjectId}/gerar`,
                { method: 'POST' }
            )

            setResultado(gerado)
            setIdeAberta(true)
        } catch (err) {
            setErro(err.message || 'Não foi possível gerar código.')

            if (err.message === 'Sessão expirada. Entre novamente.') {
                clearAuth()
                onLogout()
            }
        } finally {
            setGenerating(false)
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


    const classes = project.classes || []

    const selectedIndex = Math.min(
        selectedClassIndex,
        Math.max(0, classes.length - 1)
    )

    const selectedClass = classes[selectedIndex] || null

    if (loadingProject) {
        return (
            <div className="shell editor-fe15">
                <div className="card wide editor-fe15__container">
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
    <div className="shell editor-fe15">
        <div className="card wide editor-fe15__container">
            <header className="editor-fe15__header">
                <div className="editor-fe15__brand">
                    <DiagramCodeLogo />
                </div>

                <div className="editor-fe15__breadcrumb">
                    <button type="button" onClick={onBack}>
                        Meus projetos
                    </button>

                    <span aria-hidden="true">/</span>

                    <input
                        ref={nomeProjetoInputRef}
                        type="text"
                        className={`editor-fe15__project-name${String(project.nome || '').trim() ? '' : ' is-invalid'}`}
                        aria-label="Nome do projeto"
                        aria-invalid={!String(project.nome || '').trim()}
                        placeholder="Dê um nome ao projeto"
                        autoFocus={isNovo && !project.nome}
                        value={project.nome}
                        onChange={(event) =>
                            setProject((prev) => ({
                                ...prev,
                                nome: event.target.value
                            }))
                        }
                    />
                </div>

                <span
                    className="editor-fe15__status"
                    role="status"
                    aria-live="polite"
                >
                    <span
                        className={`editor-fe15__status-dot${
                            !saving && !temAlteracoesNaoSalvas && !houveErroNesteEstado
                                ? ' is-saved'
                                : ''
                        }`}
                    />
                    {statusSalvamento}
                </span>

                <div className="editor-fe15__actions">
                    <BotaoTema />

                    {resultado?.artefatos?.length > 0 && (
                        <button
                            type="button"
                            className="editor-fe15__export"
                            onClick={() => setIdeAberta(true)}
                            title="Abrir o último código gerado"
                        >
                            {'</>'} Ver código
                        </button>
                    )}

                    <button
                        type="button"
                        className="editor-fe15__export"
                        onClick={baixarTudo}
                        disabled={!resultado?.artefatos?.length}
                    >
                        Exportar
                    </button>

                    <button
                        type="button"
                        className="editor-fe15__export"
                        onClick={salvarProjeto}
                        disabled={saving || problemas.length > 0}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>

                    <button
                        type="button"
                        className="editor-fe15__generate"
                        onClick={gerarCodigo}
                        disabled={
                            saving ||
                            generating ||
                            temAlteracoesNaoSalvas ||
                            problemas.length > 0
                        }
                        title={
                            temAlteracoesNaoSalvas
                                ? 'Salve as alterações antes de gerar código'
                                : 'Gerar código do projeto salvo'
                        }
                    >
                        {generating ? 'Gerando...' : 'Gerar código'}
                    </button>
                </div>
            </header>

            <div className="editor-fe15__toolbar">
                <h2>{visao === 'cloud' ? 'Arquitetura Cloud' : 'Diagrama de classes'}</h2>

                {visao === 'uml' ? (
                <div className="editor-fe15__tools">
                    <button
                        type="button"
                        className="editor-fe15__tool-primary"
                        onClick={adicionarClasse}
                    >
                        + Classe
                    </button>

                    <button
                        type="button"
                        onClick={() => adicionarAtributo(selectedIndex)}
                        disabled={!selectedClass}
                    >
                        + Atributo
                    </button>

                    <button
                        type="button"
                        onClick={() => adicionarMetodo(selectedIndex)}
                        disabled={!selectedClass}
                    >
                        + Método
                    </button>

                    <button
                        type="button"
                        onClick={() => adicionarRelacaoDaClasse(String(selectedClass?.nome || '').trim())}
                        disabled={!String(selectedClass?.nome || '').trim()}
                        title="Relacionar a classe selecionada com outra"
                    >
                        + Relação
                    </button>
                </div>
                ) : (
                <div className="editor-fe15__tools">
                    <button
                        type="button"
                        className="editor-fe15__tool-primary"
                        onClick={adicionarServico}
                    >
                        + Serviço
                    </button>

                    <button
                        type="button"
                        onClick={adicionarConexao}
                        disabled={(project.servicosCloud || []).length < 2}
                        title="Conecte dois serviços"
                    >
                        + Conexão
                    </button>
                </div>
                )}

                <button
                    type="button"
                    className="editor-fe15__example"
                    onClick={gerarExemplo}
                    title="Preenche o projeto com uma loja virtual completa: classes Java, relações e arquitetura cloud"
                >
                    ✨ Gerar exemplo
                </button>

                <button
                    type="button"
                    className="editor-fe15__preview-link"
                    onClick={() => irParaDiagrama(visao)}
                >
                    {visao === 'cloud' ? '☁ Visualizar Cloud' : '▤ Visualizar UML'}
                </button>
            </div>

                {erro && <div className="error">{erro}</div>}
                {problemas.length > 0 && (
                    <div className="error list-error">
                        <strong>Problemas do formulário:</strong>
                        <ul>{problemas.map((problema) => (
                            <li key={problema}>
                                {problema}
                                {problema === 'O nome do projeto é obrigatório.' && (
                                    <>
                                        {' '}
                                        <button type="button" className="editor-fe15__fix-link" onClick={focarNomeProjeto}>
                                            Preencher nome
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}</ul>
                    </div>
                )}

            <div className={`editor-fe15__workspace${visao === 'cloud' ? ' is-cloud' : ''}`}>
            <aside
                className="editor-fe15__panel editor-fe15__structure"
                aria-label="Estrutura de classes"
            >
                <p className="editor-fe15__caption">
                    ESTRUTURA DO PROJETO
                </p>

                <strong className="editor-fe15__project-title">
                    ▾ {project.nome || 'Novo projeto'}
                </strong>

                <ClassManager
                    classes={classes}
                    selectedIndex={selectedIndex}
                    onChange={setSelectedClassIndex}
                />

                <div className="editor-fe15__diagram-nav">
                    <p className="editor-fe15__caption">
                        DIAGRAMAS
                    </p>

                    <button
                        type="button"
                        className={`editor-fe15__nav-link${visao === 'uml' ? ' is-active' : ''}`}
                        aria-pressed={visao === 'uml'}
                        onClick={() => irParaDiagrama('uml')}
                    >
                        ▦ Diagrama de classes
                    </button>

                    <button
                        type="button"
                        className={`editor-fe15__nav-link${visao === 'cloud' ? ' is-active' : ''}`}
                        aria-pressed={visao === 'cloud'}
                        onClick={() => irParaDiagrama('cloud')}
                    >
                        ☁ Visualização Cloud
                    </button>
                </div>

                <button
                    type="button"
                    className="editor-fe15__secondary"
                    onClick={adicionarClasse}
                >
                    + Adicionar classe
                </button>
            </aside>

                <section
                    className="editor-fe15__panel editor-fe15__canvas"
                    id="editor-diagrama"
                    aria-label="Área do diagrama"
                >
                    {visao === 'uml' ? (
                        <>
                            <div className="editor-fe15__panel-title">
                                <h2>Diagrama UML</h2>
                                <span>Prévia</span>
                            </div>

                            <EditorUmlSlot
                                projeto={project}
                                classes={classes}
                                selectedIndex={selectedIndex}
                            />
                        </>
                    ) : (
                        <div className="editor-fe15__cloud">
                            <div className="editor-fe15__panel-title">
                                <h2>Diagrama Cloud</h2>
                                <span>Prévia</span>
                            </div>

                            <CloudPreview
                                codigoMermaid={gerarMermaidCloud(project, { tema })}
                                titulo="Visualização da arquitetura"
                                descricao="Atualiza enquanto você edita os serviços e as conexões."
                                mensagemVazio={(project.servicosCloud || []).length
                                    ? 'Preencha o identificador dos serviços para vê-los no diagrama.'
                                    : 'Adicione um serviço para visualizar a arquitetura cloud.'}
                            />

                            <div className="editor-fe15__cloud-panels">
                                <CloudServicesPanel projeto={project} onChange={setProject} />
                                <CloudConnectionsPanel projeto={project} onChange={setProject} />
                            </div>
                        </div>
                    )}
                </section>

                {visao === 'uml' && (
                <aside
                    className="editor-fe15__panel editor-fe15__inspector"
                    aria-label="Propriedades da classe"
                >
                    <div className="editor-fe15__panel-title">
                        <h2>Propriedades</h2>
                    </div>

                    {!selectedClass ? (
                        <p className="editor-fe15__empty">
                            Adicione ou selecione uma classe para começar.
                        </p>
                    ) : (
                        <div className="editor-fe15__inspector-body">
                            <label>
                                Nome da classe
                                <input
                                    ref={nomeClasseInputRef}
                                    value={selectedClass.nome}
                                    onChange={(event) =>
                                        atualizarClasse(
                                            selectedIndex,
                                            'nome',
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <AttributeEditor
                                atributos={selectedClass.atributos}
                                onAdd={() => adicionarAtributo(selectedIndex)}
                                onUpdate={(indice, campo, valor) =>
                                    atualizarAtributo(selectedIndex, indice, campo, valor)
                                }
                                onRemove={(indice) =>
                                    removerAtributo(selectedIndex, indice)
                                }
                            />

                            <MethodEditor
                                metodos={selectedClass.metodos}
                                onAdd={() => adicionarMetodo(selectedIndex)}
                                onUpdate={(indice, campo, valor) =>
                                    atualizarMetodo(selectedIndex, indice, campo, valor)
                                }
                                onRemove={(indice) =>
                                    removerMetodo(selectedIndex, indice)
                                }
                            />

                            <ClassRelationsEditor
                                classe={selectedClass}
                                classes={classes}
                                relacoes={project.relacoes || []}
                                onAdd={adicionarRelacaoDaClasse}
                                onUpdate={atualizarRelacao}
                                onRemove={removerRelacao}
                            />

                            <button
                                type="button"
                                className="editor-fe15__remove-class"
                                onClick={() => removerClasseLocal(selectedIndex)}
                            >
                                Excluir classe
                            </button>
                        </div>
                    )}
                </aside>
                )}
            </div>

            <details className="editor-fe15__json">
                <summary>Ver JSON que será enviado</summary>
                <pre>{JSON.stringify(buildPayloadProjeto(project), null, 2)}</pre>
            </details>

                <CodeWorkspace
                    aberto={ideAberta && Boolean(resultado)}
                    resultado={resultado}
                    nomeProjeto={project.nome}
                    onFechar={() => setIdeAberta(false)}
                    onBaixar={baixarTudo}
                />
            </div>
        </div>
    )
}
