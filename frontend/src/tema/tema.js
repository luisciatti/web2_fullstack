import { useSyncExternalStore } from 'react'

export const CHAVE_TEMA = 'diagramcode:tema'
const TEMAS = ['claro', 'escuro']
const ouvintes = new Set()

function lerSalvo() {
    try {
        const salvo = localStorage.getItem(CHAVE_TEMA)
        return TEMAS.includes(salvo) ? salvo : null
    } catch {
        return null
    }
}

export function temaAtual() {
    if (typeof document === 'undefined') return 'claro'
    return document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'
}

export function definirTema(tema) {
    const proximo = tema === 'escuro' ? 'escuro' : 'claro'
    document.documentElement.dataset.tema = proximo
    try {
        localStorage.setItem(CHAVE_TEMA, proximo)
    } catch {
        // Sem armazenamento (modo privado): o tema vale só nesta visita.
    }
    ouvintes.forEach((ouvinte) => ouvinte())
}

export function alternarTema() {
    definirTema(temaAtual() === 'escuro' ? 'claro' : 'escuro')
}

/** Aplica o tema salvo antes do primeiro render, evitando piscar o tema claro. */
export function aplicarTemaSalvo() {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.tema = lerSalvo() || 'claro'
}

function inscrever(ouvinte) {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
}

export function useTema() {
    return useSyncExternalStore(inscrever, temaAtual, () => 'claro')
}

/** Faz o Mermaid desenhar com o tema escuro quando o app está escuro. */
export function comTemaMermaid(fonte, tema) {
    if (!fonte || tema !== 'escuro') return fonte
    return `%%{init: {"theme": "dark"}}%%\n${fonte}`
}
