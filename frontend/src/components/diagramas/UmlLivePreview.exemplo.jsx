import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import UmlLivePreview from './UmlLivePreview.jsx'
import '../../styles/tokens.css'

export const EXEMPLO_PROJETO = {
    nome: 'Pedido',
    classes: [
        {
            nome: 'Pedido',
            atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'valor', tipo: 'BigDecimal' }],
            metodos: [{ nome: 'calcularTotal', tipoRetorno: 'BigDecimal' }],
        },
        { nome: 'Cliente', atributos: [{ nome: 'nome', tipo: 'String' }], metodos: [] },
    ],
    relacoes: [{ origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' }],
}

function Exemplo() {
    const [json, setJson] = useState(JSON.stringify(EXEMPLO_PROJETO, null, 2))
    let projeto
    let erro = ''
    try { projeto = JSON.parse(json) } catch { erro = 'JSON incompleto. Termine a edição para atualizar a UML.' }

    return (
        <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui' }}>
            <h1>Exemplo local de UML</h1>
            <p>Edite os dados para atualizar a prévia. Não é necessário iniciar o backend.</p>
            <p>
                <button onClick={() => setJson(JSON.stringify(EXEMPLO_PROJETO, null, 2))}>Carregar exemplo</button>{' '}
                <button onClick={() => setJson('{"classes": [], "relacoes": []}')}>Projeto vazio</button>
            </p>
            <label htmlFor="uml-json">JSON do projeto</label>
            <textarea
                id="uml-json"
                value={json}
                onChange={(event) => setJson(event.target.value)}
                spellCheck={false}
                style={{ display: 'block', boxSizing: 'border-box', width: '100%', minHeight: 300, margin: '1rem 0' }}
            />
            {erro ? <p role="alert">{erro}</p> : <UmlLivePreview projeto={projeto} />}
        </main>
    )
}

createRoot(document.getElementById('root')).render(<StrictMode><Exemplo /></StrictMode>)
