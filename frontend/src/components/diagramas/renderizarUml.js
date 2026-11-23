import { renderizarMermaid } from '../../diagramas/renderizarMermaid.js'

export function renderizarUml(fonte, componenteId, onResultado) {
    return renderizarMermaid(fonte, `uml-live-${componenteId}`, 'uml-live-preview__temporary', onResultado)
}
