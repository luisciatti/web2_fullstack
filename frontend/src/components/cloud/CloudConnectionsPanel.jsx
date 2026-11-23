import { useId } from 'react'
import './CloudConnectionsPanel.css'

export default function CloudConnectionsPanel({ projeto, onChange }) {
    const tituloId = useId()
    const { servicosCloud = [], conexoesCloud = [] } = projeto
    const contagem = new Map()
    for (const { id } of servicosCloud) {
        const chave = id.trim()
        contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }
    const ids = servicosCloud.map(({ id }) => id).filter((id) => id.trim() && contagem.get(id.trim()) === 1)
    const idsValidos = new Set(ids)

    function atualizarConexao(indice, campo, valor) {
        if (campo !== 'rotulo' && valor && !idsValidos.has(valor)) return
        onChange({
            ...projeto,
            conexoesCloud: conexoesCloud.map((conexao, i) =>
                i === indice ? { ...conexao, [campo]: valor } : conexao,
            ),
        })
    }

    return (
        <section className="cloud-connections" aria-labelledby={tituloId}>
            <h2 id={tituloId}>Conexões Cloud</h2>
            {ids.length === 0 && <p role="status">Adicione um serviço com identificador único para criar conexões.</p>}
            {ids.length > 0 && conexoesCloud.length === 0 && <p role="status">Nenhuma conexão adicionada.</p>}
            {conexoesCloud.map(({ de = '', para = '', rotulo = '' }, indice) => (
                <fieldset key={indice}>
                    <legend>Conexão {indice + 1}</legend>
                    <div className="cloud-connections__campos">
                        {[['de', 'Origem', de], ['para', 'Destino', para]].map(([campo, rotuloCampo, valor]) => {
                            const valido = idsValidos.has(valor)
                            const mensagemId = `${tituloId}-${indice}-${campo}`
                            return (
                                <label key={campo}>
                                    {rotuloCampo}
                                    <select
                                        value={valor}
                                        aria-invalid={!valido}
                                        aria-describedby={valido ? undefined : mensagemId}
                                        onChange={(event) => atualizarConexao(indice, campo, event.target.value)}
                                    >
                                        <option value="">Selecione um serviço</option>
                                        {valor && !valido && <option value={valor} disabled>{valor} (indisponível)</option>}
                                        {ids.map((id) => <option key={id} value={id}>{id}</option>)}
                                    </select>
                                    {!valido && (
                                        <span id={mensagemId} className="cloud-connections__erro">
                                            {valor
                                                ? 'Este serviço não existe ou tem identificador duplicado.'
                                                : `Selecione um serviço de ${rotuloCampo.toLowerCase()}.`}
                                        </span>
                                    )}
                                </label>
                            )
                        })}
                        <label>
                            Rótulo
                            <input value={rotulo ?? ''} onChange={(event) => atualizarConexao(indice, 'rotulo', event.target.value)} />
                        </label>
                        <button type="button" onClick={() => onChange({
                            ...projeto,
                            conexoesCloud: conexoesCloud.filter((_, i) => i !== indice),
                        })}>Remover conexão</button>
                    </div>
                </fieldset>
            ))}
            <button type="button" disabled={ids.length === 0} onClick={() => onChange({
                ...projeto,
                conexoesCloud: [...conexoesCloud, { de: '', para: '', rotulo: '' }],
            })}>Adicionar conexão</button>
        </section>
    )
}
