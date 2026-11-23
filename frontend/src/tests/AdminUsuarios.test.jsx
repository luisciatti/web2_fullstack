// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { saveAuth } from '../api.js'

let root
let host
let fetchMock

function entrar(role, hash) {
    saveAuth({ accessToken: `header.${btoa(JSON.stringify({ roles: [role] }))}.signature` })
    window.history.replaceState(null, '', hash)
    act(() => root.render(<App />))
}

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    fetchMock = vi.fn(async (url) => {
        const usuario = { id: 'u1', nome: 'Ana', email: 'ana@example.test', ativo: true }
        const dados = url === '/api/admin/usuarios' ? [usuario]
            : url === '/api/admin/usuarios/u1/projetos' ? {
                usuario,
                projetos: [{ id: 'p1', nome: 'Pedidos', linguagem: 'java', framework: 'spring-boot', provedorCloud: 'aws' }],
            } : []
        return new Response(JSON.stringify(dados), { headers: { 'content-type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    host = document.body.appendChild(document.createElement('div'))
    root = createRoot(host)
})

afterEach(() => {
    act(() => root.unmount())
    host.remove()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

it('permite ao administrador abrir os projetos de um usuário pela tabela', async () => {
    entrar('ROLE_ADMIN', '#usuarios')
    await act(async () => {})
    expect(host.querySelector('tbody').textContent).toContain('ana@example.test')

    await act(async () => {
        host.querySelector('a[href="#usuarios/u1"]').click()
        await new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }))
    })

    expect(host.querySelector('h1').textContent).toBe('Projetos do usuário')
    expect(host.querySelector('tbody').textContent).toContain('Pedidos')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/admin/usuarios', '/api/admin/usuarios/u1/projetos'])
})

it('redireciona usuário comum e não consulta a API administrativa', async () => {
    entrar('ROLE_USER', '#usuarios/u1')
    await act(async () => {})
    expect(window.location.hash).toBe('#projetos')
    expect(host.querySelector('a[href="#usuarios"]')).toBeNull()
    expect(fetchMock.mock.calls.every(([url]) => !url.startsWith('/api/admin/'))).toBe(true)
})
