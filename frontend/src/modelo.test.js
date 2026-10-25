import { describe, expect, it } from 'vitest'
import { EXEMPLO_MODELO, createProjetoVazio, modeloParaTexto, parseModelo } from './modelo.js'

describe('modelo', () => {
    it('faz ida e volta do texto para JSON', () => {
        const projeto = parseModelo(EXEMPLO_MODELO)
        expect(projeto.classes.length).toBeGreaterThan(0)
        expect(projeto.relacoes.length).toBeGreaterThan(0)
        expect(modeloParaTexto(projeto)).toContain('Classe Pedido')
    })

    it('lança erro com número de linha em texto inválido', () => {
        expect(() => parseModelo('Classe Pedido\n  id: Long\nX invalido')).toThrow(/Linha 3/)
    })
})
