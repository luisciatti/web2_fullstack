
/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Editor, {
    buildPayloadProjeto,
    createProjetoVazio,
    normalizeProjeto,
    persistirProjeto,
    renomearClasse,
    removerClasse,
    validarProjeto,
} from '../Editor.jsx'

import RelationsEditor, {
    TIPOS_RELACAO,
} from '../components/editor/RelationsEditor.jsx'

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

const criarProjetoTeste = () => ({
    ...createProjetoVazio(),
    nome: 'Projeto FE20',
    classes: [
        { nome: 'Pedido', atributos: [], metodos: [] },
        { nome: 'Cliente', atributos: [], metodos: [] },
    ],
    relacoes: [
        { origem: 'Pedido', destino: 'Cliente', tipo: 'ONE_TO_ONE' },
        { origem: 'Cliente', destino: 'Pedido', tipo: 'ONE_TO_MANY' },
        { origem: 'Pedido', destino: 'Pedido', tipo: 'MANY_TO_ONE' },
        { origem: 'Cliente', destino: 'Cliente', tipo: 'MANY_TO_MANY' },
    ],
})

const renderizar = async (elemento) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
        root.render(elemento)
    })
}

const clicar = async (botao) => {
    expect(botao).toBeDefined()

    await act(async () => {
        botao.click()
    })
}

const selecionar = async (seletor, valor) => {
    const elemento = container.querySelector(seletor)

    expect(elemento).not.toBeNull()

    await act(async () => {
        elemento.value = valor
        elemento.dispatchEvent(
            new Event('change', { bubbles: true })
        )
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

describe('FE-20 — Relações UML e validação', () => {
    it('exibe classes válidas e os quatro tipos de relações', async () => {
        const projeto = criarProjetoTeste()

        await renderizar(
            <RelationsEditor
                classes={[
                    ...projeto.classes,
                    { nome: '   ' },
                ]}
                relacoes={[projeto.relacoes[0]]}
                onAdd={() => {}}
                onUpdate={() => {}}
                onRemove={() => {}}
            />
        )

        const origem = container.querySelector(
            '[aria-label="Origem da relação 1"]'
        )

        const opcoes = [...origem.options].map(
            (opcao) => opcao.value
        )

        expect(opcoes).toEqual(['', 'Pedido', 'Cliente'])

        expect(TIPOS_RELACAO).toEqual([
            'ONE_TO_ONE',
            'ONE_TO_MANY',
            'MANY_TO_ONE',
            'MANY_TO_MANY',
        ])

        const tipo = container.querySelector(
            '[aria-label="Tipo da relação 1"]'
        )

        expect([...tipo.options].map((opcao) => opcao.value))
            .toEqual(['', ...TIPOS_RELACAO])
    })

    it('permite adicionar, editar e remover por callbacks', async () => {
        const onAdd = vi.fn()
        const onUpdate = vi.fn()
        const onRemove = vi.fn()

        await renderizar(
            <RelationsEditor
                classes={criarProjetoTeste().classes}
                relacoes={[
                    {
                        origem: 'Pedido',
                        destino: 'Cliente',
                        tipo: 'ONE_TO_ONE',
                    },
                ]}
                onAdd={onAdd}
                onUpdate={onUpdate}
                onRemove={onRemove}
            />
        )

        await clicar(
            [...container.querySelectorAll('button')]
                .find((botao) =>
                    botao.textContent.trim() === 'Adicionar relação'
                )
        )

        expect(onAdd).toHaveBeenCalledOnce()

        await selecionar(
            '[aria-label="Origem da relação 1"]',
            'Cliente'
        )

        await selecionar(
            '[aria-label="Destino da relação 1"]',
            'Pedido'
        )

        await selecionar(
            '[aria-label="Tipo da relação 1"]',
            'MANY_TO_MANY'
        )

        expect(onUpdate).toHaveBeenCalledWith(
            0, 'origem', 'Cliente'
        )
        expect(onUpdate).toHaveBeenCalledWith(
            0, 'destino', 'Pedido'
        )
        expect(onUpdate).toHaveBeenCalledWith(
            0, 'tipo', 'MANY_TO_MANY'
        )

        await clicar(container.querySelector('button.danger'))

        expect(onRemove).toHaveBeenCalledWith(0)
    })

    it('bloqueia relações com campos vazios', () => {
        const projeto = criarProjetoTeste()

        projeto.relacoes = [{
            origem: '',
            destino: 'Cliente',
            tipo: 'ONE_TO_MANY',
        }]

        expect(validarProjeto(projeto)).toContain(
            'Há uma relação incompleta.'
        )
    })

    it('rejeita origem e destino inexistentes', () => {
        const projeto = criarProjetoTeste()

        projeto.relacoes = [{
            origem: 'Pedido',
            destino: 'Inexistente',
            tipo: 'MANY_TO_ONE',
        }]

        expect(validarProjeto(projeto)).toContain(
            'Relação inválida: "Pedido" ou "Inexistente" não corresponde a uma classe do projeto.'
        )

        projeto.relacoes[0].origem = 'OutraClasse'
        projeto.relacoes[0].destino = 'Cliente'

        expect(validarProjeto(projeto)).toContain(
            'Relação inválida: "OutraClasse" ou "Cliente" não corresponde a uma classe do projeto.'
        )
    })

    it('rejeita tipos de relação não suportados', () => {
        const projeto = criarProjetoTeste()

        projeto.relacoes = [{
            origem: 'Pedido',
            destino: 'Cliente',
            tipo: 'TIPO_INVALIDO',
        }]

        expect(validarProjeto(projeto)).toContain(
            'Tipo de relação inválido: "TIPO_INVALIDO".'
        )
    })

    it('permite uma classe relacionada consigo mesma', () => {
        const projeto = criarProjetoTeste()

        projeto.relacoes = [{
            origem: 'Pedido',
            destino: 'Pedido',
            tipo: 'ONE_TO_ONE',
        }]

        expect(validarProjeto(projeto)).toEqual([])
    })

    it('mantém relações consistentes ao renomear ou excluir classes', () => {
        const projeto = criarProjetoTeste()

        const renomeado = renomearClasse(projeto, 0, 'Ordem')

        expect(renomeado.classes[0].nome).toBe('Ordem')

        expect(renomeado.relacoes).toEqual([
            { origem: 'Ordem', destino: 'Cliente', tipo: 'ONE_TO_ONE' },
            { origem: 'Cliente', destino: 'Ordem', tipo: 'ONE_TO_MANY' },
            { origem: 'Ordem', destino: 'Ordem', tipo: 'MANY_TO_ONE' },
            { origem: 'Cliente', destino: 'Cliente', tipo: 'MANY_TO_MANY' },
        ])

        const atualizado = removerClasse(renomeado, 0)

        expect(atualizado.classes.map((classe) => classe.nome))
            .toEqual(['Cliente'])

        expect(atualizado.relacoes).toEqual([
            {
                origem: 'Cliente',
                destino: 'Cliente',
                tipo: 'MANY_TO_MANY',
            },
        ])

        expect(validarProjeto(atualizado)).toEqual([])
        expect(projeto.classes[0].nome).toBe('Pedido')
    })

    it('preserva o contrato ao montar, enviar e normalizar o payload', async () => {
        const projeto = criarProjetoTeste()

        const payload = buildPayloadProjeto(projeto)

        expect(payload.relacoes).toEqual(projeto.relacoes)

        const request = vi.fn().mockResolvedValue({ id: 10 })

        await persistirProjeto(projeto, 10, request)

        expect(request).toHaveBeenCalledWith(
            '/api/projetos/10',
            expect.objectContaining({
                method: 'PUT',
                body: expect.objectContaining({
                    relacoes: projeto.relacoes,
                }),
            })
        )

        const reaberto = normalizeProjeto({
            id: 10,
            ...payload,
        })

        expect(reaberto.relacoes).toEqual(projeto.relacoes)
    })

    it('integra o formulário ao projeto sem afetar outros dados', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        const botao = (texto) => [...container.querySelectorAll('button')]
            .find((elemento) => elemento.textContent.trim() === texto)

        await clicar(botao('✨ Gerar exemplo'))

        const antes = lerProjeto()
        const daClasse = antes.relacoes
            .filter((relacao) => relacao.origem === antes.classes[0].nome)
            .length

        await clicar(botao('+ Relação'))

        expect(lerProjeto().relacoes).toHaveLength(antes.relacoes.length + 1)
        expect(lerProjeto().relacoes.at(-1).origem).toBe(antes.classes[0].nome)

        const posicao = daClasse + 1

        await selecionar(
            `.editor-fe15__inspector [aria-label="Classe relacionada ${posicao}"]`,
            'Produto'
        )

        await selecionar(
            `.editor-fe15__inspector [aria-label="Tipo da relação ${posicao}"]`,
            'MANY_TO_MANY'
        )

        const depois = lerProjeto()

        expect(depois.relacoes.at(-1)).toEqual({
            origem: antes.classes[0].nome,
            destino: 'Produto',
            tipo: 'MANY_TO_MANY',
        })

        expect(depois.classes).toEqual(antes.classes)
        expect(depois.servicosCloud).toEqual(antes.servicosCloud)
        expect(depois.conexoesCloud).toEqual(antes.conexoesCloud)

        expect(botao('Salvar').disabled).toBe(false)

        const remover = [
            ...container.querySelectorAll('.editor-fe15__inspector button'),
        ].filter((elemento) => elemento.textContent.trim() === 'Remover relação')

        await clicar(remover.at(-1))

        expect(lerProjeto().relacoes).toEqual(antes.relacoes)
        expect(lerProjeto().classes).toEqual(antes.classes)
    })

    it('não exibe mais a seção de configurações completas, só o JSON', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        expect(container.textContent).not.toContain('Configurações completas do projeto')
        expect(container.querySelector('.editor-fe15__advanced')).toBeNull()
        expect(container.querySelector('.editor-fe15__json summary').textContent)
            .toBe('Ver JSON que será enviado')
    })
})
