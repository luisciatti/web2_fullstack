
export const TIPOS_ATRIBUTO = [
    'String',
    'Long',
    'Integer',
    'Double',
    'BigDecimal',
    'Boolean',
    'LocalDate',
    'LocalDateTime',
]

export default function AttributeEditor({
    atributos = [],
    onAdd,
    onUpdate,
    onRemove,
}) {
    return (
        <>
            <div className="editor-fe15__section-title">
                <h3>Atributos</h3>

                <button type="button" onClick={onAdd}>
                    + Adicionar
                </button>
            </div>

            {atributos.map((atributo, indice) => (
                <div className="editor-fe15__property" key={`attr-${indice}`}>
                    <input
                        aria-label={`Nome do atributo ${indice + 1}`}
                        placeholder="Nome"
                        value={atributo.nome}
                        onChange={(event) =>
                            onUpdate(indice, 'nome', event.target.value)
                        }
                    />

                    <select
                        aria-label={`Tipo do atributo ${indice + 1}`}
                        value={atributo.tipo}
                        onChange={(event) =>
                            onUpdate(indice, 'tipo', event.target.value)
                        }
                    >
                        {TIPOS_ATRIBUTO.map((tipo) => (
                            <option key={tipo} value={tipo}>
                                {tipo}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="editor-fe15__remove"
                        onClick={() => onRemove(indice)}
                    >
                        Remover atributo
                    </button>
                </div>
            ))}
        </>
    )
}
