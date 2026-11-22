import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gerarMermaidUml } from '../../diagramas/gerarMermaidUml.js'
import { renderizarUml } from './renderizarUml.js'
import './UmlLivePreview.css'

export default function UmlLivePreview({ projeto }) {
    const componenteId = useId().replace(/[^a-zA-Z0-9_]/g, '')
    const fonte = useMemo(() => gerarMermaidUml(projeto), [projeto])
    const vazio = fonte === 'classDiagram'
    const [resultado, setResultado] = useState(null)
    const versaoAtual = useRef(0)
    const [zoom, setZoom] = useState(100)

    // Invalida a versão anterior no commit, antes de qualquer retorno assíncrono.
    useLayoutEffect(() => {
        const versao = ++versaoAtual.current
        if (vazio) {
            setResultado(null)
            return
        }

        let cancelarRender
        const timeout = setTimeout(() => {
            cancelarRender = renderizarUml(fonte, componenteId, (novo) => {
                if (versao !== versaoAtual.current) return
                setResultado((anterior) => ({
                    ...novo,
                    svg: novo.status === 'success' ? novo.svg : anterior?.svg,
                }))
            })
        }, 300)

        return () => {
            versaoAtual.current++
            clearTimeout(timeout)
            cancelarRender?.()
        }
    }, [fonte, vazio, componenteId])

    const estado = vazio ? 'empty'
        : resultado?.fonte === fonte ? resultado.status : 'loading'
    const exibirCanvas = !vazio && Boolean(resultado?.svg)

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
                {exibirCanvas && (
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
