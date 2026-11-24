import { useId, useState } from 'react'
import { baixarZip, normalizarCaminho } from '../../utils/downloadZip.js'
import { prepararDownloadProjeto } from './arvoreArquivos.js'
import './ArtifactsPanel.css'

const GRUPOS = ['Java', 'Config', 'Infra', 'Diagramas']

function grupoArtefato({ nome, tipo }) {
    const caminho = normalizarCaminho(nome).toLowerCase()
    if (tipo?.startsWith('JAVA') || caminho.endsWith('.java')) return 'Java'
    if (tipo === 'DIAGRAM' || caminho.endsWith('.mmd') || caminho.startsWith('docs/')) return 'Diagramas'
    if (tipo === 'INFRA' || caminho.endsWith('.tf') || caminho.startsWith('infra/')) return 'Infra'
    return 'Config'
}

export default function ArtifactsPanel({ resultado }) {
    const titulo = useId()
    const [baixando, setBaixando] = useState(false)
    const [erro, setErro] = useState('')
    const artefatos = resultado?.artefatos ?? []
    const grupos = Object.fromEntries(GRUPOS.map((grupo) => [grupo, []]))
    for (const [indice, artefato] of artefatos.entries()) {
        if (artefato) grupos[grupoArtefato(artefato)].push({ indice, artefato })
    }
    const podeBaixar = artefatos.some((artefato) => normalizarCaminho(artefato?.nome))

    async function baixar() {
        setBaixando(true)
        setErro('')
        try {
            await baixarZip(prepararDownloadProjeto(artefatos))
        } catch {
            setErro('Não foi possível baixar o ZIP. Tente novamente.')
        } finally {
            setBaixando(false)
        }
    }

    return (
        <section className="artifacts-panel" aria-labelledby={titulo}>
            <h2 id={titulo}>Artefatos gerados</h2>
            {artefatos.length === 0 && <p role="status">Nenhum artefato disponível.</p>}
            {artefatos.length > 0 && !podeBaixar && <p role="status">Nenhum arquivo tem um nome válido para o ZIP.</p>}
            {podeBaixar && (
                <button type="button" onClick={baixar} disabled={baixando}>
                    {baixando ? 'Preparando ZIP…' : 'Baixar tudo (.zip)'}
                </button>
            )}
            {erro && <p role="alert">{erro}</p>}
            {GRUPOS.map((grupo) => grupos[grupo].length > 0 && (
                <div key={grupo} className="artifacts-panel__grupo">
                    <h3>{grupo}</h3>
                    {grupos[grupo].map(({ indice, artefato }) => (
                        <details key={indice}>
                            <summary>{artefato.nome?.trim() || 'Arquivo sem nome'}</summary>
                            {!(artefato.conteudo?.length) && <p>Arquivo sem conteúdo.</p>}
                            <pre><code>{artefato.conteudo ?? ''}</code></pre>
                        </details>
                    ))}
                </div>
            ))}
        </section>
    )
}
