import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api.js'
import {
    buscarProjetos,
    interpretarErroProjetos,
    filtrarEOrdenarProjetos
} from './Projetos.jsx'

vi.mock('./api.js', () => ({
    apiFetch: vi.fn()
}))

describe('FE-12 — Listagem de projetos', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('retorna três projetos da API', async () => {
        const projetos = [
            { id: 1, nome: 'Biblioteca', linguagem: 'Java' },
            { id: 2, nome: 'Estoque', linguagem: 'Java' },
            { id: 3, nome: 'Acadêmico', linguagem: 'Python' }
        ]

        apiFetch.mockResolvedValue(projetos)

        const resultado = await buscarProjetos()

        expect(apiFetch).toHaveBeenCalledWith('/api/projetos')
        expect(resultado).toEqual(projetos)
        expect(resultado).toHaveLength(3)
    })

    it('aceita uma lista vazia', async () => {
        apiFetch.mockResolvedValue([])

        const resultado = await buscarProjetos()

        expect(resultado).toEqual([])
    })

    it('não transforma uma resposta inválida em lista vazia', async () => {
        apiFetch.mockResolvedValue({
            conteudo: 'resposta inesperada'
        })

        await expect(buscarProjetos()).rejects.toThrow(
            'Resposta inesperada do servidor'
        )
    })

    it('identifica uma sessão expirada após erro 401', async () => {
        apiFetch.mockRejectedValue(
            new Error('Sessão expirada. Entre novamente.')
        )

        await expect(buscarProjetos()).rejects.toThrow(
            'Sessão expirada'
        )

        const resultado = interpretarErroProjetos(
            new Error('Sessão expirada. Entre novamente.')
        )

        expect(resultado.sessaoExpirada).toBe(true)
        expect(resultado.mensagem).toContain('Entre novamente')
    })

    it('trata falha do servidor sem confundir com sessão expirada', async () => {
        apiFetch.mockRejectedValue(
            new Error('Não consegui falar com o servidor')
        )

        await expect(buscarProjetos()).rejects.toThrow(
            'Não consegui falar com o servidor'
        )

        const resultado = interpretarErroProjetos(
            new Error('Não consegui falar com o servidor')
        )

        expect(resultado.sessaoExpirada).toBe(false)
        expect(resultado.mensagem).toBe(
            'Não consegui falar com o servidor'
        )
    })
})

describe('FE-13 — Busca e ordenação de projetos', () => {
    const projetos = [
        { id: 1, nome: 'Zebra' },
        { id: 2, nome: 'Árvore' },
        { id: 3, nome: 'Biblioteca' },
        { id: 4, nome: 'Ética' }
    ]

    it('encontra projetos pelo nome parcial', () => {
        const resultado = filtrarEOrdenarProjetos(
            [{ id: 1, nome: 'PedidoOnline' },
             { id: 2, nome: 'Cliente' }],
            'ped',
            'az'
        )

        expect(resultado.map((p) => p.nome)).toEqual([
            'PedidoOnline'
        ])
    })

    it('ignora maiúsculas, minúsculas e acentos na busca', () => {
        const resultado = filtrarEOrdenarProjetos(
            projetos,
            'ARVORE',
            'az'
        )

        expect(resultado.map((p) => p.nome)).toEqual([
            'Árvore'
        ])
    })

    it('mostra todos os projetos quando a busca está vazia', () => {
        const resultado = filtrarEOrdenarProjetos(
            projetos,
            '',
            'az'
        )

        expect(resultado).toHaveLength(4)
    })

    it('ordena A–Z respeitando caracteres acentuados', () => {
        const resultado = filtrarEOrdenarProjetos(
            projetos,
            '',
            'az'
        )

        expect(resultado.map((p) => p.nome)).toEqual([
            'Árvore',
            'Biblioteca',
            'Ética',
            'Zebra'
        ])
    })

    it('ordena Z–A respeitando caracteres acentuados', () => {
        const resultado = filtrarEOrdenarProjetos(
            projetos,
            '',
            'za'
        )

        expect(resultado.map((p) => p.nome)).toEqual([
            'Zebra',
            'Ética',
            'Biblioteca',
            'Árvore'
        ])
    })

    it('retorna vazio quando nenhum nome corresponde', () => {
        const resultado = filtrarEOrdenarProjetos(
            projetos,
            'Inexistente',
            'az'
        )

        expect(resultado).toEqual([])
    })

    it('não modifica a ordem da lista original', () => {
        const original = projetos.map((p) => p.nome)

        filtrarEOrdenarProjetos(projetos, '', 'az')

        expect(projetos.map((p) => p.nome)).toEqual(original)
    })
})