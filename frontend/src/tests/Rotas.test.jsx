import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ROTAS, rotaDoHash } from '../App.jsx'
import Login from '../Login.jsx'

describe('rotas por hash', () => {
    it('usa a página inicial como padrão', () => {
        expect(rotaDoHash('')).toBe('inicio')
        expect(rotaDoHash('#inicio')).toBe('inicio')
        expect(rotaDoHash('#sobre-o-projeto')).toBe('inicio')
        expect(rotaDoHash('#qualquer-coisa')).toBe('inicio')
    })

    it('reconhece acesso e projetos', () => {
        expect(rotaDoHash(ROTAS.acesso)).toBe('acesso')
        expect(rotaDoHash(ROTAS.projetos)).toBe('projetos')
    })

    it('o cabeçalho do acesso tem Início e o botão Criar conta / Entrar', () => {
        const html = renderToString(createElement(Login, { onLoggedIn: () => { } }))
        expect(html).toContain('id="acesso"')
        expect(html).toContain('href="#inicio"')
        expect(html).toContain('Criar conta')
        const htmlCadastro = renderToString(createElement(Login, { onLoggedIn: () => { }, modoInicial: 'cadastro' }))
        expect(htmlCadastro).toContain('>Entrar</button>')
        expect(html).not.toContain('sobre-o-projeto')
    })
})
