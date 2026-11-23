
/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Editor, {
    buildPayloadProjeto,
    createProjetoVazio,
    normalizeProjeto,
    persistirProjeto,
    validarProjeto,
} from '../Editor.jsx'

import MethodEditor, {
    TIPOS_RETORNO,
} from '../components/editor/MethodEditor.jsx'

vi.mock('../components/editor/EditorUmlSlot.jsx', () => ({
    default: ({ projeto }) => (
        <pre data-testid="estado-projeto">
            {JSON.stringify(projeto)}
        </pre>
    ),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

const renderizar = async (elemento) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
        root.render(elemento)
    })
}

const clicar = async (texto) => {
    const botao = [...container.querySelectorAll('button')]
        .find((elemento) => elemento.textContent.trim() === texto)

    expect(botao).toBeDefined()

    await act(async () => {
        botao.click()
    })
}

const alterarInput = async (input, valor) => {
    expect(input).not.toBeNull()

    const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
    ).set

    await act(async () => {
        setter.call(input, valor)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

const lerProjeto = () => JSON.parse(
    container.querySelector('[data-testid="estado-projeto"]').textContent
)

afterEach(async () => {
    if (root) {
        await act(async () => {
            root.unmount()
        })
    }

    container?.remove()
    container = null
    root = null
    vi.restoreAllMocks()
})

describe('FE-19 — CRUD de métodos', () => {
    it('disponibiliza os tipos de retorno e permite adicionar', async () => {
        const onAdd = vi.fn()

        await renderizar(
            <MethodEditor
                metodos={[]}
                onAdd={onAdd}
                onUpdate={() => {}}
                onRemove={() => {}}
            />
        )

        await clicar('+ Adicionar')

        expect(onAdd).toHaveBeenCalledOnce()
        expect(TIPOS_RETORNO).toEqual([
            'void', 'String', 'Long', 'Integer',
            'Double', 'BigDecimal', 'Boolean',
        ])
    })

    it('edita nome e tipoRetorno pelos callbacks', async () => {
        const onUpdate = vi.fn()

        await renderizar(
            <MethodEditor
                metodos={[{ nome: 'calcular', tipoRetorno: 'void' }]}
                onAdd={() => {}}
                onUpdate={onUpdate}
                onRemove={() => {}}
            />
        )

        await alterarInput(
            container.querySelector('[aria-label="Nome do método 1"]'),
            'calcularTotal'
        )

        expect(onUpdate).toHaveBeenCalledWith(
            0, 'nome', 'calcularTotal'
        )

        const select = container.querySelector(
            '[aria-label="Retorno do método 1"]'
        )

        await act(async () => {
            select.value = 'BigDecimal'
            select.dispatchEvent(new Event('change', { bubbles: true }))
        })

        expect(onUpdate).toHaveBeenCalledWith(
            0, 'tipoRetorno', 'BigDecimal'
        )
    })

    it('remove somente o método escolhido', async () => {
        const onRemove = vi.fn()

        await renderizar(
            <MethodEditor
                metodos={[
                    { nome: 'calcular', tipoRetorno: 'Double' },
                    { nome: 'validar', tipoRetorno: 'Boolean' },
                ]}
                onAdd={() => {}}
                onUpdate={() => {}}
                onRemove={onRemove}
            />
        )

        const botoes = container.querySelectorAll(
            '.editor-fe15__remove'
        )

        await act(async () => {
            botoes[1].click()
        })

        expect(onRemove).toHaveBeenCalledWith(1)
    })

    it('edita métodos da classe correta sem alterar atributos ou relações', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('✨ Gerar exemplo')

        const antes = lerProjeto()
        const atributosOriginais = antes.classes[0].atributos
        const relacoesOriginais = antes.relacoes
        const metodosCliente = antes.classes[1].metodos
        const metodosPedido = antes.classes[0].metodos
        const novo = metodosPedido.length + 1

        await clicar('+ Método')

        await alterarInput(
            container.querySelector(
                `.editor-fe15__inspector [aria-label="Nome do método ${novo}"]`
            ),
            'validarPedido'
        )

        const select = container.querySelector(
            `.editor-fe15__inspector [aria-label="Retorno do método ${novo}"]`
        )

        await act(async () => {
            select.value = 'Boolean'
            select.dispatchEvent(new Event('change', { bubbles: true }))
        })

        const depois = lerProjeto()

        expect(depois.classes[0].metodos).toEqual([
            ...metodosPedido,
            { nome: 'validarPedido', tipoRetorno: 'Boolean' },
        ])
        expect(depois.classes[1].metodos).toEqual(metodosCliente)
        expect(depois.classes[0].atributos).toEqual(atributosOriginais)
        expect(depois.relacoes).toEqual(relacoesOriginais)

        const cliente = [
            ...container.querySelectorAll('.editor-fe15__class-item'),
        ].find((botao) => botao.textContent.includes('Cliente'))

        expect(cliente).toBeDefined()

        await act(async () => {
            cliente.click()
        })

        expect(container.querySelector(
            `.editor-fe15__inspector [aria-label="Nome do método ${metodosCliente.length + 1}"]`
        )).toBeNull()

        await clicar('+ Método')

        expect(lerProjeto().classes[1].metodos).toEqual([
            ...metodosCliente,
            { nome: '', tipoRetorno: 'void' },
        ])

        const removerMetodo = [...container.querySelectorAll('.editor-fe15__inspector button')]
            .filter((botao) => botao.textContent.trim() === 'Remover método')

        await act(async () => {
            removerMetodo.at(-1).click()
        })

        expect(lerProjeto().classes[1].metodos).toEqual(metodosCliente)
        expect(lerProjeto().classes[0].metodos).toHaveLength(novo)
    })

    it('bloqueia o salvamento com método incompleto', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('✨ Gerar exemplo')
        await clicar('+ Método')

        const salvar = [...container.querySelectorAll('button')]
            .find((botao) => botao.textContent.trim() === 'Salvar')

        expect(salvar.disabled).toBe(true)
        expect(container.textContent).toContain(
            'Método inválido em "Pedido".'
        )

        const projeto = createProjetoVazio()
        projeto.nome = 'Sistema'
        projeto.classes = [{
            nome: 'Pedido',
            atributos: [],
            metodos: [{ nome: 'calcular', tipoRetorno: '' }],
        }]

        expect(validarProjeto(projeto)).toContain(
            'Método inválido em "Pedido".'
        )
    })

    it('preserva tipoRetorno, múltiplos métodos e demais dados no payload', () => {
        const projeto = createProjetoVazio()
        projeto.nome = 'Sistema'
        projeto.classes = [{
            nome: 'Pedido',
            atributos: [{ nome: 'id', tipo: 'Long' }],
            metodos: [
                { nome: 'calcularTotal', tipoRetorno: 'BigDecimal' },
                { nome: 'validar', tipoRetorno: 'Boolean' },
            ],
        }]
        projeto.relacoes = [{
            origem: 'Pedido',
            destino: 'Pedido',
            tipo: 'ONE_TO_ONE',
        }]

        const payload = buildPayloadProjeto(projeto)

        expect(payload.classes[0].metodos).toEqual(projeto.classes[0].metodos)
        expect(payload.classes[0].metodos[0]).not.toHaveProperty('tipo')
        expect(payload.classes[0].atributos).toEqual(projeto.classes[0].atributos)
        expect(payload.relacoes).toEqual(projeto.relacoes)

        const reaberto = normalizeProjeto({ id: 10, ...payload })
        expect(reaberto.classes[0].metodos).toEqual(projeto.classes[0].metodos)
    })

    it('envia métodos ao backend usando o contrato correto', async () => {
        const projeto = createProjetoVazio()
        projeto.nome = 'Sistema'
        projeto.classes = [{
            nome: 'Pedido',
            atributos: [],
            metodos: [
                { nome: 'calcularTotal', tipoRetorno: 'BigDecimal' },
                { nome: 'validar', tipoRetorno: 'Boolean' },
            ],
        }]

        const request = vi.fn().mockResolvedValue({ id: 10 })

        await persistirProjeto(projeto, 10, request)

        expect(request).toHaveBeenCalledWith(
            '/api/projetos/10',
            expect.objectContaining({
                method: 'PUT',
                body: expect.objectContaining({
                    classes: [{
                        nome: 'Pedido',
                        atributos: [],
                        metodos: projeto.classes[0].metodos,
                    }],
                }),
            })
        )

        expect(request).toHaveBeenCalledOnce()
    })
})
