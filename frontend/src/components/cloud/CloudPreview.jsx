import { useId, useLayoutEffect, useState } from 'react'
import { renderizarMermaid } from '../../diagramas/renderizarMermaid.js'
import './CloudPreview.css'

const DESCRICAO_PADRAO = 'Resultado da última geração. Gere novamente para incluir alterações no projeto.'
const VAZIO_PADRAO = 'Gere um diagrama Cloud para visualizar os serviços e conexões.'

export default function CloudPreview({
    codigoMermaid = '',
    titulo = 'Prévia Cloud',
    descricao = DESCRICAO_PADRAO,
    mensagemVazio = VAZIO_PADRAO,
}) {
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
            <h2 id={id}>{titulo}</h2>
            {descricao && <p>{descricao}</p>}
            <div aria-busy={estado === 'loading'}>
                {estado === 'empty' && <p role="status">{mensagemVazio}</p>}
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
