import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CloudServicesPanel from './CloudServicesPanel.jsx'
import CloudConnectionsPanel from './CloudConnectionsPanel.jsx'
import CloudPreview from './CloudPreview.jsx'
import '../../styles/tokens.css'

const FIXTURES = {
    aws: {
        provedorCloud: 'aws',
        servicosCloud: [
            { id: 'api', tipo: 'EC2', categoria: 'COMPUTE', configuracao: { instanceType: 't3.micro' } },
            { id: 'db', tipo: 'RDS', categoria: 'DATA', configuracao: { engine: 'mysql', instanceType: 'db.t3.micro' } },
        ],
        conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'API para banco' }],
    },
    oci: {
        provedorCloud: 'oci',
        servicosCloud: [
            { id: 'api', tipo: 'INSTANCE', categoria: 'COMPUTE', configuracao: { shape: 'VM.Standard.E4.Flex' } },
            { id: 'db', tipo: 'DATABASE', categoria: 'DATA', configuracao: { databaseName: 'pedidos' } },
        ],
        conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'API para banco' }],
    },
}

const RESULTADOS = {
    aws: `flowchart LR
  api["EC2\\napi"]
  db["RDS\\ndb"]
  api -->|"API para banco"| db`,
    oci: `flowchart LR
  api["INSTANCE\\napi"]
  db["DATABASE\\ndb"]
  api -->|"API para banco"| db`,
}

function Exemplo() {
    const [projeto, setProjeto] = useState(FIXTURES.aws)
    const [versao, setVersao] = useState(0)
    const [codigoMermaid, setCodigoMermaid] = useState('')

    function carregar(provedor) {
        setProjeto(FIXTURES[provedor])
        setVersao((atual) => atual + 1)
        setCodigoMermaid('')
    }

    return (
        <main style={{ maxWidth: 900, margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui' }}>
            <h1>Exemplo local de serviços Cloud</h1>
            <p>
                <button type="button" onClick={() => carregar('aws')}>Carregar exemplo AWS</button>{' '}
                <button type="button" onClick={() => carregar('oci')}>Carregar exemplo OCI</button>
            </p>
            <CloudServicesPanel key={versao} projeto={projeto} onChange={setProjeto} />
            <CloudConnectionsPanel projeto={projeto} onChange={setProjeto} />
            <p>
                <button type="button" onClick={() => setCodigoMermaid(RESULTADOS[projeto.provedorCloud])}>
                    Carregar resultado de exemplo
                </button>
            </p>
            <CloudPreview codigoMermaid={codigoMermaid} />
            <h2>Projeto atual</h2>
            <pre style={{ overflow: 'auto' }}>{JSON.stringify(projeto, null, 2)}</pre>
        </main>
    )
}

createRoot(document.getElementById('root')).render(<StrictMode><Exemplo /></StrictMode>)
