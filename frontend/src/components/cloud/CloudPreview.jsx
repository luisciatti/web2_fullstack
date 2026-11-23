import { useId, useLayoutEffect, useState } from 'react'
import { renderizarMermaid } from '../../diagramas/renderizarMermaid.js'
import './CloudPreview.css'

export default function CloudPreview({ codigoMermaid = '' }) {
    const id = useId()
    const [resultado, setResultado] = useState(null)
    const fonte = codigoMermaid?.trim() || ''
    const vazio = !fonte || /^(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\s*;?$/i.test(fonte)

    useLayoutEffect(() => {
        setResultado(null)
        if (vazio) return
        const prefixo = `cloud-preview-${id.replace(/[^a-zA-Z0-9_]/g, '')}`
        return renderizarMermaid(fonte, prefixo, 'cloud-preview__temporary', setResultado)
    }, [fonte, id, vazio])

    const estado = vazio ? 'empty' : resultado?.fonte === fonte ? resultado.status : 'loading'

    return (
        <section className="cloud-preview" aria-labelledby={id}>
            <h2 id={id}>Prévia Cloud</h2>
            <p>Resultado da última geração. Gere novamente para incluir alterações no projeto.</p>
            <div aria-busy={estado === 'loading'}>
                {estado === 'empty' && <p role="status">Gere um diagrama Cloud para visualizar os serviços e conexões.</p>}
                {estado === 'loading' && <p role="status">Desenhando o diagrama Cloud...</p>}
                {estado === 'error' && <p role="alert">Não foi possível desenhar o diagrama Cloud.</p>}
                {estado === 'success' && (
                    <div
                        className="cloud-preview__canvas"
                        role="region"
                        aria-label="Diagrama Cloud gerado"
                        tabIndex={0}
                        dangerouslySetInnerHTML={{ __html: resultado.svg }}
                    />
                )}
            </div>
        </section>
    )
}
