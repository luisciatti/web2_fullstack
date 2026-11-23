import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import UmlLivePreview from '../diagramas/UmlLivePreview.jsx'
import GenerationPanel from './GenerationPanel.jsx'
import ArtifactsPanel from './ArtifactsPanel.jsx'
import '../../styles/tokens.css'

const RESULTADO_FIXTURE = {
    idProjeto: 'projeto-exemplo',
    uml: 'classDiagram\n    class Pedido',
    cloud: 'flowchart LR',
    artefatos: [
        { tipo: 'CONFIG', nome: 'pom.xml', conteudo: '<project><artifactId>pedidos</artifactId></project>' },
        { tipo: 'CONFIG', nome: 'src/main/resources/application.yml', conteudo: 'spring:\n  application:\n    name: pedidos' },
        { tipo: 'INFRA', nome: 'infra/main.tf', conteudo: '' },
        { tipo: 'DIAGRAM', nome: 'docs/diagrama.mmd', conteudo: 'classDiagram\n    class Pedido' },
    ],
}

function Exemplo() {
    const [projeto, setProjeto] = useState({ classes: [{ nome: 'Pedido' }] })
    const [projetoSalvo, setProjetoSalvo] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)
    const [simularFalha, setSimularFalha] = useState(false)
    const nome = projeto.classes[0].nome
    const valido = /^[A-Za-z_][A-Za-z0-9_]*$/.test(nome)
    const idSalvo = projetoSalvo ? RESULTADO_FIXTURE.idProjeto : null
    const dirty = projeto !== projetoSalvo

    async function gerar() {
        if (!idSalvo || dirty || !valido || loading) return
        setLoading(true)
        setErro('')
        try {
            await new Promise((resolve) => setTimeout(resolve, 700))
            if (simularFalha) throw new Error('Falha simulada ao gerar código.')
            const nomeSalvo = projetoSalvo.classes[0].nome
            const uml = `classDiagram\n    class ${nomeSalvo}`
            setResultado({
                ...RESULTADO_FIXTURE,
                uml,
                artefatos: [
                    { tipo: 'JAVA', nome: `src/main/java/exemplo/${nomeSalvo}.java`, conteudo: `public class ${nomeSalvo} {}` },
                    ...RESULTADO_FIXTURE.artefatos.map((artefato) => artefato.tipo === 'DIAGRAM' ? { ...artefato, conteudo: uml } : artefato),
                ],
            })
        } catch (falha) {
            setErro(falha.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui' }}>
            <h1>Exemplo local de geração de código</h1>
            <p>
                <label>
                    Nome da classe{' '}
                    <input value={nome} onChange={(event) => setProjeto({ classes: [{ nome: event.target.value }] })} />
                </label>{' '}
                <button type="button" disabled={!dirty || !valido} onClick={() => setProjetoSalvo(projeto)}>Salvar</button>
            </p>
            <UmlLivePreview projeto={projeto} />
            <p>
                <label><input type="checkbox" checked={simularFalha} onChange={(event) => setSimularFalha(event.target.checked)} /> Simular falha</label>
            </p>
            <GenerationPanel
                idSalvo={idSalvo}
                dirty={dirty}
                valido={valido}
                loading={loading}
                erro={erro}
                resultado={resultado}
                onGenerate={gerar}
            />
            <ArtifactsPanel resultado={resultado} />
        </main>
    )
}

createRoot(document.getElementById('root')).render(<StrictMode><Exemplo /></StrictMode>)
