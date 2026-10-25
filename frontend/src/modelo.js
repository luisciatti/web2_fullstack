export const EXEMPLO_MODELO = `Classe Pedido
  id: Long
  valor: BigDecimal
  calcularTotal(): BigDecimal
Relação: Pedido -> Cliente (MANY_TO_ONE)
Serviço: db RDS DATA engine=mysql instanceType=db.t3.micro
Conexão: api -> db "API para banco"`

export function createProjetoVazio() {
    return {
        nome: '',
        linguagem: 'java',
        framework: 'spring-boot',
        provedorCloud: 'aws',
        classes: [],
        relacoes: [],
        servicosCloud: [],
        conexoesCloud: [],
    }
}

function parseClasse(lines, index) {
    const match = lines[index].match(/^Classe\s+(.+)$/)
    if (!match) throw new Error(`Linha ${index + 1}: classe inválida.`)

    const classe = { nome: match[1].trim(), atributos: [], metodos: [] }
    let i = index + 1

    while (i < lines.length) {
        const line = lines[i].trim()
        if (!line) break
        if (/^(Relação|Serviço|Conexão|Classe\s)/.test(line)) break
        if (/^\s/.test(lines[i])) {
            const content = line
            if (content.includes('(') && content.includes(')')) {
                const metodo = content.match(/^([A-Za-z0-9_]+)\s*\((.*)\)\s*:\s*(.+)$/)
                if (!metodo) throw new Error(`Linha ${i + 1}: método inválido.`)
                classe.metodos.push({ nome: metodo[1], tipoRetorno: metodo[3].trim() })
            } else {
                const atributo = content.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/)
                if (!atributo) throw new Error(`Linha ${i + 1}: atributo inválido.`)
                classe.atributos.push({ nome: atributo[1], tipo: atributo[2].trim() })
            }
            i += 1
            continue
        }
        break
    }

    return { classe, nextIndex: i }
}

export function parseModelo(texto) {
    const linhas = texto.split(/\r?\n/)
    const projeto = createProjetoVazio()
    let i = 0

    while (i < linhas.length) {
        const linha = linhas[i].trim()
        if (!linha) {
            i += 1
            continue
        }

        if (/^Classe\s+/.test(linha)) {
            const parsed = parseClasse(linhas, i)
            projeto.classes.push(parsed.classe)
            i = parsed.nextIndex
            continue
        }

        if (linha.startsWith('Relação:')) {
            const match = linha.match(/^Relação:\s*(.+?)\s*->\s*(.+?)\s*\((.+)\)$/)
            if (!match) throw new Error(`Linha ${i + 1}: relação inválida.`)
            projeto.relacoes.push({ origem: match[1].trim(), destino: match[2].trim(), tipo: match[3].trim() })
            i += 1
            continue
        }

        if (linha.startsWith('Serviço:')) {
            const restante = linha.replace(/^Serviço:\s*/, '')
            const partes = restante.split(/\s+/)
            if (partes.length < 3) throw new Error(`Linha ${i + 1}: serviço inválido.`)
            const config = {}
            for (let j = 3; j < partes.length; j += 1) {
                const parte = partes[j]
                const eq = parte.indexOf('=')
                if (eq > 0) {
                    const chave = parte.slice(0, eq)
                    const valor = parte.slice(eq + 1)
                    config[chave] = valor
                }
            }
            projeto.servicosCloud.push({ id: partes[0], tipo: partes[1], categoria: partes[2], configuracao: config })
            i += 1
            continue
        }

        if (linha.startsWith('Conexão:')) {
            const match = linha.match(/^Conexão:\s*(.+?)\s*->\s*(.+?)\s*"(.+)"$/)
            if (!match) throw new Error(`Linha ${i + 1}: conexão inválida.`)
            projeto.conexoesCloud.push({ de: match[1].trim(), para: match[2].trim(), rotulo: match[3].trim() })
            i += 1
            continue
        }

        throw new Error(`Linha ${i + 1}: formato inválido.`)
    }

    return projeto
}

export function modeloParaTexto(projeto) {
    const linhas = []
    for (const classe of projeto.classes || []) {
        linhas.push(`Classe ${classe.nome}`)
        for (const atributo of classe.atributos || []) {
            linhas.push(`  ${atributo.nome}: ${atributo.tipo}`)
        }
        for (const metodo of classe.metodos || []) {
            linhas.push(`  ${metodo.nome}(): ${metodo.tipoRetorno}`)
        }
        linhas.push('')
    }

    for (const relacao of projeto.relacoes || []) {
        linhas.push(`Relação: ${relacao.origem} -> ${relacao.destino} (${relacao.tipo})`)
    }

    for (const servico of projeto.servicosCloud || []) {
        const config = Object.entries(servico.configuracao || {})
            .map(([chave, valor]) => `${chave}=${valor}`)
            .join(' ')
        linhas.push(`Serviço: ${servico.id} ${servico.tipo} ${servico.categoria}${config ? ` ${config}` : ''}`)
    }

    for (const conexao of projeto.conexoesCloud || []) {
        linhas.push(`Conexão: ${conexao.de} -> ${conexao.para} "${conexao.rotulo}"`)
    }

    return linhas.join('\n').trim() + '\n'
}
