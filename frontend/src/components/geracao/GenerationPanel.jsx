import { useId, useRef, useState } from 'react'
import './GenerationPanel.css'

export default function GenerationPanel({
    idSalvo,
    dirty = false,
    valido,
    salvando = false,
    onGenerate,
    loading = false,
    erro,
    resultado,
}) {
    const id = useId()
    const emExecucao = useRef(false)
    const [executando, setExecutando] = useState(false)
    const [falhou, setFalhou] = useState(false)
    const gerando = loading || executando
    const idPersistido = typeof idSalvo === 'string' && idSalvo.trim() && idSalvo.trim() !== 'novo'

    let impedimento = ''
    if (salvando) impedimento = 'Aguarde o término do salvamento.'
    else if (!valido) impedimento = 'Corrija os campos inválidos do projeto antes de gerar código.'
    else if (!idPersistido || dirty) impedimento = 'Salve o projeto e as alterações antes de gerar código.'

    async function gerar() {
        if (impedimento || gerando || emExecucao.current) return
        emExecucao.current = true
        setExecutando(true)
        setFalhou(false)
        try {
            await onGenerate()
        } catch {
            setFalhou(true)
        } finally {
            emExecucao.current = false
            setExecutando(false)
        }
    }

    const mensagemErro = erro || (falhou ? 'Não foi possível gerar código. Tente novamente.' : '')
    const artefatos = resultado?.artefatos ?? []

    return (
        <section className="generation-panel" aria-labelledby={`${id}-titulo`}>
            <h2 id={`${id}-titulo`}>Geração de código</h2>
            <button type="button" disabled={gerando || Boolean(impedimento)} onClick={gerar}>
                {gerando ? 'Gerando…' : 'Gerar código'}
            </button>
            {impedimento && <p>{impedimento}</p>}
            <div className="generation-panel__feedback" aria-busy={gerando}>
                {gerando && <p role="status">A geração pode levar alguns segundos.</p>}
                {!gerando && mensagemErro && <p className="generation-panel__erro" role="alert">{mensagemErro}</p>}
                {!gerando && !mensagemErro && resultado && (
                    <>
                        <p role="status">Código gerado com sucesso.</p>
                        {artefatos.length ? (
                            <ul aria-label="Arquivos gerados">
                                {artefatos.map(({ nome, tipo }, indice) => (
                                    <li key={indice}>{nome}{tipo && ` (${tipo})`}</li>
                                ))}
                            </ul>
                        ) : <p>Nenhum arquivo foi retornado.</p>}
                    </>
                )}
            </div>
        </section>
    )
}
