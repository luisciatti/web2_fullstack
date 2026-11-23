import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import ArtifactsPanel from './ArtifactsPanel.jsx'

it('mostra estado vazio sem botão de download', () => {
    const html = renderToStaticMarkup(<ArtifactsPanel resultado={{ artefatos: [] }} />)
    expect(html).toContain('Nenhum artefato disponível')
    expect(html).not.toContain('<button')
})

it('agrupa os artefatos e exibe o conteúdo como código escapado', () => {
    const resultado = {
        artefatos: [
            { nome: 'App.java', conteudo: 'public class App {}' },
            { nome: 'pom.xml', conteudo: '<project><name>A & B</name></project>' },
            { nome: 'infra/main.tf', conteudo: '' },
            { nome: 'docs/modelo.mmd', conteudo: 'classDiagram' },
        ],
    }
    const html = renderToStaticMarkup(<ArtifactsPanel resultado={resultado} />)
    for (const grupo of ['Java', 'Config', 'Infra', 'Diagramas']) {
        expect(html).toContain(`<h3>${grupo}</h3>`)
    }
    expect(html).toContain('Baixar tudo (.zip)')
    expect(html).toContain('<pre><code>&lt;project&gt;&lt;name&gt;A &amp; B')
    expect(html).not.toContain('<project>')
    expect(html).toContain('Arquivo sem conteúdo')
})
