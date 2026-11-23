import { describe, expect, it } from 'vitest'
import { gerarMermaidCloud } from './gerarMermaidCloud.js'

describe('gerarMermaidCloud', () => {
    it('gera nós e conexões válidos', () => {
        const fonte = gerarMermaidCloud({
            servicosCloud: [
                { id: 'api', tipo: 'EC2' },
                { id: 'db', tipo: 'RDS' },
            ],
            conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'API para banco' }],
        })
        expect(fonte.split('\n')[0]).toBe('flowchart LR')
        expect(fonte).toContain('["EC2<br/>api"]')
        expect(fonte).toContain('-->|"API para banco"|')
    })

    it('ignora serviços sem id, ids duplicados e conexões incompletas', () => {
        const fonte = gerarMermaidCloud({
            servicosCloud: [{ id: '', tipo: 'S3' }, { id: 'x', tipo: 'EC2' }, { id: 'x', tipo: 'RDS' }, { id: 'y', tipo: 'S3' }],
            conexoesCloud: [{ de: 'x', para: 'y' }, { de: 'y', para: '' }],
        })
        expect(fonte).toBe('flowchart LR\n    Servico_79["S3<br/>y"]')
    })

    it('neutraliza caracteres que quebram o Mermaid', () => {
        const fonte = gerarMermaidCloud({ servicosCloud: [{ id: 'a"]; click', tipo: '<b>EC2</b>' }] })
        expect(fonte).not.toMatch(/<b>|"\]; click/)
    })
})
