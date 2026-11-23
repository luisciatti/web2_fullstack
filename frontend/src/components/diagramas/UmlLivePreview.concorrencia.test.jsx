// @vitest-environment jsdom
import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { projetoUml, projetoVazio } from '../../tests/fixtures/projetos.js'
import GenerationPanel from '../geracao/GenerationPanel.jsx'
import UmlLivePreview from './UmlLivePreview.jsx'

const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }))
vi.mock('mermaid', () => ({ default: mermaid }))

const projetoComPedido = { classes: [{ nome: 'Pedido' }], relacoes: [] }

describe('concorrência da prévia UML montada', () => {
    let host
    let root
    let renders

    function atualizar(projeto) {
        act(() => root.render(<StrictMode><UmlLivePreview projeto={projeto} /></StrictMode>))
    }

    async function avancar(ms = 300) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ms)
            await vi.dynamicImportSettled()
        })
    }

    async function concluir(render, texto) {
        await act(async () => render.resolve({ svg: `<svg><text>${texto}</text></svg>` }))
    }

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
        vi.useFakeTimers()
        host = document.body.appendChild(document.createElement('div'))
        root = createRoot(host)
        renders = []
        mermaid.render.mockReset().mockImplementation((id, fonte, container) =>
            new Promise((resolve, reject) => {
                renders.push({ id, fonte, container, resolve, reject })
            }),
        )
    })

    afterEach(() => {
        if (root) act(() => root.unmount())
        host.remove()
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('mantém UML e salvamento local independentes da chamada explícita de geração', async () => {
        const fetch = vi.fn().mockResolvedValue({ ok: true })
        vi.stubGlobal('fetch', fetch)
        const onGenerate = () => fetch('/api/projetos/42/gerar', { method: 'POST' })
        function atualizarPaineis(projeto, dirty) {
            act(() => root.render(
                <StrictMode>
                    <UmlLivePreview projeto={projeto} />
                    <GenerationPanel idSalvo="42" dirty={dirty} valido onGenerate={onGenerate} />
                </StrictMode>,
            ))
        }

        atualizarPaineis(projetoVazio(), false)
        await avancar()
        expect(host.textContent).toContain('Adicione uma classe')
        expect(fetch).not.toHaveBeenCalled()

        const projeto = projetoUml()
        atualizarPaineis(projeto, true)
        await avancar()
        await concluir(renders[0], 'Pedido e Cliente')
        const botao = host.querySelector('.generation-panel button')
        expect(botao.disabled).toBe(true)
        expect(fetch).not.toHaveBeenCalled()

        atualizarPaineis(projeto, false)
        await avancar()
        expect(botao.disabled).toBe(false)
        expect(fetch).not.toHaveBeenCalled()
        await act(async () => botao.click())
        expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/projetos/42/gerar', { method: 'POST' })
        expect(renders).toHaveLength(1)
    })

    it('limita e redefine o zoom sem alterar o projeto nem renderizar outro SVG', async () => {
        const projeto = structuredClone(projetoComPedido)
        atualizar(projeto)
        await avancar()
        await concluir(renders[0], 'Pedido')

        const controle = (rotulo) => host.querySelector(`button[aria-label="${rotulo}"]`)
        const diminuir = controle('Diminuir zoom')
        const aumentar = controle('Aumentar zoom')
        const redefinir = controle('Redefinir zoom para 100%')
        const percentual = host.querySelector('output')
        const svg = host.querySelector('svg')

        for (let passo = 0; passo < 3; passo++) act(() => diminuir.click())
        expect(percentual.textContent).toBe('50%')
        expect(diminuir.disabled).toBe(true)

        for (let passo = 0; passo < 7; passo++) act(() => aumentar.click())
        expect(percentual.textContent).toBe('200%')
        expect(aumentar.disabled).toBe(true)

        act(() => redefinir.click())
        await avancar()
        expect(percentual.textContent).toBe('100%')
        expect(host.querySelector('svg')).toBe(svg)
        expect(renders).toHaveLength(1)
        expect(projeto).toEqual(projetoComPedido)
    })

    it('agrupa renomes rápidos e ignora retornos antigos após mudar relação e excluir classe', async () => {
        const projetoComClasse = (nome, tipo) => ({
            classes: [...projetoComPedido.classes, { nome }],
            relacoes: [{ origem: 'Pedido', destino: nome, tipo }],
        })

        atualizar(projetoComPedido)
        await avancar()
        await concluir(renders[0], 'Pedido')
        const svgInicial = host.querySelector('svg')

        atualizar(projetoComClasse('', 'ONE_TO_ONE'))
        await avancar()
        expect(renders).toHaveLength(1)
        expect(host.querySelector('svg')).toBe(svgInicial)

        atualizar(projetoComClasse('Cliente', 'ONE_TO_ONE'))
        await avancar()
        for (const nome of ['Comprador', 'Conta', 'Empresa']) {
            atualizar(projetoComClasse(nome, 'ONE_TO_ONE'))
            await avancar(50)
        }
        expect(renders).toHaveLength(2)
        await avancar()
        expect(renders[2].fonte).toContain('["Empresa"]')
        expect(renders[2].fonte).not.toContain('["Conta"]')

        atualizar(projetoComClasse('Empresa', 'ONE_TO_MANY'))
        await avancar()
        expect(renders[3].fonte).toContain('"1" -- "*"')
        atualizar({ ...projetoComPedido, relacoes: [{ origem: 'Pedido', destino: 'Empresa', tipo: 'ONE_TO_MANY' }] })
        await avancar()
        expect(renders[4].fonte).not.toContain(' -- ')
        expect(renders[4].fonte).not.toContain('["Empresa"]')
        expect(new Set(renders.map(({ id }) => id)).size).toBe(5)

        await concluir(renders[4], 'Somente Pedido')
        await concluir(renders[3], 'Relação antiga')
        await concluir(renders[2], 'Empresa antiga')
        await concluir(renders[1], 'Cliente antigo')
        expect(host.querySelector('svg').textContent).toBe('Somente Pedido')
        expect(renders.every(({ container }) => !container.isConnected)).toBe(true)
    })

    it('preserva o último SVG válido ao falhar e se recupera na edição seguinte', async () => {
        atualizar(projetoComPedido)
        await avancar()
        await concluir(renders[0], 'Pedido')
        const svgValido = host.querySelector('svg')

        atualizar({ classes: [{ nome: 'Cliente' }] })
        await avancar()
        await act(async () => renders[1].reject(new Error('<img src=x onerror=alert(1)>')))
        expect(host.querySelector('[role="alert"]').textContent).toContain('Não foi possível desenhar a UML')
        expect(host.querySelector('img')).toBeNull()
        expect(host.querySelector('svg')).toBe(svgValido)

        atualizar({ classes: [{ nome: 'Entrega' }] })
        await avancar()
        await concluir(renders[2], 'Entrega')
        expect(host.querySelector('[role="alert"]')).toBeNull()
        expect(host.querySelector('svg').textContent).toBe('Entrega')
    })

    it('limpa o debounce e descarta o render pendente ao desmontar, com IDs únicos entre instâncias', async () => {
        act(() => root.render(
            <>
                <UmlLivePreview projeto={projetoComPedido} />
                <UmlLivePreview projeto={projetoComPedido} />
                <UmlLivePreview projeto={{}} />
            </>,
        ))
        await avancar()
        expect(renders).toHaveLength(2)
        expect(renders[0].id).not.toBe(renders[1].id)

        const projetoEditado = { classes: [{ nome: 'Entrega' }] }
        act(() => root.render(
            <>
                <UmlLivePreview projeto={projetoComPedido} />
                <UmlLivePreview projeto={projetoComPedido} />
                <UmlLivePreview projeto={projetoEditado} />
            </>,
        ))
        act(() => root.unmount())
        root = null
        await avancar()
        await concluir(renders[0], 'Antigo')
        await act(async () => renders[1].reject(new Error('Falha depois de desmontar')))
        expect(renders).toHaveLength(2)
        expect(host.children).toHaveLength(0)
        expect(renders.every(({ container }) => !container.isConnected)).toBe(true)
    })
})
