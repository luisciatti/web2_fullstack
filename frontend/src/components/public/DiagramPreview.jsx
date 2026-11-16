import React from 'react'

/** Lightweight, responsive UML preview used as a product illustration. */
export default function DiagramPreview() {
    return (
        <section className="diagram-preview" aria-label="Exemplo de diagrama de classes">
            <div className="diagram-preview__toolbar">
                <span className="diagram-preview__toolbar-dots" aria-hidden="true">•••</span>
                <span>Diagrama de classes — Biblioteca</span>
            </div>

            <div className="diagram-preview__canvas">
                <article className="diagram-node diagram-node--book">
                    <h3>Livro</h3>
                    <div className="diagram-node__body">
                        <span>id: Long</span>
                        <span>titulo: String</span>
                    </div>
                </article>

                <div className="diagram-connectors" aria-hidden="true">
                    <span className="diagram-connectors__stem" />
                    <span className="diagram-connectors__bar" />
                    <span className="diagram-connectors__left" />
                    <span className="diagram-connectors__right" />
                </div>

                <div className="diagram-preview__children">
                    <article className="diagram-node">
                        <h3>Usuário</h3>
                        <div className="diagram-node__body">
                            <span>nome: String</span>
                        </div>
                    </article>
                    <article className="diagram-node">
                        <h3>Empréstimo</h3>
                        <div className="diagram-node__body">
                            <span>data: Date</span>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    )
}
