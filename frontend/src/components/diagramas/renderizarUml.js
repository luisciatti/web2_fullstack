let mermaidPromise
let proximoRender = 0

function carregarMermaid() {
    if (!mermaidPromise) {
        mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'strict',
                suppressErrorRendering: true,
                logLevel: import.meta.env.PROD ? 'fatal' : 'error',
            })
            return mermaid
        }).catch((erro) => {
            mermaidPromise = undefined
            throw erro
        })
    }
    return mermaidPromise
}

// Retorna o cancelamento usado pelo cleanup do efeito React.
export function renderizarUml(fonte, componenteId, onResultado) {
    let atual = true

    async function desenhar() {
        let temporario
        try {
            const mermaid = await carregarMermaid()
            if (!atual) return

            // Um container por render mantém o SVG e eventuais erros do Mermaid
            // fora da área visível até que a versão atual esteja pronta.
            temporario = document.createElement('div')
            temporario.className = 'uml-live-preview__temporary'
            temporario.setAttribute('aria-hidden', 'true')
            document.body.appendChild(temporario)
            const renderId = `uml-live-${componenteId}-${++proximoRender}`
            const { svg } = await mermaid.render(renderId, fonte, temporario)

            if (atual) onResultado({ fonte, status: 'success', svg })
        } catch {
            if (atual) onResultado({ fonte, status: 'error' })
        } finally {
            temporario?.remove()
        }
    }

    desenhar()
    return () => { atual = false }
}
