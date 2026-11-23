/*
 * Realce de sintaxe simples (estilo VS Code) para os arquivos gerados.
 * Retorna tokens { tipo, texto }; o componente os renderiza como <span>,
 * sem HTML injetado.
 */

const PALAVRAS = {
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public record return short static super switch synchronized this throw throws transient try var void volatile while true false null',
    hcl: 'resource variable output provider module data locals terraform true false null for in if',
    yaml: 'true false null yes no on off',
    mermaid: 'classDiagram flowchart graph class subgraph end direction LR TB TD RL BT classDef style',
    json: 'true false null',
}

const conjunto = (texto) => new Set(texto.split(/\s+/).filter(Boolean))
const CONJUNTOS = Object.fromEntries(Object.entries(PALAVRAS).map(([chave, texto]) => [chave, conjunto(texto)]))

// Cada regra: [tipo, expressão]. A ordem define a prioridade.
const REGRAS = {
    java: [
        ['comentario', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
        ['texto', /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
        ['anotacao', /@[A-Za-z_][\w.]*/y],
        ['numero', /\b\d+(?:\.\d+)?[lLfFdD]?\b/y],
        ['palavra', /[A-Za-z_$][\w$]*/y],
    ],
    hcl: [
        ['comentario', /#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
        ['texto', /"(?:\\.|[^"\\\n])*"/y],
        ['numero', /\b\d+(?:\.\d+)?\b/y],
        ['palavra', /[A-Za-z_][\w-]*/y],
    ],
    yaml: [
        ['comentario', /#[^\n]*/y],
        ['chave', /[A-Za-z_][\w.-]*(?=\s*:)/y],
        ['texto', /"(?:\\.|[^"\\\n])*"|'[^'\n]*'/y],
        ['variavel', /\$\{[^}\n]*\}/y],
        ['numero', /\b\d+(?:\.\d+)?\b/y],
        ['palavra', /[A-Za-z_][\w-]*/y],
    ],
    xml: [
        ['comentario', /<!--[\s\S]*?-->/y],
        ['tag', /<\/?[A-Za-z_][\w:.-]*|\/?>|<\?xml|\?>/y],
        ['texto', /"[^"\n]*"/y],
        ['atributo', /[A-Za-z_][\w:.-]*(?==)/y],
    ],
    mermaid: [
        ['comentario', /%%[^\n]*/y],
        ['texto', /"[^"\n]*"/y],
        ['operador', /-->|--|\.\.>|<\|--|\*--|o--|\|/y],
        ['palavra', /[A-Za-z_][\w]*/y],
    ],
    json: [
        ['chave', /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
        ['texto', /"(?:\\.|[^"\\\n])*"/y],
        ['numero', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
        ['palavra', /[A-Za-z_]\w*/y],
    ],
}

function classificarPalavra(linguagem, palavra) {
    if (CONJUNTOS[linguagem]?.has(palavra)) return 'palavraChave'
    if (linguagem === 'java' && /^[A-Z]/.test(palavra)) return 'tipo'
    return 'simples'
}

/** Divide o código em tokens coloríveis. Linguagem desconhecida → texto simples. */
export function tokenizar(codigo = '', linguagem = 'texto') {
    const regras = REGRAS[linguagem]
    const fonte = String(codigo ?? '')
    if (!regras) return [{ tipo: 'simples', texto: fonte }]

    const tokens = []
    let simples = ''
    let posicao = 0

    const empurrar = (tipo, texto) => {
        if (simples) {
            tokens.push({ tipo: 'simples', texto: simples })
            simples = ''
        }
        tokens.push({ tipo, texto })
    }

    while (posicao < fonte.length) {
        let casou = false
        for (const [tipo, expressao] of regras) {
            expressao.lastIndex = posicao
            const resultado = expressao.exec(fonte)
            if (resultado && resultado[0].length > 0) {
                const texto = resultado[0]
                const tipoFinal = tipo === 'palavra' ? classificarPalavra(linguagem, texto) : tipo
                if (tipoFinal === 'simples') simples += texto
                else empurrar(tipoFinal, texto)
                posicao += texto.length
                casou = true
                break
            }
        }
        if (!casou) {
            simples += fonte[posicao]
            posicao += 1
        }
    }

    if (simples) tokens.push({ tipo: 'simples', texto: simples })
    return tokens
}

/** Agrupa os tokens por linha (tokens que atravessam linhas são divididos). */
export function tokensPorLinha(codigo = '', linguagem = 'texto') {
    const linhas = [[]]
    for (const token of tokenizar(codigo, linguagem)) {
        const partes = token.texto.split('\n')
        partes.forEach((parte, indice) => {
            if (indice > 0) linhas.push([])
            if (parte) linhas.at(-1).push({ tipo: token.tipo, texto: parte })
        })
    }
    return linhas
}
