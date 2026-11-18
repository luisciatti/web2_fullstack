
export default function EditorUmlSlot({
    classes = [],
    selectedIndex = 0
}) {
    const amostra = classes.slice(0, 4)

    return (
        <div
            className="editor-uml-slot"
            role="region"
            aria-label="Prévia UML"
        >
            <p className="editor-uml-slot__notice">
                Pré-visualização temporária. O diagrama
                definitivo será integrado em outra etapa.
            </p>

            {amostra.length === 0 ? (
                <div className="editor-uml-slot__empty">
                    <span aria-hidden="true">▦</span>
                    <strong>Seu diagrama começa aqui</strong>
                    <p>
                        Adicione uma classe para visualizar
                        sua estrutura neste espaço.
                    </p>
                </div>
            ) : (
                <div className="editor-uml-slot__cards">
                    {amostra.map((classe, indice) => (
                        <article
                            key={`mock-uml-${indice}`}
                            className={`editor-uml-class${
                                selectedIndex === indice
                                    ? ' is-selected'
                                    : ''
                            }`}
                        >
                            <h3>
                                {classe.nome || `Classe ${indice + 1}`}
                            </h3>

                            <div className="editor-uml-class__content">
                                <strong>Atributos</strong>
                                {(classe.atributos || []).slice(0, 3)
                                    .map((atributo, posicao) => (
                                        <span key={posicao}>
                                            {atributo.nome || 'atributo'}:
                                            {' '}{atributo.tipo || '?'}
                                        </span>
                                    ))}
                            </div>

                            <div className="editor-uml-class__content">
                                <strong>Métodos</strong>
                                {(classe.metodos || []).slice(0, 2)
                                    .map((metodo, posicao) => (
                                        <span key={posicao}>
                                            {metodo.nome || 'metodo'}():
                                            {' '}{metodo.tipoRetorno || '?'}
                                        </span>
                                    ))}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {classes.length > 4 && (
                <p className="editor-uml-slot__notice">
                    Exibindo 4 de {classes.length} classes.
                </p>
            )}
        </div>
    )
}
