
export const TIPOS_RETORNO = [
    'void',
    'String',
    'Long',
    'Integer',
    'Double',
    'BigDecimal',
    'Boolean',
]

export default function MethodEditor({
    metodos = [],
    onAdd,
    onUpdate,
    onRemove,
}) {
    return (
        <>
            <div className="editor-fe15__section-title">
                <h3>Métodos</h3>

                <button type="button" onClick={onAdd}>
                    + Adicionar
                </button>
            </div>

            {metodos.map((metodo, indice) => (
                <div className="editor-fe15__property" key={`met-${indice}`}>
                    <input
                        aria-label={`Nome do método ${indice + 1}`}
                        placeholder="Nome"
                        value={metodo.nome}
                        onChange={(event) =>
                            onUpdate(indice, 'nome', event.target.value)
                        }
                    />

                    <select
                        aria-label={`Retorno do método ${indice + 1}`}
                        value={metodo.tipoRetorno}
                        onChange={(event) =>
                            onUpdate(indice, 'tipoRetorno', event.target.value)
                        }
                    >
                        {TIPOS_RETORNO.map((tipo) => (
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
                        Remover método
                    </button>
                </div>
            ))}
        </>
    )
}
