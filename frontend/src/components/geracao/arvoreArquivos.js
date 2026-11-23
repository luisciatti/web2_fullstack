import { normalizarCaminho } from '../../utils/downloadZip.js'

// Pasta de cada camada do código Java gerado pelo back-end.
const PASTAS_JAVA = {
    JAVA_MODEL: 'src/main/java/model',
    JAVA_DAO: 'src/main/java/repositorio',
    JAVA_SERVICE: 'src/main/java/servico',
    JAVA_CONTROLLER: 'src/main/java/controlador',
}

/** Caminho exibido no explorador para um artefato gerado. */
export function caminhoNoProjeto(artefato) {
    const caminho = normalizarCaminho(artefato?.nome)
    if (!caminho) return ''
    if (caminho.includes('/')) return caminho

    const tipo = String(artefato?.tipo || '').toUpperCase()
    const nome = caminho
    const minusculo = nome.toLowerCase()

    if (PASTAS_JAVA[tipo]) return `${PASTAS_JAVA[tipo]}/${nome}`
    if (minusculo === 'pom.xml') return nome
    if (minusculo.endsWith('.java')) return `src/main/java/${nome}`
    if (/^application\.(ya?ml|properties)$/.test(minusculo)) return `src/main/resources/${nome}`
    if (minusculo.endsWith('.tf')) return `infra/terraform/${nome}`
    if (minusculo.endsWith('.yaml') || minusculo.endsWith('.yml')) return `infra/k8s/${nome}`
    if (tipo === 'DIAGRAM' || minusculo.endsWith('.mmd')) return `docs/${nome}`
    return nome
}

/** Lista de arquivos com caminho único, na ordem recebida. */
export function listarArquivos(artefatos = []) {
    const usados = new Set()
    const arquivos = []

    for (const artefato of Array.isArray(artefatos) ? artefatos : []) {
        const base = caminhoNoProjeto(artefato)
        if (!base) continue

        let caminho = base
        for (let sufixo = 2; usados.has(caminho.toLowerCase()); sufixo++) {
            const ponto = base.lastIndexOf('.')
            caminho = ponto > base.lastIndexOf('/')
                ? `${base.slice(0, ponto)} (${sufixo})${base.slice(ponto)}`
                : `${base} (${sufixo})`
        }
        usados.add(caminho.toLowerCase())

        arquivos.push({
            caminho,
            nome: caminho.split('/').pop(),
            conteudo: artefato?.conteudo ?? '',
            tipo: artefato?.tipo || '',
        })
    }

    return arquivos
}

/**
 * Monta a árvore de pastas: { pastas: [{ nome, caminho, pastas, arquivos }], arquivos: [...] }.
 * Pastas vêm antes de arquivos, ambas em ordem alfabética.
 */
export function montarArvore(arquivos = []) {
    const raiz = { nome: '', caminho: '', pastas: new Map(), arquivos: [] }

    for (const arquivo of arquivos) {
        const partes = arquivo.caminho.split('/')
        let atual = raiz
        for (const [indice, parte] of partes.slice(0, -1).entries()) {
            if (!atual.pastas.has(parte)) {
                atual.pastas.set(parte, {
                    nome: parte,
                    caminho: partes.slice(0, indice + 1).join('/'),
                    pastas: new Map(),
                    arquivos: [],
                })
            }
            atual = atual.pastas.get(parte)
        }
        atual.arquivos.push(arquivo)
    }

    const ordenar = (no) => ({
        ...no,
        pastas: [...no.pastas.values()]
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map(ordenar),
        arquivos: [...no.arquivos].sort((a, b) => a.nome.localeCompare(b.nome)),
    })

    return ordenar(raiz)
}

const LINGUAGENS = [
    [/\.java$/i, 'java', 'Java'],
    [/\.(xml|pom)$/i, 'xml', 'XML'],
    [/\.ya?ml$/i, 'yaml', 'YAML'],
    [/\.tf$/i, 'hcl', 'Terraform'],
    [/\.mmd$/i, 'mermaid', 'Mermaid'],
    [/\.json$/i, 'json', 'JSON'],
    [/\.md$/i, 'markdown', 'Markdown'],
]

export function linguagemDoArquivo(caminho = '') {
    const encontrada = LINGUAGENS.find(([padrao]) => padrao.test(caminho))
    return encontrada
        ? { id: encontrada[1], nome: encontrada[2] }
        : { id: 'texto', nome: 'Texto' }
}

/** Primeiro arquivo a abrir: a primeira classe de modelo, ou o primeiro da lista. */
export function arquivoInicial(arquivos = []) {
    return arquivos.find((arquivo) => arquivo.caminho.startsWith('src/main/java/model/'))
        || arquivos.find((arquivo) => arquivo.caminho.endsWith('.java'))
        || arquivos[0]
        || null
}
