import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UmlLivePreview from './UmlLivePreview.jsx'
import { renderizarUml } from './renderizarUml.js'

const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }))
vi.mock('mermaid', () => ({ default: mermaid }))

function pendente() {
    let resolve
    let reject
    const promise = new Promise((sucesso, erro) => { resolve = sucesso; reject = erro })
    return { promise, resolve, reject }
}

describe('UmlLivePreview', () => {
    it('mostra estado vazio para classes ausentes ou sem nome válido', () => {
        for (const projeto of [{}, { classes: [] }, { classes: [{ nome: '[]{}' }] }]) {
            const html = renderToStaticMarkup(createElement(UmlLivePreview, { projeto }))
            expect(html).toContain('Adicione uma classe')
            expect(html).not.toContain('<svg')
        }
    })

    it('mostra carregamento antes de desenhar um projeto com classe', () => {
        const html = renderToStaticMarkup(createElement(UmlLivePreview, {
            projeto: { classes: [{ nome: 'Pedido' }] },
        }))
        expect(html).toContain('Desenhando UML...')
        expect(html).toContain('aria-busy="true"')
    })
})

describe('ciclo de renderização UML', () => {
    let containers
    beforeEach(() => {
        mermaid.render.mockReset()
        containers = []
        vi.stubGlobal('document', {
            createElement: () => {
                const container = { setAttribute: vi.fn(), remove: vi.fn() }
                containers.push(container)
                return container
            },
            body: { appendChild: vi.fn() },
        })
    })
    afterEach(() => vi.unstubAllGlobals())

    it('inicializa uma vez em modo strict e usa IDs diferentes', async () => {
        mermaid.render.mockResolvedValue({ svg: '<svg></svg>' })
        const aplicar = vi.fn()
        renderizarUml('classDiagram\nclass A', 'painel', aplicar)
        await vi.waitFor(() => expect(aplicar).toHaveBeenCalledTimes(1))
        renderizarUml('classDiagram\nclass B', 'painel', aplicar)
        await vi.waitFor(() => expect(aplicar).toHaveBeenCalledTimes(2))

        expect(mermaid.initialize).toHaveBeenCalledTimes(1)
        expect(mermaid.initialize).toHaveBeenCalledWith({
            startOnLoad: false,
            securityLevel: 'strict',
            suppressErrorRendering: true,
            logLevel: 'error',
        })
        expect(mermaid.render.mock.calls[0][0]).not.toBe(mermaid.render.mock.calls[1][0])
        expect(mermaid.render.mock.calls[0][1]).toBe('classDiagram\nclass A')
        expect(containers.every((container) => container.remove.mock.calls.length === 1)).toBe(true)
    })

    it('descarta SVG antigo que termina depois do projeto mais recente', async () => {
        const antiga = pendente()
        const nova = pendente()
        mermaid.render.mockReturnValueOnce(antiga.promise).mockReturnValueOnce(nova.promise)
        const aplicar = vi.fn()
        const cancelar = renderizarUml('antigo', 'painel', aplicar)
        await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1))
        cancelar()
        renderizarUml('novo', 'painel', aplicar)
        await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2))
        nova.resolve({ svg: '<svg>novo</svg>' })
        await vi.waitFor(() => expect(aplicar).toHaveBeenCalledTimes(1))
        antiga.resolve({ svg: '<svg>antigo</svg>' })
        await vi.waitFor(() => expect(containers[0].remove).toHaveBeenCalled())
        expect(aplicar).toHaveBeenCalledTimes(1)
        expect(aplicar).toHaveBeenCalledWith({ fonte: 'novo', status: 'success', svg: '<svg>novo</svg>' })
    })

    it('trata erro e remove o container temporário', async () => {
        mermaid.render.mockRejectedValue(new Error('<script>erro do usuário</script>'))
        const aplicar = vi.fn()
        renderizarUml('invalido', 'painel', aplicar)
        await vi.waitFor(() => expect(aplicar).toHaveBeenCalledWith({ fonte: 'invalido', status: 'error' }))
        expect(containers[0].remove).toHaveBeenCalledTimes(1)
    })

    it('não aplica erro depois de desmontar ou trocar o projeto', async () => {
        const render = pendente()
        mermaid.render.mockReturnValue(render.promise)
        const aplicar = vi.fn()
        const cancelar = renderizarUml('antigo', 'painel', aplicar)
        await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1))
        cancelar()
        render.reject(new Error('Falha antiga'))
        await vi.waitFor(() => expect(containers[0].remove).toHaveBeenCalled())
        expect(aplicar).not.toHaveBeenCalled()
    })

    it('não inicia render cancelado antes de carregar a biblioteca', async () => {
        const aplicar = vi.fn()
        renderizarUml('cancelado', 'painel', aplicar)()
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(mermaid.render).not.toHaveBeenCalled()
        expect(aplicar).not.toHaveBeenCalled()
    })
})
