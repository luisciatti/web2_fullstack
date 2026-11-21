
export const TIPOS_RELACAO = [
    'ONE_TO_ONE',
    'ONE_TO_MANY',
    'MANY_TO_ONE',
    'MANY_TO_MANY',
]

/**
 * Contrato UML para a Pessoa 3:
 *
 * projeto.relacoes = [
 *   { origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' }
 * ]
 *
 * origem e destino são nomes de classes de projeto.classes.
 * tipo deve ser uma das quatro opções de TIPOS_RELACAO.
 * Autorrelações são permitidas (origem === destino).
 *
 * Este componente edita os dados, mas não desenha a UML.
 */

export default function RelationsEditor({
    classes = [],
    relacoes = [],
    onAdd,
    onUpdate,
    onRemove,
}) {
    const nomesClasses = classes
        .map((classe) => String(classe.nome || '').trim())
        .filter(Boolean)

    return (
        <>
            {relacoes.map((relacao, indice) => (
                <div
                    key={`relacao-${indice}`}
                    className="card-inside row-grid"
                >
                    <select
                        aria-label={`Origem da relação ${indice + 1}`}
                        value={relacao.origem}
                        onChange={(event) =>
                            onUpdate(indice, 'origem', event.target.value)
                        }
                    >
                        <option value="">Origem</option>
                        {nomesClasses.map((nome) => (
                            <option key={nome} value={nome}>
                                {nome}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label={`Destino da relação ${indice + 1}`}
                        value={relacao.destino}
                        onChange={(event) =>
                            onUpdate(indice, 'destino', event.target.value)
                        }
                    >
                        <option value="">Destino</option>
                        {nomesClasses.map((nome) => (
                            <option key={nome} value={nome}>
                                {nome}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label={`Tipo da relação ${indice + 1}`}
                        value={relacao.tipo}
                        onChange={(event) =>
                            onUpdate(indice, 'tipo', event.target.value)
                        }
                    >
                        <option value="">Tipo</option>
                        {TIPOS_RELACAO.map((tipo) => (
                            <option key={tipo} value={tipo}>
                                {tipo}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="danger"
                        onClick={() => onRemove(indice)}
                    >
                        Remover
                    </button>
                </div>
            ))}

            <button type="button" onClick={onAdd}>
                Adicionar relação
            </button>
        </>
    )
}
