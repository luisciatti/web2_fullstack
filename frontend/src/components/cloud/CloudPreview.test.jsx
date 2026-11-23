// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CloudConnectionsPanel from './CloudConnectionsPanel.jsx'
import CloudPreview from './CloudPreview.jsx'

const renderizar = vi.hoisted(() => vi.fn())
vi.mock('../../diagramas/renderizarMermaid.js', () => ({ renderizarMermaid: renderizar }))

let host
let root

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    renderizar.mockReset()
    host = document.createElement('div')
    root = createRoot(host)
})

afterEach(() => {
    act(() => root.unmount())
    vi.unstubAllGlobals()
})

it('mostra vazio, carregamento e erro seguro, e cancela o render ao trocar a fonte', () => {
    const cancelar = vi.fn()
    renderizar.mockReturnValue(cancelar)
    act(() => root.render(<CloudPreview codigoMermaid={'flowchart LR\n'} />))
    expect(host.textContent).toContain('Gere um diagrama Cloud')
    expect(renderizar).not.toHaveBeenCalled()

    const fonte = 'flowchart LR\n  api --> db'
    act(() => root.render(<CloudPreview codigoMermaid={fonte} />))
    expect(host.textContent).toContain('Desenhando o diagrama Cloud')
    const [, prefixo, , aplicar] = renderizar.mock.calls[0]
    expect(prefixo).toMatch(/^cloud-preview-/)
    act(() => aplicar({ fonte, status: 'success', svg: '<svg><text>API</text></svg>' }))
    expect(host.querySelector('svg').textContent).toBe('API')

    const invalida = 'flowchart LR\n  api -->'
    act(() => root.render(<CloudPreview codigoMermaid={invalida} />))
    expect(cancelar).toHaveBeenCalledOnce()
    act(() => renderizar.mock.calls[1][3]({ fonte: invalida, status: 'error', svg: '<img>' }))
    expect(host.querySelector('[role="alert"]').textContent).toContain('Não foi possível')
    expect(host.querySelector('img, svg')).toBeNull()
})

it('sinaliza referência importada inválida e permite corrigi-la com um ID real', () => {
    const projeto = {
        servicosCloud: [{ id: 'api' }, { id: 'db' }],
        conexoesCloud: [{ de: 'inexistente', para: 'db', rotulo: 'Banco' }],
    }
    const onChange = vi.fn()
    act(() => root.render(<CloudConnectionsPanel projeto={projeto} onChange={onChange} />))

    const origem = host.querySelector('select')
    expect(origem.getAttribute('aria-invalid')).toBe('true')
    expect(origem.selectedOptions[0].disabled).toBe(true)
    expect(host.textContent).toContain('Este serviço não existe')

    act(() => {
        origem.value = 'api'
        origem.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith({
        ...projeto,
        conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'Banco' }],
    })
    expect(projeto.conexoesCloud[0].de).toBe('inexistente')
})
