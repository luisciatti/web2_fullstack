const lista = (valor) => Array.isArray(valor) ? valor : []
const texto = (valor) => typeof valor === 'string' ? valor.trim() : ''

// Remove caracteres que quebrariam a sintaxe do Mermaid nos rótulos.
function textoSeguro(valor) {
    return texto(valor)
        .replace(/[^\p{L}\p{N}_ .:-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// ID estável e seguro, independente dos caracteres do identificador original.
function identificador(id) {
    return `Servico_${Array.from(id)
        .map((caractere) => caractere.codePointAt(0).toString(16))
        .join('_')}`
}

/**
 * Serializa os serviços e conexões cloud do projeto em um flowchart Mermaid,
 * no mesmo formato do diagrama gerado pelo back-end (tipo + id em cada nó).
 * Serviços sem id ou com id duplicado e conexões incompletas são ignorados.
 */
export function gerarMermaidCloud(projeto = {}) {
    const linhas = ['flowchart LR']
    const contagem = new Map()

    for (const servico of lista(projeto?.servicosCloud)) {
        const id = texto(servico?.id)
        if (id) contagem.set(id, (contagem.get(id) || 0) + 1)
    }

    const ids = new Set()
    for (const servico of lista(projeto?.servicosCloud)) {
        const id = texto(servico?.id)
        if (!id || contagem.get(id) > 1 || ids.has(id)) continue
        ids.add(id)

        const tipo = textoSeguro(servico?.tipo) || 'Serviço'
        linhas.push(`    ${identificador(id)}["${tipo}<br/>${textoSeguro(id) || 'serviço'}"]`)
    }

    for (const conexao of lista(projeto?.conexoesCloud)) {
        const de = texto(conexao?.de)
        const para = texto(conexao?.para)
        if (!ids.has(de) || !ids.has(para)) continue

        const rotulo = textoSeguro(conexao?.rotulo)
        linhas.push(rotulo
            ? `    ${identificador(de)} -->|"${rotulo}"| ${identificador(para)}`
            : `    ${identificador(de)} --> ${identificador(para)}`)
    }

    return linhas.join('\n')
}
