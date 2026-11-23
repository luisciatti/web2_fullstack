// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import GenerationPanel from './GenerationPanel.jsx'

let host
let root

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    host = document.createElement('div')
    root = createRoot(host)
})

afterEach(() => {
    act(() => root.unmount())
    vi.unstubAllGlobals()
})

it('só chama o callback após clique em projeto persistido, válido e salvo', () => {
    const onGenerate = vi.fn()
    const base = { idSalvo: '42', valido: true, onGenerate }
    for (const props of [{ idSalvo: null }, { idSalvo: 'novo' }, { dirty: true }, { valido: false }, { salvando: true }]) {
        act(() => root.render(<GenerationPanel {...base} {...props} />))
        expect(host.querySelector('button').disabled).toBe(true)
        act(() => host.querySelector('button').click())
    }
    act(() => root.render(<GenerationPanel {...base} />))
    expect(host.querySelector('button').disabled).toBe(false)
    expect(onGenerate).not.toHaveBeenCalled()
})

it('bloqueia cliques simultâneos e apresenta sucesso e falha distintamente', async () => {
    let concluir
    const onGenerate = vi.fn(() => new Promise((resolve) => { concluir = resolve }))
    const base = { idSalvo: '42', valido: true, onGenerate }
    act(() => root.render(<GenerationPanel {...base} />))

    const botao = host.querySelector('button')
    act(() => {
        botao.click()
        botao.click()
    })
    expect(onGenerate).toHaveBeenCalledOnce()
    expect(botao.disabled).toBe(true)
    expect(botao.textContent).toBe('Gerando…')
    const resultado = { idProjeto: '42', uml: 'classDiagram', cloud: '', artefatos: [{ nome: 'Pedido.java', tipo: 'JAVA' }] }
    await act(async () => {
        root.render(<GenerationPanel {...base} resultado={resultado} />)
        concluir()
    })
    expect(host.textContent).toContain('Pedido.java')

    onGenerate.mockRejectedValueOnce(new Error('falha'))
    await act(async () => botao.click())
    expect(host.querySelector('[role="alert"]').textContent).toContain('Não foi possível gerar')
    expect(botao.disabled).toBe(false)
})
