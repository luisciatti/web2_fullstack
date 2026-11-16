const CARDINALIDADES = new Map([
    ['ONE_TO_ONE', ['1', '1']],
    ['ONE_TO_MANY', ['1', '*']],
    ['MANY_TO_ONE', ['*', '1']],
    ['MANY_TO_MANY', ['*', '*']],
])

const lista = (valor) => Array.isArray(valor) ? valor : []
const texto = (valor) => typeof valor === 'string' ? valor.trim() : ''

// Somente a apresentação é sanitizada; as relações usam os nomes originais.
function textoSeguro(valor) {
    return texto(valor)
        .replace(/[^\p{L}\p{N}_ ]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// A codificação evita colisões e mantém o ID independente da ordem das classes.
function identificador(nome) {
    return `Classe_${Array.from(nome)
        .map((caractere) => caractere.codePointAt(0).toString(16))
        .join('_')}`
}

/** Serializa o modelo local sem modificá-lo ou executar efeitos externos. */
export function gerarMermaidUml(projeto = {}) {
    const linhas = ['classDiagram']
    const classesPorNome = new Map()

    for (const classe of lista(projeto?.classes)) {
        const nomeOriginal = texto(classe?.nome)
        const nomeExibido = textoSeguro(nomeOriginal)
        if (!nomeExibido || classesPorNome.has(nomeOriginal)) continue

        const id = identificador(nomeOriginal)
        classesPorNome.set(nomeOriginal, id)
        linhas.push(`    class ${id}["${nomeExibido}"]`)

        for (const atributo of lista(classe?.atributos)) {
            const nome = textoSeguro(atributo?.nome)
            const tipo = textoSeguro(atributo?.tipo)
            if (!nome) continue
            linhas.push(`    ${id} : ${tipo ? `${nome}: ${tipo}` : nome}`)
        }

        for (const metodo of lista(classe?.metodos)) {
            const nome = textoSeguro(metodo?.nome)
            const retorno = textoSeguro(texto(metodo?.tipoRetorno) || metodo?.tipo)
            if (!nome) continue
            linhas.push(`    ${id} : ${nome}()${retorno ? ` ${retorno}` : ''}`)
        }
    }

    for (const relacao of lista(projeto?.relacoes)) {
        const origem = classesPorNome.get(texto(relacao?.origem))
        const destino = classesPorNome.get(texto(relacao?.destino))
        const cardinalidades = CARDINALIDADES.get(texto(relacao?.tipo))
        if (!origem || !destino || !cardinalidades) continue

        const [quantidadeOrigem, quantidadeDestino] = cardinalidades
        linhas.push(`    ${origem} "${quantidadeOrigem}" -- "${quantidadeDestino}" ${destino}`)
    }

    return linhas.join('\n')
}
