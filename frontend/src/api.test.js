import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, logout, readAuth, saveAuth } from './api.js'

describe('apiFetch', () => {
    beforeEach(() => {
        const store = new Map()
        Object.defineProperty(globalThis, 'localStorage', {
            value: {
                getItem: (key) => (store.has(key) ? store.get(key) : null),
                setItem: (key, value) => store.set(key, String(value)),
                removeItem: (key) => store.delete(key),
                clear: () => store.clear(),
            },
            configurable: true,
        })
        vi.restoreAllMocks()
    })

    it('faz um único refresh para duas requisições simultâneas com 403', async () => {
        saveAuth({ accessToken: 'token-velho', refreshToken: 'refresh-velho' })

        const refresh = vi.fn(async () => ({ ok: true, json: async () => ({ accessToken: 'token-novo', refreshToken: 'refresh-novo' }) }))
        const response403 = () => ({ ok: false, status: 403, headers: { get: () => 'text/plain' }, text: async () => '' })
        const requests = [
            vi.fn(response403),
            vi.fn(response403),
            vi.fn(response403),
            vi.fn(response403),
        ]

        vi.stubGlobal('fetch', vi.fn((url) => {
            if (url === '/api/auth/refresh') return refresh()
            if (url === '/api/projetos') return requests.shift()()
            return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ ok: true }) })
        }))

        const results = await Promise.allSettled([
            apiFetch('/api/projetos', { method: 'GET' }),
            apiFetch('/api/projetos', { method: 'GET' }),
        ])

        expect(refresh).toHaveBeenCalledTimes(1)
        expect(results.map((item) => item.status === 'rejected' ? item.reason.message : item.value)).toEqual([
            'Sem permissão para esta ação.',
            'Sem permissão para esta ação.',
        ])
    })

    it('logout revoga o refresh token no servidor e limpa o navegador', () => {
        saveAuth({ accessToken: 'acesso', refreshToken: 'refresh-atual' })
        const fetchMock = vi.fn(async () => ({ ok: true, status: 204, headers: { get: () => '' } }))
        vi.stubGlobal('fetch', fetchMock)

        logout()

        expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ refreshToken: 'refresh-atual' }),
        }))
        expect(readAuth()).toEqual({ accessToken: '', refreshToken: '' })
    })

    it('logout sem token não chama o servidor', () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        logout()

        expect(fetchMock).not.toHaveBeenCalled()
    })
})
