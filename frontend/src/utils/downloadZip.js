import JSZip from 'jszip'

const PASTA_PROJETO = /(?:^|\/)(src\/main\/(?:java|resources)|infra|docs)\//
const NOME_RESERVADO = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i

export function normalizarCaminho(nome) {
    if (typeof nome !== 'string') return ''
    const caminho = nome.trim().replace(/\\/g, '/').replace(/^[a-z]:/i, '')
    const segmentos = caminho.split('/').map((parte) => parte.trim())
    if (!segmentos.at(-1)?.replace(/\./g, '')) return ''

    const partes = segmentos
        .filter((parte) => parte && parte !== '.' && parte !== '..')
        .map((parte) => parte.replace(/[<>:"|?*\p{Cc}]/gu, '_').replace(/[. ]+$/g, ''))
        .filter(Boolean)
        .map((parte) => NOME_RESERVADO.test(parte) ? `_${parte}` : parte)
    if (partes.at(-1) === 'pom.xml') return 'pom.xml'

    const relativo = partes.join('/')
    const pasta = PASTA_PROJETO.exec(relativo)
    return pasta ? relativo.slice(pasta.index + Number(pasta[0].startsWith('/'))) : relativo
}

const chave = (caminho) => caminho.normalize('NFC').toLowerCase()

function prepararArquivos(artefatos) {
    const arquivos = artefatos.map((artefato) => ({
        caminho: normalizarCaminho(artefato?.nome),
        conteudo: artefato?.conteudo ?? '',
    })).filter(({ caminho }) => caminho)
    const ocupados = new Set()
    for (const { caminho } of arquivos) {
        for (let i = caminho.indexOf('/'); i !== -1; i = caminho.indexOf('/', i + 1)) {
            ocupados.add(chave(caminho.slice(0, i)))
        }
    }

    return arquivos.map(({ caminho, conteudo }) => {
        const ultimoPonto = caminho.lastIndexOf('.')
        const posicaoExtensao = ultimoPonto > caminho.lastIndexOf('/') + 1 ? ultimoPonto : caminho.length
        const base = caminho.slice(0, posicaoExtensao)
        const extensao = caminho.slice(posicaoExtensao)
        let destino = caminho
        for (let sufixo = 2; ocupados.has(chave(destino)); sufixo++) {
            destino = `${base} (${sufixo})${extensao}`
        }
        ocupados.add(chave(destino))
        return { destino, conteudo }
    })
}

export async function criarZip(artefatos) {
    const arquivos = prepararArquivos(artefatos)
    if (!arquivos.length) throw new Error('Nenhum artefato tem um nome válido para o ZIP.')

    const zip = new JSZip()
    for (const { destino, conteudo } of arquivos) {
        zip.file(destino, conteudo, { createFolders: false })
    }
    return zip.generateAsync({ type: 'blob' })
}

export async function baixarZip(artefatos) {
    const blob = await criarZip(artefatos)
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    try {
        link.href = url
        link.download = 'projeto-gerado.zip'
        document.body.appendChild(link)
        link.click()
    } finally {
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
}
