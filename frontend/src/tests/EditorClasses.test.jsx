
/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Editor, {
    createProjetoVazio,
    renomearClasse,
    removerClasse,
    validarProjeto,
} from '../Editor.jsx'

import ClassManager from '../components/editor/ClassManager.jsx'

vi.mock('../components/editor/EditorUmlSlot.jsx', () => ({
    default: () => null,
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

const criarProjetoTeste = () => ({
    ...createProjetoVazio(),
    nome: 'Projeto FE17',
    classes: [
        { nome: 'Pedido', atributos: [], metodos: [] },
        { nome: 'Cliente', atributos: [], metodos: [] },
        { nome: 'Produto', atributos: [], metodos: [] },
    ],
    relacoes: [
        { origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' },
        { origem: 'Cliente', destino: 'Pedido', tipo: 'ONE_TO_MANY' },
        { origem: 'Produto', destino: 'Pedido', tipo: 'MANY_TO_ONE' },
        { origem: 'Cliente', destino: 'Produto', tipo: 'ONE_TO_MANY' },
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

const clicar = async (texto) => {
    const botao = [...container.querySelectorAll('button')]
        .find((elemento) => elemento.textContent.trim() === texto)

    expect(botao).toBeDefined()

    await act(async () => {
        botao.click()
    })
}

afterEach(async () => {
    if (root) {
        await act(async () => {
            root.unmount()
        })
    }

    container?.remove()
    root = null
    container = null
    vi.restoreAllMocks()
})

describe('FE-17 — CRUD de classes e seleção', () => {
    it('adiciona uma classe vazia e foca o campo do nome', async () => {
        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('+ Classe')

        const classes = container.querySelectorAll(
            '.editor-fe15__class-item'
        )

        const input = container.querySelector(
            '.editor-fe15__inspector-body label input'
        )

        expect(classes).toHaveLength(1)
        expect(classes[0].textContent).toContain('Classe 1')
        expect(input.value).toBe('')
        expect(document.activeElement).toBe(input)
    })

    it('permite selecionar outra classe por props', async () => {
        const onChange = vi.fn()
        const classes = [
            { nome: 'Pedido', atributos: [], metodos: [] },
            {
                nome: 'Cliente',
                atributos: [{ nome: 'id', tipo: 'Long' }],
                metodos: [],
            },
        ]

        await renderizar(
            <ClassManager
                classes={classes}
                selectedIndex={0}
                onChange={onChange}
            />
        )

        const botoes = container.querySelectorAll(
            '.editor-fe15__class-item'
        )

        expect(botoes[0].getAttribute('aria-pressed')).toBe('true')

        await act(async () => {
            botoes[1].click()
        })

        expect(onChange).toHaveBeenCalledWith(1)

        await act(async () => {
            root.render(
                <ClassManager
                    classes={classes}
                    selectedIndex={1}
                    onChange={onChange}
                />
            )
        })

        expect(
            container.querySelectorAll('.editor-fe15__class-item')[1]
                .getAttribute('aria-pressed')
        ).toBe('true')

        expect(container.textContent).toContain('Atributos (1)')
    })

    it('cancela exclusão quando o usuário não confirma', async () => {
        const confirmar = vi.spyOn(window, 'confirm')
            .mockReturnValue(false)

        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('+ Classe')
        await clicar('Excluir classe')

        expect(confirmar).toHaveBeenCalledOnce()
        expect(
            container.querySelectorAll('.editor-fe15__class-item')
        ).toHaveLength(1)
    })

    it('exclui a classe quando o usuário confirma', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)

        await renderizar(
            <Editor
                projectId="novo"
                onBack={() => {}}
                onLogout={() => {}}
            />
        )

        await clicar('+ Classe')
        await clicar('Excluir classe')

        expect(
            container.querySelectorAll('.editor-fe15__class-item')
        ).toHaveLength(0)
    })

    it('renomeia classe e atualiza origem e destino das relações', () => {
        const projeto = criarProjetoTeste()

        const atualizado = renomearClasse(projeto, 0, 'Ordem')

        expect(atualizado.classes[0].nome).toBe('Ordem')
        expect(atualizado.relacoes[0].origem).toBe('Ordem')
        expect(atualizado.relacoes[1].destino).toBe('Ordem')
        expect(atualizado.relacoes[2].destino).toBe('Ordem')

        expect(atualizado.relacoes[3]).toEqual(
            projeto.relacoes[3]
        )

        expect(projeto.classes[0].nome).toBe('Pedido')
    })

    it('exclui relações dependentes sem remover relações válidas', () => {
        const projeto = criarProjetoTeste()

        const atualizado = removerClasse(projeto, 0)

        expect(atualizado.classes.map((classe) => classe.nome))
            .toEqual(['Cliente', 'Produto'])

        expect(atualizado.relacoes).toEqual([
            {
                origem: 'Cliente',
                destino: 'Produto',
                tipo: 'ONE_TO_MANY',
            },
        ])

        expect(projeto.classes).toHaveLength(3)
        expect(projeto.relacoes).toHaveLength(4)
    })

    it('bloqueia o salvamento com nome de classe vazio', () => {
        const projeto = criarProjetoTeste()
        projeto.classes[0].nome = ''

        expect(validarProjeto(projeto)).toContain(
            'Há uma classe com nome vazio.'
        )
    })

    it('identifica nomes duplicados, inclusive com espaços', () => {
        const projeto = criarProjetoTeste()
        projeto.classes[2].nome = ' Cliente '

        expect(validarProjeto(projeto)).toContain(
            'A classe "Cliente" está duplicada.'
        )
    })

    it('permite rascunho parcial, mas mantém a validação', () => {
        const projeto = criarProjetoTeste()

        const atualizado = renomearClasse(projeto, 0, '   ')

        expect(atualizado.classes[0].nome).toBe('   ')
        expect(validarProjeto(atualizado)).toContain(
            'Há uma classe com nome vazio.'
        )
    })
})
