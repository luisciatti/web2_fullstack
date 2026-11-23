import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CloudServicesPanel from './CloudServicesPanel.jsx'
import '../../styles/tokens.css'

const FIXTURES = {
    aws: {
        provedorCloud: 'aws',
        servicosCloud: [
            { id: 'api', tipo: 'EC2', categoria: 'COMPUTE', configuracao: { instanceType: 't3.micro' } },
            { id: 'db', tipo: 'RDS', categoria: 'DATA', configuracao: { engine: 'mysql', instanceType: 'db.t3.micro' } },
        ],
    },
    oci: {
        provedorCloud: 'oci',
        servicosCloud: [
            { id: 'api', tipo: 'INSTANCE', categoria: 'COMPUTE', configuracao: { shape: 'VM.Standard.E4.Flex' } },
            { id: 'db', tipo: 'DATABASE', categoria: 'DATA', configuracao: { databaseName: 'pedidos' } },
        ],
    },
}

function Exemplo() {
    const [projeto, setProjeto] = useState(FIXTURES.aws)
    const [versao, setVersao] = useState(0)

    function carregar(provedor) {
        setProjeto(FIXTURES[provedor])
        setVersao((atual) => atual + 1)
    }

    return (
        <main style={{ maxWidth: 900, margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui' }}>
            <h1>Exemplo local de serviços Cloud</h1>
            <p>
                <button type="button" onClick={() => carregar('aws')}>Carregar exemplo AWS</button>{' '}
                <button type="button" onClick={() => carregar('oci')}>Carregar exemplo OCI</button>
            </p>
            <CloudServicesPanel key={versao} projeto={projeto} onChange={setProjeto} />
            <h2>Projeto atual</h2>
            <pre style={{ overflow: 'auto' }}>{JSON.stringify(projeto, null, 2)}</pre>
        </main>
    )
}

createRoot(document.getElementById('root')).render(<StrictMode><Exemplo /></StrictMode>)
