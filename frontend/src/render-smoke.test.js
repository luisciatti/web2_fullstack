import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Editor from './Editor.jsx'
import Login from './Login.jsx'
import Projetos from './Projetos.jsx'

describe('render smoke tests', () => {
    it('renderiza o login sem erro', () => {
        expect(() => renderToString(createElement(Login, { onLoggedIn: () => {} }))).not.toThrow()
    })

    it('renderiza a tela de projetos sem erro', () => {
        expect(() => renderToString(createElement(Projetos, { onNew: () => {}, onOpen: () => {}, onLogout: () => {} }))).not.toThrow()
    })

    it('renderiza o editor em modo novo sem erro', () => {
        expect(() => renderToString(createElement(Editor, {
            projectId: 'novo',
            onBack: () => {},
            onLogout: () => {},
            onProjectSaved: () => {},
        }))).not.toThrow()
    })

    it('renderiza o editor com projeto carregado sem erro', () => {
        expect(() => renderToString(createElement(Editor, {
            projectId: 42,
            onBack: () => {},
            onLogout: () => {},
            onProjectSaved: () => {},
        }))).not.toThrow()
    })
})
