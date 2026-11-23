import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gerarMermaidUml } from '../../diagramas/gerarMermaidUml.js'
import { renderizarUml } from './renderizarUml.js'
import { comTemaMermaid, useTema } from '../../tema/tema.js'
import './UmlLivePreview.css'

export default function UmlLivePreview({ projeto }) {
    const componenteId = useId().replace(/[^a-zA-Z0-9_]/g, '')
    const tema = useTema()
    const fonteBase = useMemo(() => gerarMermaidUml(projeto), [projeto])
    const vazio = fonteBase === 'classDiagram'
    const fonte = useMemo(() => comTemaMermaid(fonteBase, tema), [fonteBase, tema])
    const [resultado, setResultado] = useState(null)
    const versaoAtual = useRef(0)
    const canvas = useRef(null)
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
    const svgRenderizado = exibirCanvas ? resultado.svg : null

    useLayoutEffect(() => {
        const svg = canvas.current?.querySelector('svg')
        const dimensoes = svg?.viewBox?.baseVal
        if (dimensoes?.width > 0 && dimensoes.height > 0) {
            svg.setAttribute('width', dimensoes.width)
            svg.setAttribute('height', dimensoes.height)
        }
    }, [svgRenderizado])

    return (
        <section className="uml-live-preview" aria-labelledby={`uml-title-${componenteId}`}>
            <header className="uml-live-preview__header">
                <h3 id={`uml-title-${componenteId}`}>Visualização do diagrama</h3>
                <div className="uml-live-preview__zoom" role="group" aria-label="Zoom do diagrama">
                    <button type="button" aria-label="Diminuir zoom" disabled={!exibirCanvas || zoom <= 50} onClick={() => setZoom((valor) => Math.max(50, valor - 25))}>−</button>
                    <output aria-label="Zoom atual" aria-live="polite">{zoom}%</output>
                    <button type="button" aria-label="Aumentar zoom" disabled={!exibirCanvas || zoom >= 200} onClick={() => setZoom((valor) => Math.min(200, valor + 25))}>+</button>
                    <button type="button" aria-label="Redefinir zoom para 100%" disabled={!exibirCanvas} onClick={() => setZoom(100)}>Redefinir</button>
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
                        ref={canvas}
                        role="region"
                        aria-label="Diagrama UML do projeto"
                        tabIndex={0}
                        style={{ '--uml-zoom': zoom / 100 }}
                        dangerouslySetInnerHTML={{ __html: svgRenderizado }}
                    />
                )}
            </div>
        </section>
    )
}
