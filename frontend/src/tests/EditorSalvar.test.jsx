
import { describe, expect, it, vi } from 'vitest'

import {
    buildPayloadProjeto,
    createProjetoVazio,
    persistirProjeto,
    validarProjeto,
} from '../Editor.jsx'

const projetoTeste = () => ({
    ...createProjetoVazio(),
    nome: 'Projeto FE16',
    classes: [
        {
            nome: 'Cliente',
            atributos: [{ nome: 'id', tipo: 'Long' }],
            metodos: [],
        },
    ],
})

describe('FE-16 — Salvar projeto sem gerar código', () => {
    it('cria projeto novo usando POST', async () => {
        const request = vi.fn().mockResolvedValue({ id: 42 })
        const projeto = projetoTeste()

        const resultado = await persistirProjeto(
            projeto,
            'novo',
            request
        )

        expect(request).toHaveBeenCalledExactlyOnceWith(
            '/api/projetos',
            {
                method: 'POST',
                body: buildPayloadProjeto(projeto),
            }
        )

        expect(resultado).toEqual({
            id: 42,
            isCreate: true,
        })
    })

    it('salva novamente o mesmo projeto usando PUT', async () => {
        const request = vi.fn()
            .mockResolvedValueOnce({ id: 42 })
            .mockResolvedValueOnce({ id: 42 })

        const projeto = projetoTeste()

        const criado = await persistirProjeto(
            projeto,
            'novo',
            request
        )

        projeto.nome = 'Projeto FE16 atualizado'

        const atualizado = await persistirProjeto(
            projeto,
            criado.id,
            request
        )

        expect(request).toHaveBeenNthCalledWith(
            2,
            '/api/projetos/42',
            {
                method: 'PUT',
                body: buildPayloadProjeto(projeto),
            }
        )

        expect(atualizado.id).toBe(42)
        expect(request).toHaveBeenCalledTimes(2)
    })

    it('salvar nunca chama o endpoint de geração', async () => {
        const request = vi.fn().mockResolvedValue({ id: 42 })

        await persistirProjeto(
            projetoTeste(),
            'novo',
            request
        )

        const urls = request.mock.calls.map(([url]) => url)

        expect(urls).toEqual(['/api/projetos'])
        expect(urls.some((url) => url.includes('/gerar'))).toBe(false)
    })

    it('preserva os dados locais quando o servidor falha', async () => {
        const request = vi.fn().mockRejectedValue(
            new Error('Falha no servidor')
        )

        const projeto = projetoTeste()
        const copiaOriginal = structuredClone(projeto)

        await expect(
            persistirProjeto(projeto, 'novo', request)
        ).rejects.toThrow('Falha no servidor')

        expect(projeto).toEqual(copiaOriginal)
    })

    it('não aceita criação sem ID na resposta', async () => {
        const request = vi.fn().mockResolvedValue({})

        await expect(
            persistirProjeto(projetoTeste(), 'novo', request)
        ).rejects.toThrow(
            'O servidor não retornou o ID'
        )
    })

    it('continua validando campos obrigatórios', () => {
        const projeto = projetoTeste()
        projeto.nome = ''

        const erros = validarProjeto(projeto)

        expect(erros).toContain(
            'O nome do projeto é obrigatório.'
        )
    })
})
