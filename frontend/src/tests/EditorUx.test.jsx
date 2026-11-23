/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Editor from '../Editor.jsx'

vi.mock('../components/editor/EditorUmlSlot.jsx', () => ({
    default: ({ projeto }) => (
        <pre data-testid="estado-projeto">{JSON.stringify(projeto)}</pre>
    ),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

const renderizar = async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
        root.render(
            <Editor projectId="novo" onBack={() => { }} onLogout={() => { }} onProjectSaved={() => { }} />
        )
    })
}

const botao = (texto) => [...container.querySelectorAll('button')]
    .find((elemento) => elemento.textContent.trim() === texto)

const clicar = async (texto) => {
    const alvo = botao(texto)
    expect(alvo, `botão "${texto}"`).toBeDefined()
    await act(async () => { alvo.click() })
}

const digitar = async (input, valor) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    await act(async () => {
        setter.call(input, valor)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

const estado = () => JSON.parse(container.querySelector('[data-testid="estado-projeto"]').textContent)

afterEach(async () => {
    if (root) await act(async () => { root.unmount() })
    container?.remove()
    root = null
    container = null
})

describe('Correções de UX do editor', () => {
    it('mostra o campo do nome do projeto marcado como inválido e um atalho para preenchê-lo', async () => {
        await renderizar()
        const nome = container.querySelector('input[aria-label="Nome do projeto"]')
        expect(nome.getAttribute('aria-invalid')).toBe('true')
        expect(nome.className).toContain('is-invalid')

        await clicar('Preencher nome')
        expect(document.activeElement).toBe(nome)

        await digitar(nome, 'Loja')
        expect(nome.getAttribute('aria-invalid')).toBe('false')
        expect(container.textContent).not.toContain('O nome do projeto é obrigatório.')
    })

    it('cria relação entre classes pelo inspetor', async () => {
        await renderizar()
        await clicar('+ Classe')
        await digitar(container.querySelector('.editor-fe15__inspector input'), 'Pedido')
        await clicar('+ Classe')
        await digitar(container.querySelector('.editor-fe15__inspector input'), 'Cliente')

        await clicar('+ Relação')
        expect(estado().relacoes).toEqual([{ origem: 'Cliente', destino: 'Pedido', tipo: 'ONE_TO_ONE' }])

        const tipo = container.querySelector('select[aria-label="Tipo da relação 1"]')
        await act(async () => {
            tipo.value = 'MANY_TO_ONE'
            tipo.dispatchEvent(new Event('change', { bubbles: true }))
        })
        expect(estado().relacoes[0].tipo).toBe('MANY_TO_ONE')

        await clicar('Remover relação')
        expect(estado().relacoes).toEqual([])
    })

    it('Visualizar UML rola até o diagrama sem mudar o endereço', async () => {
        await renderizar()
        const alvo = container.querySelector('#editor-diagrama')
        alvo.scrollIntoView = vi.fn()
        const hashAntes = window.location.hash
        await clicar('▤ Visualizar UML')
        await act(async () => { await new Promise((resolve) => requestAnimationFrame(resolve)) })
        expect(alvo.scrollIntoView).toHaveBeenCalled()
        expect(window.location.hash).toBe(hashAntes)
    })

    it('abre a visualização Cloud e permite adicionar serviços e conexões', async () => {
        await renderizar()
        await clicar('☁ Visualização Cloud')
        expect(container.querySelector('.editor-fe15__toolbar h2').textContent).toBe('Arquitetura Cloud')
        expect(container.textContent).toContain('Conexões Cloud')
        expect(container.querySelector('.editor-fe15__inspector')).toBeNull()

        await clicar('+ Serviço')
        await clicar('+ Serviço')
        expect(botao('+ Conexão').disabled).toBe(false)
        await clicar('+ Conexão')
        expect(container.querySelectorAll('.cloud-connections fieldset').length).toBe(1)

        await clicar('▦ Diagrama de classes')
        expect(container.querySelector('.editor-fe15__toolbar h2').textContent).toBe('Diagrama de classes')
    })
})
