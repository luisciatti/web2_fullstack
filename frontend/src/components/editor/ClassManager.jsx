
export default function ClassManager({
    classes = [],
    selectedIndex = 0,
    onChange,
}) {
    return (
        <>
            <div className="editor-fe15__class-list">
                {classes.map((classe, indice) => (
                    <div key={`estrutura-${indice}`}>
                        <button
                            type="button"
                            className={`editor-fe15__class-item${
                                selectedIndex === indice
                                    ? ' is-selected'
                                    : ''
                            }`}
                            aria-pressed={selectedIndex === indice}
                            onClick={() => onChange(indice)}
                        >
                            <strong>
                                ▦ {classe.nome || `Classe ${indice + 1}`}
                            </strong>
                        </button>

                        {selectedIndex === indice && (
                            <div className="editor-fe15__class-details">
                                <span>
                                    └ Atributos ({classe.atributos?.length || 0})
                                </span>
                                <span>
                                    └ Métodos ({classe.metodos?.length || 0})
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    )
}
