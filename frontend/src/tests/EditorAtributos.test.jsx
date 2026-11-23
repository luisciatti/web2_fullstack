
/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Editor, {
    buildPayloadProjeto,
    createProjetoVazio,
    persistirProjeto,
    validarProjeto,
} from '../Editor.jsx'

import AttributeEditor, {
    TIPOS_ATRIBUTO,
} from '../components/editor/AttributeEditor.jsx'

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

describe('FE-18 — CRUD de atributos', () => {
    it('disponibiliza os oito tipos e permite adicionar atributo', async () => {
        const onAdd = vi.fn()

        await renderizar(
            <AttributeEditor
                atributos={[]}
                onAdd={onAdd}
                onUpdate={() => {}}
                onRemove={() => {}}
            />
        )

        await clicar('+ Adicionar')

        expect(onAdd).toHaveBeenCalledOnce()

        expect(TIPOS_ATRIBUTO).toEqual([
            'String', 'Long', 'Integer', 'Double',
            'BigDecimal', 'Boolean', 'LocalDate', 'LocalDateTime',
        ])
    })

    it('permite editar nome e tipo por callbacks', async () => {
        const onUpdate = vi.fn()

        await renderizar(
            <AttributeEditor
                atributos={[{ nome: 'id', tipo: 'Long' }]}
                onAdd={() => {}}
                onUpdate={onUpdate}
                onRemove={() => {}}
            />
        )

        const input = container.querySelector(
            '[aria-label="Nome do atributo 1"]'
        )

        await alterarInput(input, 'dataCadastro')

        expect(onUpdate).toHaveBeenCalledWith(
            0, 'nome', 'dataCadastro'
        )

        const select = container.querySelector(
            '[aria-label="Tipo do atributo 1"]'
        )

        await act(async () => {
            select.value = 'LocalDate'
            select.dispatchEvent(
                new Event('change', { bubbles: true })
            )
        })

        expect(onUpdate).toHaveBeenCalledWith(
            0, 'tipo', 'LocalDate'
        )
    })

    it('permite remover somente o atributo indicado', async () => {
        const onRemove = vi.fn()

        await renderizar(
            <AttributeEditor
                atributos={[
                    { nome: 'id', tipo: 'Long' },
                    { nome: 'nome', tipo: 'String' },
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

    it('edita apenas a classe selecionada e preserva métodos e relações', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('✨ Gerar exemplo')

        const antes = lerProjeto()
        const metodosOriginais = antes.classes[0].metodos
        const relacoesOriginais = antes.relacoes
        const atributosCliente = antes.classes[1].atributos
        const atributosPedido = antes.classes[0].atributos
        const novo = atributosPedido.length + 1

        await clicar('+ Atributo')

        const input = container.querySelector(
            `.editor-fe15__inspector [aria-label="Nome do atributo ${novo}"]`
        )

        await alterarInput(input, 'dataCadastro')

        const select = container.querySelector(
            `.editor-fe15__inspector [aria-label="Tipo do atributo ${novo}"]`
        )

        await act(async () => {
            select.value = 'LocalDate'
            select.dispatchEvent(
                new Event('change', { bubbles: true })
            )
        })

        const depois = lerProjeto()

        expect(depois.classes[0].atributos[novo - 1]).toEqual({
            nome: 'dataCadastro',
            tipo: 'LocalDate',
        })

        expect(depois.classes[1].atributos)
            .toEqual(atributosCliente)

        expect(depois.classes[0].metodos)
            .toEqual(metodosOriginais)

        expect(depois.relacoes)
            .toEqual(relacoesOriginais)

        const botaoCliente = [
            ...container.querySelectorAll('.editor-fe15__class-item'),
        ].find((botao) => botao.textContent.includes('Cliente'))

        expect(botaoCliente).toBeDefined()

        await act(async () => {
            botaoCliente.click()
        })

        expect(
            container.querySelector(
                `.editor-fe15__inspector [aria-label="Nome do atributo ${atributosCliente.length + 1}"]`
            )
        ).toBeNull()

        await clicar('+ Atributo')

        expect(lerProjeto().classes[1].atributos).toHaveLength(atributosCliente.length + 1)
        expect(lerProjeto().classes[0].atributos).toHaveLength(novo)

        const botoesRemover = [
            ...container.querySelectorAll(
                '.editor-fe15__inspector .editor-fe15__remove'
            ),
        ].filter((botao) => botao.textContent.trim() === 'Remover atributo')

        await act(async () => {
            botoesRemover.at(-1).click()
        })

        expect(lerProjeto().classes[1].atributos)
            .toEqual(atributosCliente)

        expect(lerProjeto().classes[0].atributos[novo - 1]).toEqual({
            nome: 'dataCadastro',
            tipo: 'LocalDate',
        })
    })

    it('bloqueia salvar com atributo incompleto', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('✨ Gerar exemplo')
        await clicar('+ Atributo')

        const salvar = [...container.querySelectorAll('button')]
            .find((botao) => botao.textContent.trim() === 'Salvar')

        expect(salvar.disabled).toBe(true)

        expect(container.textContent).toContain(
            'Atributo inválido em "Pedido".'
        )

        const projeto = createProjetoVazio()
        projeto.nome = 'Teste'
        projeto.classes = [{
            nome: 'Pedido',
            atributos: [{ nome: 'id', tipo: '' }],
            metodos: [],
        }]

        expect(validarProjeto(projeto)).toContain(
            'Atributo inválido em "Pedido".'
        )
    })

    it('gera o payload com nome e tipo, preservando outros dados', () => {
        const projeto = createProjetoVazio()
        projeto.nome = 'Sistema'

        projeto.classes = [{
            nome: 'Pedido',
            atributos: [{
                nome: 'dataCadastro',
                tipo: 'LocalDate',
            }],
            metodos: [{
                nome: 'calcular',
                tipoRetorno: 'Double',
            }],
        }]

        projeto.relacoes = [{
            origem: 'Pedido',
            destino: 'Pedido',
            tipo: 'ONE_TO_ONE',
        }]

        const payload = buildPayloadProjeto(projeto)

        expect(payload.classes[0].atributos).toEqual([{
            nome: 'dataCadastro',
            tipo: 'LocalDate',
        }])

        expect(payload.classes[0].atributos[0])
            .not.toHaveProperty('tipoRetorno')

        expect(payload.classes[0].metodos)
            .toEqual(projeto.classes[0].metodos)

        expect(payload.relacoes)
            .toEqual(projeto.relacoes)
    })

    it('envia ao backend o formato correto sem gerar código', async () => {
        const projeto = createProjetoVazio()
        projeto.nome = 'Sistema'

        projeto.classes = [{
            nome: 'Pedido',
            atributos: [{ nome: 'id', tipo: 'Long' }],
            metodos: [],
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
                        atributos: [{ nome: 'id', tipo: 'Long' }],
                        metodos: [],
                    }],
                }),
            })
        )

        expect(request).toHaveBeenCalledOnce()
    })
})
