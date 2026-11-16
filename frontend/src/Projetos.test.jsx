import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api.js'
import {
    buscarProjetos,
    interpretarErroProjetos,
    filtrarEOrdenarProjetos,
    excluirProjetoConfirmado,
    removerProjetoDaLista
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

describe('FE-14 — Ações de projetos', () => {
    const projeto = { id: 2, nome: 'Estoque' }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('não executa DELETE quando a confirmação é cancelada', async () => {
        const confirmar = vi.fn().mockReturnValue(false)

        const resultado = await excluirProjetoConfirmado(
            projeto,
            { confirmar }
        )

        expect(confirmar).toHaveBeenCalledWith(
            expect.stringContaining('"Estoque"')
        )
        expect(resultado).toBe(false)
        expect(apiFetch).not.toHaveBeenCalled()
    })

    it('exclui o projeto e aceita uma resposta 204 sem corpo', async () => {
        apiFetch.mockResolvedValue(null)

        const aoConfirmar = vi.fn()

        const resultado = await excluirProjetoConfirmado(
            projeto,
            {
                confirmar: () => true,
                aoConfirmar
            }
        )

        expect(resultado).toBe(true)
        expect(aoConfirmar).toHaveBeenCalledOnce()
        expect(apiFetch).toHaveBeenCalledWith(
            '/api/projetos/2',
            { method: 'DELETE' }
        )
    })

    it('remove apenas o projeto escolhido', () => {
        const lista = [
            { id: 1, nome: 'Biblioteca' },
            { id: 2, nome: 'Estoque' },
            { id: 3, nome: 'Loja' }
        ]

        const resultado = removerProjetoDaLista(lista, 2)

        expect(resultado.map((p) => p.id)).toEqual([1, 3])
        expect(lista).toHaveLength(3)
    })

    it('propaga erro de permissão na exclusão', async () => {
        apiFetch.mockRejectedValue(
            new Error('Sem permissão para esta ação.')
        )

        await expect(
            excluirProjetoConfirmado(projeto, {
                confirmar: () => true
            })
        ).rejects.toThrow('Sem permissão')
    })

    it('propaga erro quando o projeto não existe', async () => {
        apiFetch.mockRejectedValue(
            new Error('Projeto não encontrado')
        )

        await expect(
            excluirProjetoConfirmado(projeto, {
                confirmar: () => true
            })
        ).rejects.toThrow('Projeto não encontrado')
    })

    it('propaga erro de rede sem excluir localmente', async () => {
        apiFetch.mockRejectedValue(
            new Error('Não consegui falar com o servidor')
        )

        await expect(
            excluirProjetoConfirmado(projeto, {
                confirmar: () => true
            })
        ).rejects.toThrow('Não consegui falar com o servidor')
    })

    it('propaga sessão expirada durante a exclusão', async () => {
        apiFetch.mockRejectedValue(
            new Error('Sessão expirada. Entre novamente.')
        )

        await expect(
            excluirProjetoConfirmado(projeto, {
                confirmar: () => true
            })
        ).rejects.toThrow('Sessão expirada')
    })
})