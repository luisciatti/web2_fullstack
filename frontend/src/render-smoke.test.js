import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Editor, { DiagramPanel } from './Editor.jsx'
import Login from './Login.jsx'
import Projetos from './Projetos.jsx'

describe('render smoke tests', () => {
    it('renderiza o login sem erro', () => {
        expect(() => renderToString(createElement(Login, { onLoggedIn: () => { } }))).not.toThrow()
    })

    it('renderiza a tela de projetos sem erro', () => {
        expect(() => renderToString(createElement(Projetos, { onNew: () => { }, onOpen: () => { }, onLogout: () => { } }))).not.toThrow()
    })

    it('renderiza o editor em modo novo sem erro', () => {
        expect(() => renderToString(createElement(Editor, {
            projectId: 'novo',
            onBack: () => { },
            onLogout: () => { },
            onProjectSaved: () => { },
        }))).not.toThrow()
    })

    it('renderiza o editor com projeto carregado sem erro', () => {
        expect(() => renderToString(createElement(Editor, {
            projectId: 42,
            onBack: () => { },
            onLogout: () => { },
            onProjectSaved: () => { },
        }))).not.toThrow()
    })

    it('renderiza o painel UML vazio sem erro', () => {
        expect(() => renderToString(createElement(DiagramPanel, {
            title: 'UML',
            status: 'idle',
            diagram: '',
            error: '',
        }))).not.toThrow()
    })

    it('renderiza o painel UML em carregamento sem erro', () => {
        expect(() => renderToString(createElement(DiagramPanel, {
            title: 'UML',
            status: 'loading',
            diagram: '',
            error: '',
        }))).not.toThrow()
    })

    it('renderiza o painel UML com erro visível sem erro', () => {
        expect(() => renderToString(createElement(DiagramPanel, {
            title: 'UML',
            status: 'error',
            diagram: 'flowchart TD\nA-->B',
            error: 'Erro do Mermaid: Parse error',
        }))).not.toThrow()
    })
})
