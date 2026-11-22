import { describe, expect, it, vi } from 'vitest'
import mermaid from 'mermaid'
import { gerarMermaidUml } from './gerarMermaidUml.js'

function obterIds(diagrama) {
    return [...diagrama.matchAll(/^\s*class (\w+)\[/gm)].map((resultado) => resultado[1])
}

// Mesmo formato do EXEMPLO_PROJETO de Editor.jsx, sem importar a camada visual.
function exemploProjeto() {
    return {
        nome: 'Pedido',
        classes: [
            {
                nome: 'Pedido',
                atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'valor', tipo: 'BigDecimal' }],
                metodos: [{ nome: 'calcularTotal', tipoRetorno: 'BigDecimal' }],
            },
            {
                nome: 'Cliente',
                atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'nome', tipo: 'String' }],
                metodos: [],
            },
        ],
        relacoes: [{ origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' }],
    }
}

describe('gerarMermaidUml', () => {
    it('mantém o diagrama ao inserir uma classe vazia e a inclui quando ganha nome', () => {
        const projeto = exemploProjeto()
        const rascunho = { ...projeto, classes: [...projeto.classes, { nome: '  ' }] }
        expect(gerarMermaidUml(rascunho)).toBe(gerarMermaidUml(projeto))

        const editado = { ...projeto, classes: [...projeto.classes, { nome: 'Entrega' }] }
        expect(gerarMermaidUml(editado)).toContain('["Entrega"]')
    })

    it('reflete edições de membro e cardinalidade no texto Mermaid', () => {
        const projeto = exemploProjeto()
        const [pedido, cliente] = projeto.classes
        const editado = {
            ...projeto,
            classes: [{
                ...pedido,
                atributos: [{ nome: 'preco', tipo: 'Double' }],
                metodos: [{ nome: 'recalcular', tipoRetorno: 'void' }],
            }, cliente],
            relacoes: [{ ...projeto.relacoes[0], tipo: 'ONE_TO_MANY' }],
        }
        const antes = gerarMermaidUml(projeto)
        const depois = gerarMermaidUml(editado)
        const [idPedido, idCliente] = obterIds(antes)

        expect(depois).toContain(`${idPedido} : Double preco`)
        expect(depois).toContain(`${idPedido} : recalcular() void`)
        expect(depois).toContain(`${idPedido} "1" -- "*" ${idCliente}`)
        expect(depois).not.toContain('BigDecimal valor')
        expect(depois).not.toContain('calcularTotal()')
        expect(depois).not.toContain(`${idPedido} "*" -- "1" ${idCliente}`)
    })

    it('remove a classe excluída e a associação mesmo com a relação no projeto', () => {
        const projeto = exemploProjeto()
        const editado = { ...projeto, classes: [projeto.classes[0]] }
        const diagrama = gerarMermaidUml(editado)
        expect(obterIds(diagrama)).toEqual(obterIds(gerarMermaidUml(projeto)).slice(0, 1))
        expect(diagrama).not.toContain('["Cliente"]')
        expect(diagrama).not.toContain(' -- ')
    })

    it('aceita o exemplo no parser real do Mermaid', async () => {
        mermaid.initialize({ startOnLoad: false })
        const diagrama = await mermaid.mermaidAPI.getDiagramFromText('classDiagram\ndirection TB')
        const parser = diagrama.parser
        const contextoOriginal = parser.yy
        const adicionarMembro = vi.fn()
        const adicionarRelacao = vi.fn()

        // Valida a gramática real em Node, sem executar a camada de DOM/renderização.
        parser.yy = {
            addClass: vi.fn(),
            setClassLabel: vi.fn(),
            addMember: adicionarMembro,
            addRelation: adicionarRelacao,
            cleanupLabel: (valor) => valor,
            lineType: { LINE: 0 },
        }
        try {
            expect(() => parser.parse(`${gerarMermaidUml(exemploProjeto())}\n`)).not.toThrow()
            expect(adicionarMembro).toHaveBeenCalledTimes(5)
            expect(adicionarRelacao).toHaveBeenCalledTimes(1)
            expect(() => parser.parse('classDiagram\nClasse : id: Long\n')).toThrow()
        } finally {
            parser.yy = contextoOriginal
        }
    })

    it('retorna classDiagram para projetos vazios ou ausentes', () => {
        for (const projeto of [undefined, null, {}, { classes: [], relacoes: [] }]) {
            expect(gerarMermaidUml(projeto)).toBe('classDiagram')
        }
    })

    it('gera uma classe, atributo e método', () => {
        const diagrama = gerarMermaidUml({ classes: [exemploProjeto().classes[0]] })
        const [id] = obterIds(diagrama)
        expect(obterIds(diagrama)).toHaveLength(1)
        expect(diagrama.startsWith('classDiagram\n')).toBe(true)
        expect(diagrama).toContain(`class ${id}["Pedido"]`)
        expect(diagrama).toContain(`${id} : BigDecimal valor`)
        expect(diagrama).toContain(`${id} : calcularTotal() BigDecimal`)
    })

    it.each([
        ['ONE_TO_ONE', '1', '1'],
        ['ONE_TO_MANY', '1', '*'],
        ['MANY_TO_ONE', '*', '1'],
        ['MANY_TO_MANY', '*', '*'],
    ])('converte a cardinalidade %s', (tipo, origem, destino) => {
        const projeto = exemploProjeto()
        projeto.relacoes[0].tipo = tipo
        const diagrama = gerarMermaidUml(projeto)
        const [pedido, cliente] = obterIds(diagrama)
        expect(diagrama).toContain(`${pedido} "${origem}" -- "${destino}" ${cliente}`)
    })

    it('tolera nomes parciais e membros incompletos', () => {
        const diagrama = gerarMermaidUml({
            classes: [{ nome: '' }, { nome: '   ' }, {
                nome: 'P',
                atributos: [{ nome: '', tipo: 'String' }, { nome: 'descricao', tipo: '' }],
                metodos: [{ nome: '', tipoRetorno: 'void' }, { nome: 'calcular', tipoRetorno: '' }],
            }],
        })
        const [id] = obterIds(diagrama)
        expect(obterIds(diagrama)).toHaveLength(1)
        expect(diagrama).toContain(`class ${id}["P"]`)
        expect(diagrama).toContain(`${id} : descricao`)
        expect(diagrama).toContain(`${id} : calcular()`)
        expect(diagrama).not.toContain('undefined')
    })

    it('ignora relações incompletas, desconhecidas e sem classes existentes', () => {
        const projeto = exemploProjeto()
        projeto.relacoes = [
            { origem: '', destino: 'Cliente', tipo: 'ONE_TO_ONE' },
            { origem: 'Pedido', destino: '', tipo: 'ONE_TO_ONE' },
            { origem: 'Pedido', destino: 'Cliente', tipo: '' },
            { origem: 'Pedido', destino: 'Inexistente', tipo: 'ONE_TO_ONE' },
            { origem: 'Pedido', destino: 'Cliente', tipo: 'INVALIDO' },
        ]
        expect(gerarMermaidUml(projeto)).not.toContain(' -- ')
    })

    it('impede que símbolos e quebras de linha criem comandos', () => {
        const diagrama = gerarMermaidUml({ classes: [{
            nome: 'Pedido"]\nclick X "javascript:alert(1)',
            atributos: [{ nome: 'valor\n}\nclass Injetada {', tipo: '<script>' }],
            metodos: [{ nome: 'calcular()', tipoRetorno: 'void' }],
        }] })
        expect(obterIds(diagrama)).toHaveLength(1)
        expect(diagrama.split('\n')).toHaveLength(4)
        for (const simbolo of ['javascript:', '<script>', '{', '}']) {
            expect(diagrama).not.toContain(simbolo)
        }
        expect(diagrama).toContain('calcular() void')
    })

    it('mantém IDs distintos para nomes com o mesmo rótulo sanitizado', () => {
        const diagrama = gerarMermaidUml({
            classes: [{ nome: 'A-B' }, { nome: 'A B' }],
            relacoes: [{ origem: 'A-B', destino: 'A B', tipo: 'ONE_TO_ONE' }],
        })
        const [primeiro, segundo] = obterIds(diagrama)
        expect(primeiro).not.toBe(segundo)
        expect(diagrama).toContain(`${primeiro} "1" -- "1" ${segundo}`)
    })

    it('mantém os IDs quando a ordem das classes muda', () => {
        const projeto = exemploProjeto()
        const antes = obterIds(gerarMermaidUml(projeto))
        projeto.classes.reverse()
        expect(obterIds(gerarMermaidUml(projeto))).toEqual([...antes].reverse())
    })

    it('aceita o campo legado tipo dos métodos', () => {
        expect(gerarMermaidUml({ classes: [{
            nome: 'Pedido', metodos: [{ nome: 'salvar', tipo: 'void' }],
        }] })).toContain('salvar() void')
    })

    it('não altera o projeto e retorna o mesmo texto para a mesma entrada', () => {
        const projeto = exemploProjeto()
        const antes = structuredClone(projeto)
        function congelar(valor) {
            if (valor && typeof valor === 'object') {
                Object.values(valor).forEach(congelar)
                Object.freeze(valor)
            }
        }
        congelar(projeto)
        const resultado = gerarMermaidUml(projeto)
        expect(projeto).toEqual(antes)
        expect(gerarMermaidUml(projeto)).toBe(resultado)
    })

    it('tolera coleções inválidas e entradas nulas', () => {
        expect(gerarMermaidUml({ classes: null, relacoes: {} })).toBe('classDiagram')
        expect(() => gerarMermaidUml({
            classes: [null, { nome: 'Pedido', atributos: [null], metodos: [null] }],
            relacoes: [null],
        })).not.toThrow()
    })

    it('ignora nomes sem texto e evita classes duplicadas', () => {
        const diagrama = gerarMermaidUml({
            classes: [{ nome: '[]{}' }, { nome: 'Pedido' }, { nome: 'Pedido' }],
        })
        expect(obterIds(diagrama)).toHaveLength(1)
    })
})
