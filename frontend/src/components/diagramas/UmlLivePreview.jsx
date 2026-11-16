import { useEffect, useId, useState } from 'react'
import { gerarMermaidUml } from '../../diagramas/gerarMermaidUml.js'
import { renderizarUml } from './renderizarUml.js'
import './UmlLivePreview.css'

export default function UmlLivePreview({ projeto }) {
    const componenteId = useId().replace(/[^a-zA-Z0-9_]/g, '')
    const fonte = gerarMermaidUml(projeto)
    const vazio = fonte === 'classDiagram'
    const [resultado, setResultado] = useState(null)
    const [zoom, setZoom] = useState(100)

    useEffect(() => {
        setResultado(null)
        if (vazio) return
        return renderizarUml(fonte, componenteId, setResultado)
    }, [fonte, vazio, componenteId])

    // Não exibe o SVG anterior enquanto o efeito da nova prop ainda não executou.
    const estado = vazio ? 'empty'
        : resultado?.fonte === fonte ? resultado.status : 'loading'

    return (
        <section className="uml-live-preview" aria-labelledby={`uml-title-${componenteId}`}>
            <header className="uml-live-preview__header">
                <h3 id={`uml-title-${componenteId}`}>Visualização do diagrama</h3>
                <div className="uml-live-preview__zoom" role="group" aria-label="Zoom do diagrama">
                    <button type="button" aria-label="Diminuir zoom" disabled={zoom <= 50} onClick={() => setZoom((valor) => Math.max(50, valor - 25))}>−</button>
                    <output aria-live="polite">{zoom}%</output>
                    <button type="button" aria-label="Aumentar zoom" disabled={zoom >= 200} onClick={() => setZoom((valor) => Math.min(200, valor + 25))}>+</button>
                </div>
            </header>
            <div aria-busy={estado === 'loading'}>
                {estado === 'empty' && (
                    <p className="uml-live-preview__message" role="status">
                        Adicione uma classe com nome para visualizar a UML.
                    </p>
                )}
                {estado === 'loading' && (
                    <p className="uml-live-preview__message" role="status">Desenhando UML...</p>
                )}
                {estado === 'error' && (
                    <p className="uml-live-preview__message uml-live-preview__message--error" role="alert">
                        Não foi possível desenhar a UML. Confira as classes e relações e tente editar novamente.
                    </p>
                )}
                {estado === 'success' && (
                    <div
                        className="uml-live-preview__canvas"
                        role="img"
                        aria-label="Diagrama UML do projeto"
                        tabIndex={0}
                        style={{ '--uml-zoom': zoom / 100 }}
                        dangerouslySetInnerHTML={{ __html: resultado.svg }}
                    />
                )}
            </div>
        </section>
    )
}
