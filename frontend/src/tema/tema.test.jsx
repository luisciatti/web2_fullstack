/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import BotaoTema from './BotaoTema.jsx'
import { CHAVE_TEMA, aplicarTemaSalvo, comTemaMermaid, definirTema, temaAtual } from './tema.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.tema
})

afterEach(async () => {
    if (root) await act(async () => { root.unmount() })
    container?.remove()
    root = null
    container = null
})

describe('tema', () => {
    it('começa claro e respeita o tema salvo', () => {
        aplicarTemaSalvo()
        expect(temaAtual()).toBe('claro')
        localStorage.setItem(CHAVE_TEMA, 'escuro')
        aplicarTemaSalvo()
        expect(document.documentElement.dataset.tema).toBe('escuro')
    })

    it('ignora valores inválidos no armazenamento', () => {
        localStorage.setItem(CHAVE_TEMA, '"><script>')
        aplicarTemaSalvo()
        expect(temaAtual()).toBe('claro')
    })

    it('adiciona a diretiva de tema escuro ao Mermaid só no modo escuro', () => {
        expect(comTemaMermaid('classDiagram', 'claro')).toBe('classDiagram')
        expect(comTemaMermaid('classDiagram', 'escuro')).toBe('%%{init: {"theme": "dark"}}%%\nclassDiagram')
        expect(comTemaMermaid('', 'escuro')).toBe('')
    })

    it('o botão alterna o tema, salva a escolha e atualiza o rótulo', async () => {
        aplicarTemaSalvo()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        await act(async () => { root.render(<BotaoTema />) })

        const botao = container.querySelector('button')
        expect(botao.getAttribute('aria-label')).toBe('Ativar modo escuro')

        await act(async () => { botao.click() })
        expect(temaAtual()).toBe('escuro')
        expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro')
        expect(botao.getAttribute('aria-pressed')).toBe('true')
        expect(botao.getAttribute('aria-label')).toBe('Ativar modo claro')

        await act(async () => { definirTema('claro') })
        expect(botao.getAttribute('aria-pressed')).toBe('false')

        await act(async () => {
            localStorage.setItem(CHAVE_TEMA, 'escuro')
            window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_TEMA, storageArea: localStorage, newValue: 'escuro' }))
        })
        expect(temaAtual()).toBe('escuro')
        expect(botao.getAttribute('aria-pressed')).toBe('true')
    })
})
