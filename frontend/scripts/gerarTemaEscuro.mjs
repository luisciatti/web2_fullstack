#!/usr/bin/env node
/*
 * Gera src/styles/temaEscuro.css a partir dos CSS do app.
 *
 * Para cada regra que define cor, cria uma regra equivalente com o prefixo
 * html[data-tema="escuro"], trocando as cores pela paleta escura do VS Code
 * (Dark+). Como todos os seletores ganham o mesmo prefixo, a ordem e a
 * especificidade relativa entre as regras originais são preservadas.
 *
 * Rode depois de alterar cores em algum CSS:  npm run tema:escuro
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const PREFIXO = 'html[data-tema="escuro"]'

// Ordem igual à de carregamento no app. CodeWorkspace.css fica de fora: a janela de código já é escura.
const ARQUIVOS = [
    'styles/tokens.css',
    'style.css',
    'Login.css',
    'Sobre.css',
    'Projetos.css',
    'Editor.css',
    'components/cloud/CloudServicesPanel.css',
    'components/cloud/CloudConnectionsPanel.css',
    'components/cloud/CloudPreview.css',
    'components/diagramas/UmlLivePreview.css',
    'components/geracao/ArtifactsPanel.css',
    'components/geracao/GenerationPanel.css',
]

/* ---------- Cores ---------- */

const NOMEADAS = { white: '#ffffff', black: '#000000' }
const REGEX_COR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g

function lerCor(texto) {
    const t = texto.trim().toLowerCase()
    if (NOMEADAS[t]) return lerCor(NOMEADAS[t])
    if (t.startsWith('#')) {
        let h = t.slice(1)
        if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
        const n = (i) => parseInt(h.slice(i, i + 2), 16)
        return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 }
    }
    const partes = t.replace(/^rgba?\(|\)$/g, '').split(/[\s,/]+/).filter(Boolean)
    if (partes.length < 3) return null
    const canal = (v) => v.endsWith('%') ? Math.round(parseFloat(v) * 2.55) : parseFloat(v)
    const alfa = partes[3] === undefined ? 1 : partes[3].endsWith('%') ? parseFloat(partes[3]) / 100 : parseFloat(partes[3])
    return { r: canal(partes[0]), g: canal(partes[1]), b: canal(partes[2]), a: alfa }
}

function hsl({ r, g, b }) {
    const [R, G, B] = [r / 255, g / 255, b / 255]
    const max = Math.max(R, G, B)
    const min = Math.min(R, G, B)
    const l = (max + min) / 2
    if (max === min) return { h: 0, s: 0, l }
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h
    if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60
    else if (max === G) h = ((B - R) / d + 2) * 60
    else h = ((R - G) / d + 4) * 60
    return { h, s, l }
}

const familia = ({ h, s }) => {
    if (s < 0.18) return 'neutra'
    if (h < 20 || h >= 330) return 'vermelha'
    if (h < 65) return 'amarela'
    if (h < 165) return 'verde'
    return 'azul'
}

function comAlfa(hex, a) {
    if (a >= 1) return hex
    const c = lerCor(hex)
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${Number(a.toFixed(3))})`
}

// Paleta VS Code Dark+.
const P = {
    pagina: '#181818', editor: '#1e1e1e', painel: '#252526', elevado: '#2d2d30',
    controle: '#3c3c3c', selecao: '#04395e', realce: '#26343d',
    botao: '#0e639c', botaoHover: '#1177bb',
    texto: '#e1e1e1', textoSuave: '#cccccc', textoMudo: '#9d9d9d', textoApagado: '#6e7681',
    borda: '#3c3c3c', bordaForte: '#555555', foco: '#007fd4',
    azul: '#3794ff', vermelho: '#f48771', verde: '#89d185', amarelo: '#cca700',
    fundoVermelho: '#3a1d1d', fundoVerde: '#1e3a24', fundoAmarelo: '#3a3520',
    bordaVermelha: '#6b2b2b', vermelhoForte: '#a1260d', verdeForte: '#388a34',
}

function mapear(cor, papel, contexto) {
    const c = lerCor(cor)
    if (!c || Number.isNaN(c.r)) return cor
    const { s, l } = hsl(c)
    const f = familia(hsl(c))
    const hover = contexto.hover

    if (papel === 'sombra') {
        if (f === 'azul' && s > 0.3) return comAlfa(P.foco, Math.max(c.a, 0.5))
        return `rgba(0, 0, 0, ${Number(Math.min(0.6, c.a * 3 + 0.1).toFixed(3))})`
    }

    if (papel === 'fundo') {
        if (f === 'vermelha') return comAlfa(l > 0.7 ? P.fundoVermelho : P.vermelhoForte, c.a)
        if (f === 'verde') return comAlfa(l > 0.7 ? P.fundoVerde : P.verdeForte, c.a)
        if (f === 'amarela') return comAlfa(l > 0.7 ? P.fundoAmarelo : P.amarelo, c.a)
        if (l < 0.4) {
            if (f === 'azul') return comAlfa(hover || l < 0.15 ? P.botaoHover : P.botao, c.a)
            return comAlfa(P.editor, c.a)
        }
        if (f === 'azul' && s > 0.3 && l <= 0.85) return comAlfa(hover ? P.botaoHover : P.botao, c.a)
        if (f === 'azul' && s > 0.25 && l >= 0.945) return comAlfa(hover ? P.elevado : P.editor, c.a)
        if (f === 'azul' && s > 0.25) return comAlfa(hover ? P.selecao : P.realce, c.a)
        if (l >= 0.995) return comAlfa(P.painel, c.a)
        if (l >= 0.975) return comAlfa(hover ? P.elevado : P.editor, c.a)
        if (l >= 0.955) return comAlfa(P.pagina, c.a)
        return comAlfa(hover ? '#45494e' : P.controle, c.a)
    }

    if (papel === 'borda') {
        if (f === 'vermelha') return comAlfa(l > 0.6 ? P.bordaVermelha : P.vermelho, c.a)
        if (f === 'verde') return comAlfa(P.verdeForte, c.a)
        if (l < 0.4 && f === 'azul') return comAlfa(P.foco, c.a)
        if (l < 0.5) return comAlfa(P.bordaForte, c.a)
        if (l < 0.85) return comAlfa(hover ? '#6b6b6b' : P.bordaForte, c.a)
        return comAlfa(hover ? P.bordaForte : P.borda, c.a)
    }

    // texto
    if (l >= 0.97) return comAlfa('#ffffff', c.a)
    if (f === 'vermelha') return comAlfa(P.vermelho, c.a)
    if (f === 'verde') return comAlfa(P.verde, c.a)
    if (f === 'amarela') return comAlfa(P.amarelo, c.a)
    if (f === 'azul' && s > 0.3 && l >= 0.35 && l < 0.75) return comAlfa(P.azul, c.a)
    if (l < 0.3) return comAlfa(P.texto, c.a)
    if (l < 0.42) return comAlfa(P.textoSuave, c.a)
    if (l < 0.72) return comAlfa(P.textoMudo, c.a)
    if (l < 0.9) return comAlfa(P.textoApagado, c.a)
    return comAlfa('#d7e9f7', c.a)
}

function papelDaPropriedade(prop) {
    if (/^(background|background-color|background-image)$/.test(prop)) return 'fundo'
    if (/^(box-shadow|text-shadow|filter)$/.test(prop)) return 'sombra'
    if (/^(border|border-(top|right|bottom|left|block|inline)(-start|-end)?(-color)?|border-color|outline|outline-color|column-rule|column-rule-color)$/.test(prop)) return 'borda'
    if (/^(color|fill|stroke|caret-color|text-decoration-color|-webkit-text-fill-color|accent-color)$/.test(prop)) return 'texto'
    return null
}

/* ---------- Variáveis CSS ---------- */

const variaveis = new Map()

function resolverVars(valor, profundidade = 0) {
    if (profundidade > 8 || !valor.includes('var(')) return valor
    const resolvido = valor.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (todo, nome, reserva) => {
        if (variaveis.has(nome)) return variaveis.get(nome)
        return reserva !== undefined ? reserva.trim() : todo
    })
    return resolverVars(resolvido, profundidade + 1)
}

/* ---------- Seletores ---------- */

function prefixar(seletor) {
    const s = seletor.trim()
    if (s.includes('.code-ws')) return null
    if (/^:root\b/.test(s)) return s.replace(/^:root/, PREFIXO)
    if (/^html\b/.test(s)) return s.replace(/^html/, PREFIXO)
    return `${PREFIXO} ${s}`
}

/* ---------- Geração ---------- */

const saida = postcss.root()

for (const arquivo of ARQUIVOS) {
    const caminho = join(raiz, arquivo)
    const css = postcss.parse(readFileSync(caminho, 'utf8'), { from: caminho })

    // Primeiro registra as variáveis declaradas no arquivo.
    css.walkDecls(/^--/, (decl) => { variaveis.set(decl.prop, decl.value) })

    const bloco = postcss.root()
    css.walkRules((regra) => {
        if (regra.parent?.type === 'atrule' && /keyframes$/i.test(regra.parent.name)) return

        const hover = /:hover|:active|:focus/.test(regra.selector)
        const decls = []
        regra.each((no) => {
            if (no.type !== 'decl' || no.prop.startsWith('--')) return
            const papel = papelDaPropriedade(no.prop)
            if (!papel) return
            const valor = resolverVars(no.value)
            // Declarações sem cor (transparent, none, inherit...) também são copiadas,
            // para que a cascata dentro do tema escuro seja a mesma do tema claro.
            const novo = valor.replace(REGEX_COR, (cor) => mapear(cor, papel, { hover }))
            REGEX_COR.lastIndex = 0
            decls.push(postcss.decl({ prop: no.prop, value: novo, important: no.important }))
        })
        if (!decls.length) return

        const seletores = regra.selectors.map(prefixar).filter(Boolean)
        if (!seletores.length) return

        const nova = postcss.rule({ selectors: seletores })
        decls.forEach((decl) => nova.append(decl))

        // Mantém o @media (ou outro at-rule) que envolve a regra original.
        let destino = bloco
        const cadeia = []
        for (let pai = regra.parent; pai && pai.type === 'atrule'; pai = pai.parent) cadeia.unshift(pai)
        for (const at of cadeia) {
            const existente = destino.last?.type === 'atrule' && destino.last.name === at.name && destino.last.params === at.params
                ? destino.last
                : null
            if (existente) destino = existente
            else {
                const copia = postcss.atRule({ name: at.name, params: at.params })
                destino.append(copia)
                destino = copia
            }
        }
        destino.append(nova)
    })

    if (bloco.nodes.length) {
        saida.append(postcss.comment({ text: ` ${relative(raiz, caminho).replace(/\\/g, '/')} ` }))
        saida.append(bloco.nodes)
    }
}

const cabecalho = `/*
 * Tema escuro (estilo VS Code Dark+).
 * ARQUIVO GERADO por scripts/gerarTemaEscuro.mjs — não edite à mão.
 * Ajustes manuais ficam em src/styles/temaEscuroAjustes.css.
 */

html[data-tema="escuro"] {
    color-scheme: dark;
}

`
const css = saida.toResult({ map: false }).css
writeFileSync(join(raiz, 'styles', 'temaEscuro.css'), cabecalho + css.replace(/\n{3,}/g, '\n\n') + '\n')
console.log(`temaEscuro.css gerado (${(css.match(/\{/g) || []).length} regras).`)
