/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CodeWorkspace from './CodeWorkspace.jsx'
import { caminhoNoProjeto, listarArquivos, montarArvore } from './arvoreArquivos.js'
import { tokenizar, tokensPorLinha } from './destacarCodigo.js'

vi.mock('../../diagramas/renderizarMermaid.js', () => ({
    renderizarMermaid: (fonte, _prefixo, _classe, onResultado) => {
        onResultado({ fonte, status: 'success', svg: '<svg data-testid="svg"></svg>' })
        return () => { }
    },
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const resultado = {
    artefatos: [
        { tipo: 'JAVA_MODEL', nome: 'Pedido.java', conteudo: '@Entity\npublic class Pedido {\n    private Long id; // chave\n}' },
        { tipo: 'JAVA_CONTROLLER', nome: 'PedidoControlador.java', conteudo: 'public class PedidoControlador {}' },
        { tipo: 'CONFIG', nome: 'pom.xml', conteudo: '<project></project>' },
        { tipo: 'CONFIG', nome: 'application.yml', conteudo: 'spring:\n  datasource:\n    url: x' },
        { tipo: 'INFRA', nome: 'main.tf', conteudo: 'resource "aws_instance" "api" {}' },
        { tipo: 'DIAGRAM', nome: 'cloud.mmd', conteudo: 'flowchart LR\n  a --> b' },
    ],
}

let container = null
let root = null

const renderizar = async (props) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
        root.render(<CodeWorkspace aberto resultado={resultado} nomeProjeto="Loja" onFechar={() => { }} {...props} />)
    })
}

const botaoCom = (texto) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === texto)
const clicar = async (elemento) => { await act(async () => { elemento.click() }) }

afterEach(async () => {
    if (root) await act(async () => { root.unmount() })
    container?.remove()
    root = null
    container = null
})

describe('arvoreArquivos', () => {
    it('organiza os artefatos em pastas de projeto', () => {
        expect(caminhoNoProjeto({ tipo: 'JAVA_MODEL', nome: 'Pedido.java' })).toBe('src/main/java/model/Pedido.java')
        expect(caminhoNoProjeto({ tipo: 'JAVA_DAO', nome: 'PedidoRepositorio.java' })).toBe('src/main/java/repositorio/PedidoRepositorio.java')
        expect(caminhoNoProjeto({ tipo: 'CONFIG', nome: 'Application.java' })).toBe('src/main/java/Application.java')
        expect(caminhoNoProjeto({ tipo: 'CONFIG', nome: 'application.yml' })).toBe('src/main/resources/application.yml')
        expect(caminhoNoProjeto({ tipo: 'CONFIG', nome: 'pom.xml' })).toBe('pom.xml')
        expect(caminhoNoProjeto({ tipo: 'INFRA', nome: 'main.tf' })).toBe('infra/terraform/main.tf')
        expect(caminhoNoProjeto({ tipo: 'INFRA', nome: 'deployment.yaml' })).toBe('infra/k8s/deployment.yaml')
        expect(caminhoNoProjeto({ tipo: 'DIAGRAM', nome: 'diagrama.mmd' })).toBe('docs/diagrama.mmd')
        expect(caminhoNoProjeto({ nome: '../../etc/passwd' })).toBe('etc/passwd')
    })

    it('evita caminhos duplicados e ordena pastas antes de arquivos', () => {
        const arquivos = listarArquivos([{ nome: 'a.txt' }, { nome: 'a.txt' }, { tipo: 'JAVA_MODEL', nome: 'X.java' }])
        expect(arquivos.map((a) => a.caminho)).toEqual(['a.txt', 'a (2).txt', 'src/main/java/model/X.java'])
        const arvore = montarArvore(arquivos)
        expect(arvore.pastas.map((p) => p.nome)).toEqual(['src'])
        expect(arvore.arquivos.map((a) => a.nome)).toEqual(['a (2).txt', 'a.txt'])
    })
})

describe('destacarCodigo', () => {
    it('identifica palavras-chave, tipos, strings, comentários e anotações em Java', () => {
        const tipos = tokenizar('@Entity public class A { String s = "x"; // c\n}', 'java')
            .filter((t) => t.tipo !== 'simples').map((t) => [t.tipo, t.texto])
        expect(tipos).toEqual([
            ['anotacao', '@Entity'], ['palavraChave', 'public'], ['palavraChave', 'class'],
            ['tipo', 'A'], ['tipo', 'String'], ['texto', '"x"'], ['comentario', '// c'],
        ])
    })

    it('preserva o texto original e divide por linhas', () => {
        const codigo = '/* a\nb */ int x = 1;'
        const linhas = tokensPorLinha(codigo, 'java')
        expect(linhas).toHaveLength(2)
        expect(linhas.map((l) => l.map((t) => t.texto).join('')).join('\n')).toBe(codigo)
        expect(tokenizar('<b>oi</b>', 'desconhecida')).toEqual([{ tipo: 'simples', texto: '<b>oi</b>' }])
    })
})

describe('CodeWorkspace', () => {
    it('não renderiza quando fechado', async () => {
        await renderizar({ aberto: false })
        expect(document.querySelector('[role="dialog"]')).toBeNull()
    })

    it('abre a primeira classe com números de linha e realce', async () => {
        await renderizar()
        const dialogo = document.querySelector('[role="dialog"]')
        expect(dialogo.getAttribute('aria-modal')).toBe('true')
        expect(dialogo.textContent).toContain('Loja — Código gerado')
        expect(document.querySelector('.code-ws__tab.is-active').textContent).toContain('Pedido.java')
        expect(document.querySelectorAll('.code-ws__line')).toHaveLength(4)
        expect(document.querySelector('.tok-anotacao').textContent).toBe('@Entity')
        expect(document.querySelector('.code-ws__statusbar').textContent).toContain('6 arquivos gerados')
    })

    it('abre arquivos em abas, fecha abas e filtra pela busca', async () => {
        await renderizar()
        await clicar(botaoCom('Ypom.xml') || [...document.querySelectorAll('.code-ws__tree-row')].find((b) => b.textContent.includes('application.yml')))
        expect(document.querySelectorAll('.code-ws__tab')).toHaveLength(2)
        expect(document.querySelector('.code-ws__breadcrumb').textContent).toContain('src › main › resources › application.yml')

        await clicar(document.querySelector('[aria-label="Fechar application.yml"]'))
        expect(document.querySelectorAll('.code-ws__tab')).toHaveLength(1)

        const busca = document.querySelector('input[type="search"]')
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
        await act(async () => {
            setter.call(busca, 'main.tf')
            busca.dispatchEvent(new Event('input', { bubbles: true }))
        })
        const linhas = [...document.querySelectorAll('.code-ws__tree-row')]
        expect(linhas.map((b) => b.textContent)).toEqual(['TFmain.tf'])
    })

    it('mostra a prévia de diagramas .mmd e alterna para o código', async () => {
        await renderizar()
        await clicar([...document.querySelectorAll('.code-ws__tree-row')].find((b) => b.textContent.includes('cloud.mmd')))
        expect(document.querySelector('[data-testid="svg"]')).not.toBeNull()
        await clicar(botaoCom('Código'))
        expect(document.querySelector('.code-ws__code')).not.toBeNull()
    })

    it('fecha com Esc e baixa o ZIP pelo botão', async () => {
        const onFechar = vi.fn()
        const onBaixar = vi.fn().mockResolvedValue()
        await renderizar({ onFechar, onBaixar })
        await clicar(botaoCom('⤓ Baixar .zip'))
        expect(onBaixar).toHaveBeenCalledTimes(1)
        await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
        expect(onFechar).toHaveBeenCalledTimes(1)
    })
})
