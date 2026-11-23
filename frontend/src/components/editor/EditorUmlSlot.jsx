import UmlLivePreview from '../diagramas/UmlLivePreview.jsx'

/**
 * Área do diagrama no editor: desenha a UML real (Mermaid) com as
 * classes e relações atuais do projeto, atualizando a cada edição.
 */
export default function EditorUmlSlot({ projeto }) {
    return (
        <div className="editor-uml-slot editor-uml-slot--live" role="region" aria-label="Prévia UML">
            <UmlLivePreview projeto={projeto} />
        </div>
    )
}
