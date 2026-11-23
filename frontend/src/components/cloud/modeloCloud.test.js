import { describe, expect, it } from 'vitest'
import { projetoCloud, projetoVazio } from '../../tests/fixtures/projetos.js'
import { atualizarServicoCloud, idsDisponiveis, removerServicoCloud } from './modeloCloud.js'

describe('modelo Cloud', () => {
    it('oferece somente IDs preenchidos e sem duplicatas após trim', () => {
        const projeto = projetoCloud()
        expect(idsDisponiveis(projetoVazio().servicosCloud)).toEqual([])
        expect(idsDisponiveis(projeto.servicosCloud)).toEqual(['api', 'db'])
        expect(idsDisponiveis([...projeto.servicosCloud, { id: ' api ' }, { id: ' ' }])).toEqual(['db'])
    })

    it('preserva configurações e rótulos ao renomear origem ou destino', () => {
        const projeto = projetoCloud()
        const origem = atualizarServicoCloud(projeto, 0, { id: 'gateway' })
        const destino = atualizarServicoCloud(origem, 1, { id: 'banco' })
        expect(destino.conexoesCloud).toEqual([{ de: 'gateway', para: 'banco', rotulo: 'API para banco' }])
        expect(destino.servicosCloud.map(({ configuracao }) => configuracao))
            .toEqual(projeto.servicosCloud.map(({ configuracao }) => configuracao))
        expect(projeto).toEqual(projetoCloud())
    })

    it.each([' ', ' db '])('limpa referência quando o novo ID %j é vazio ou ambíguo', (id) => {
        const atualizado = atualizarServicoCloud(projetoCloud(), 0, { id })
        expect(atualizado.conexoesCloud).toEqual([{ de: '', para: 'db', rotulo: 'API para banco' }])
    })

    it('remove as conexões somente quando o último serviço com aquele ID é excluído', () => {
        const projeto = projetoCloud()
        const duplicado = { ...projeto, servicosCloud: [...projeto.servicosCloud, projeto.servicosCloud[0]] }
        const primeiro = removerServicoCloud(duplicado, 0)
        expect(primeiro.conexoesCloud).toEqual(projeto.conexoesCloud)
        const ultimo = removerServicoCloud(primeiro, 1)
        expect(ultimo.conexoesCloud).toEqual([])
        expect(ultimo.servicosCloud).toEqual([projeto.servicosCloud[1]])
        expect(projeto).toEqual(projetoCloud())
    })
})
