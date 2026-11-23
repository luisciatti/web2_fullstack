import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { criarZip, normalizarCaminho } from './downloadZip.js'

const abrir = async (artefatos) => {
    const blob = await criarZip(artefatos)
    return JSZip.loadAsync(await blob.arrayBuffer())
}

describe('ZIP de artefatos', () => {
    it.each([
        ['C:\\projeto\\src\\main\\java\\app\\Pedido.java', 'src/main/java/app/Pedido.java'],
        ['/projeto/src/main/resources/application.yml', 'src/main/resources/application.yml'],
        ['../projeto/./infra//aws/main.tf', 'infra/aws/main.tf'],
        ['\\\\servidor\\projeto\\docs\\UML\\visão.mmd', 'docs/UML/visão.mmd'],
        ['/projeto/pom.xml', 'pom.xml'],
        ['../CON.txt', '_CON.txt'],
        ['/tmp/pasta/../', ''],
        ['tmp/..', ''],
        [' ', ''],
    ])('normaliza %j para %j', (nome, esperado) => {
        expect(normalizarCaminho(nome)).toBe(esperado)
    })

    it('preserva pastas, Unicode, conteúdo literal e arquivos vazios', async () => {
        const entradas = {
            'src/main/java/app/Comércio.java': 'class Comércio {}',
            'src/main/resources/application.yml': 'name: Comércio',
            'infra/aws/main.tf': '',
            'docs/modelo.mmd': 'classDiagram',
            'pom.xml': '<project></project>',
        }
        const zip = await abrir([
            ...Object.entries(entradas).map(([nome, conteudo]) => ({ nome, conteudo })),
            { nome: 'docs/sem-conteudo.txt' },
            { nome: '' },
        ])
        expect(Object.keys(zip.files)).toEqual([...Object.keys(entradas), 'docs/sem-conteudo.txt'])
        for (const [nome, conteudo] of Object.entries(entradas)) {
            expect(await zip.file(nome).async('string')).toBe(conteudo)
        }
        expect(await zip.file('docs/sem-conteudo.txt').async('string')).toBe('')
    })

    it('mantém arquivos que colidem depois da normalização sem sobrescrever nenhum', async () => {
        const zip = await abrir([
            { nome: 'pasta', conteudo: 'arquivo com nome de diretório' },
            { nome: '/pasta/NOME.txt', conteudo: 'primeiro' },
            { nome: '../pasta/nome.txt', conteudo: 'segundo' },
            { nome: 'pasta/nome.txt', conteudo: 'terceiro' },
        ])
        expect(Object.keys(zip.files)).toEqual(['pasta (2)', 'pasta/NOME.txt', 'pasta/nome (2).txt', 'pasta/nome (3).txt'])
        expect(await zip.file('pasta/nome (2).txt').async('string')).toBe('segundo')
        expect(await zip.file('pasta/nome (3).txt').async('string')).toBe('terceiro')
    })

    it('rejeita listas sem arquivos com nome válido', async () => {
        await expect(criarZip([])).rejects.toThrow('Nenhum artefato')
        await expect(criarZip([{ nome: '../../' }])).rejects.toThrow('Nenhum artefato')
    })
})
