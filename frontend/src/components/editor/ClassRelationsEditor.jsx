import { TIPOS_RELACAO } from './RelationsEditor.jsx'

export const ROTULOS_RELACAO = {
    ONE_TO_ONE: 'Um para um (1:1)',
    ONE_TO_MANY: 'Um para muitos (1:N)',
    MANY_TO_ONE: 'Muitos para um (N:1)',
    MANY_TO_MANY: 'Muitos para muitos (N:N)',
}

/**
 * Relações da classe selecionada no inspetor.
 * Mostra as relações em que a classe é a origem e permite criar,
 * alterar destino/tipo e remover. Os índices enviados aos callbacks
 * são os índices em projeto.relacoes.
 */
export default function ClassRelationsEditor({
    classe,
    classes = [],
    relacoes = [],
    onAdd,
    onUpdate,
    onRemove,
}) {
    const nomeClasse = String(classe?.nome || '').trim()
    const nomesClasses = classes
        .map((item) => String(item.nome || '').trim())
        .filter(Boolean)

    const daClasse = relacoes
        .map((relacao, indice) => ({ relacao, indice }))
        .filter(({ relacao }) => nomeClasse && relacao.origem === nomeClasse)

    return (
        <>
            <div className="editor-fe15__section-title">
                <h3>Relações</h3>

                <button
                    type="button"
                    onClick={() => onAdd(nomeClasse)}
                    disabled={!nomeClasse}
                    title={nomeClasse ? 'Relacionar esta classe com outra' : 'Dê um nome à classe para criar relações'}
                >
                    + Adicionar
                </button>
            </div>

            {!nomeClasse && (
                <p className="editor-fe15__hint">Dê um nome à classe para criar relações.</p>
            )}

            {daClasse.map(({ relacao, indice }, posicao) => (
                <div className="editor-fe15__property" key={`rel-${indice}`}>
                    <select
                        aria-label={`Classe relacionada ${posicao + 1}`}
                        value={relacao.destino}
                        onChange={(event) => onUpdate(indice, 'destino', event.target.value)}
                    >
                        <option value="">Relacionar com…</option>
                        {nomesClasses.map((nome) => (
                            <option key={nome} value={nome}>{nome}</option>
                        ))}
                    </select>

                    <select
                        aria-label={`Tipo da relação ${posicao + 1}`}
                        value={relacao.tipo}
                        onChange={(event) => onUpdate(indice, 'tipo', event.target.value)}
                    >
                        {TIPOS_RELACAO.map((tipo) => (
                            <option key={tipo} value={tipo}>{ROTULOS_RELACAO[tipo] || tipo}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="editor-fe15__remove"
                        onClick={() => onRemove(indice)}
                    >
                        Remover relação
                    </button>
                </div>
            ))}
        </>
    )
}
