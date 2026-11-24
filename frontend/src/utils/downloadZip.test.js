import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { criarZip, normalizarCaminho } from './downloadZip.js'
import { prepararDownloadProjeto } from '../components/geracao/arvoreArquivos.js'

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

    it('empacota os artefatos do backend como projeto Maven organizado e sem perder conteúdo', async () => {
        const artefatos = [
            { tipo: 'JAVA_MODEL', nome: 'Pedido.java', conteudo: 'package com.example.demo.model;\npublic class Pedido {}' },
            { tipo: 'JAVA_MODEL', nome: 'Cliente.java', conteudo: 'package com.example.demo.model;\npublic class Cliente {}' },
            { tipo: 'JAVA_DAO', nome: 'PedidoRepositorio.java', conteudo: 'package com.example.demo.repositorio;\npublic interface PedidoRepositorio {}' },
            { tipo: 'JAVA_SERVICE', nome: 'PedidoServico.java', conteudo: 'package com.example.demo.servico;\npublic interface PedidoServico {}' },
            { tipo: 'JAVA_SERVICE', nome: 'PedidoServicoImpl.java', conteudo: 'package com.example.demo.servico;\npublic class PedidoServicoImpl {}' },
            { tipo: 'JAVA_CONTROLLER', nome: 'PedidoControlador.java', conteudo: 'package com.example.demo.controlador;\npublic class PedidoControlador {}' },
            { tipo: 'CONFIG', nome: 'Application.java', conteudo: 'package com.example.demo;\npublic class Application {}' },
            { tipo: 'CONFIG', nome: 'pom.xml', conteudo: '<project />' },
            { tipo: 'CONFIG', nome: 'application.yml', conteudo: 'spring: {}' },
            { tipo: 'INFRA', nome: 'main.tf', conteudo: 'resource "x" "y" {}' },
            { tipo: 'INFRA', nome: 'deployment.yaml', conteudo: 'kind: Deployment' },
            { tipo: 'DIAGRAM', nome: 'diagrama.mmd', conteudo: 'classDiagram' },
            { tipo: 'DIAGRAM', nome: 'cloud.mmd', conteudo: 'flowchart LR' },
        ]

        const zip = await abrir(prepararDownloadProjeto(artefatos))
        const esperados = [
            'src/main/java/com/example/demo/model/Pedido.java',
            'src/main/java/com/example/demo/model/Cliente.java',
            'src/main/java/com/example/demo/repositorio/PedidoRepositorio.java',
            'src/main/java/com/example/demo/servico/PedidoServico.java',
            'src/main/java/com/example/demo/servico/PedidoServicoImpl.java',
            'src/main/java/com/example/demo/controlador/PedidoControlador.java',
            'src/main/java/com/example/demo/Application.java',
            'pom.xml',
            'src/main/resources/application.yml',
            'infra/terraform/main.tf',
            'infra/k8s/deployment.yaml',
            'docs/diagrama.mmd',
            'docs/cloud.mmd',
        ]
        expect(Object.keys(zip.files)).toEqual(esperados)
        for (const [i, nome] of esperados.entries()) {
            expect(await zip.file(nome).async('string')).toBe(artefatos[i].conteudo)
        }
    })

    it('preserva compatibilidade com arquivos Java antigos sem declaração de pacote', async () => {
        const zip = await abrir(prepararDownloadProjeto([
            { tipo: 'JAVA_MODEL', nome: 'Produto.java', conteudo: 'public class Produto {}' },
            { tipo: 'CONFIG', nome: 'pom.xml', conteudo: 'pom' },
        ]))
        expect(Object.keys(zip.files)).toEqual(['src/main/java/model/Produto.java', 'pom.xml'])
    })

    it('rejeita listas sem arquivos com nome válido', async () => {
        await expect(criarZip([])).rejects.toThrow('Nenhum artefato')
        await expect(criarZip([{ nome: '../../' }])).rejects.toThrow('Nenhum artefato')
    })
})
