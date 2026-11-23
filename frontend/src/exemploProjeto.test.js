import { describe, expect, it } from 'vitest'
import { validarProjeto } from './Editor.jsx'
import { gerarProjetoExemplo, projetoTemConteudo } from './exemploProjeto.js'

const PROIBIDOS = /[\r\n";|{}]/

function todosOsTextos(valor) {
    if (typeof valor === 'string') return [valor]
    if (Array.isArray(valor)) return valor.flatMap(todosOsTextos)
    if (valor && typeof valor === 'object') return Object.entries(valor).flatMap(([chave, item]) => [chave, ...todosOsTextos(item)])
    return []
}

describe('projeto de exemplo', () => {
    it.each(['aws', 'oci'])('é válido e completo para %s', (provedorCloud) => {
        const projeto = gerarProjetoExemplo({ provedorCloud })

        expect(validarProjeto(projeto)).toEqual([])
        expect(projeto.provedorCloud).toBe(provedorCloud)
        expect(projeto.classes.length).toBeGreaterThanOrEqual(5)
        expect(projeto.relacoes.length).toBeGreaterThanOrEqual(4)
        expect(projeto.servicosCloud.some((servico) => servico.categoria === 'DATA')).toBe(true)
        expect(projeto.conexoesCloud.length).toBeGreaterThanOrEqual(3)
    })

    it('respeita a validação de texto do back-end', () => {
        for (const provedorCloud of ['aws', 'oci']) {
            const textos = todosOsTextos(gerarProjetoExemplo({ provedorCloud }))
            expect(textos.filter((texto) => PROIBIDOS.test(texto))).toEqual([])
        }
    })

    it('mantém o nome atual e usa um nome padrão quando vazio', () => {
        expect(gerarProjetoExemplo({ nome: 'Meu sistema' }).nome).toBe('Meu sistema')
        expect(gerarProjetoExemplo({ nome: '  ' }).nome).toBe('Loja Virtual')
    })

    it('devolve cópias independentes', () => {
        const a = gerarProjetoExemplo()
        a.classes[0].atributos.push({ nome: 'x', tipo: 'String' })
        expect(gerarProjetoExemplo().classes[0].atributos).not.toContainEqual({ nome: 'x', tipo: 'String' })
    })

    it('detecta quando o projeto já tem conteúdo', () => {
        expect(projetoTemConteudo({ classes: [], servicosCloud: [] })).toBe(false)
        expect(projetoTemConteudo({ classes: [{ nome: 'A' }] })).toBe(true)
        expect(projetoTemConteudo({ servicosCloud: [{ id: 'x' }] })).toBe(true)
    })
})
