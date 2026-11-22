import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import UmlLivePreview from './UmlLivePreview.jsx'
import '../../styles/tokens.css'

const EXEMPLO_PROJETO = {
    nome: 'Pedido',
    classes: [{ nome: 'Pedido', atributos: [{ nome: 'id', tipo: 'Long' }] }],
    relacoes: [],
}

const CARDINALIDADES = {
    ONE_TO_ONE: 'Um para um',
    ONE_TO_MANY: 'Um para muitos',
    MANY_TO_ONE: 'Muitos para um',
    MANY_TO_MANY: 'Muitos para muitos',
}

function Exemplo() {
    const [projeto, setProjeto] = useState(EXEMPLO_PROJETO)
    const classe = projeto.classes[1]

    function editarClasse(alteracoes) {
        setProjeto((atual) => {
            const [pedido, rascunho] = atual.classes
            const classeEditada = { ...rascunho, ...alteracoes }
            return {
                ...atual,
                classes: [pedido, classeEditada],
                relacoes: atual.relacoes.map((relacao) => ({ ...relacao, destino: classeEditada.nome })),
            }
        })
    }

    function editarRelacao(tipo) {
        setProjeto((atual) => ({
            ...atual,
            relacoes: tipo ? [{ origem: 'Pedido', destino: atual.classes[1].nome, tipo }] : [],
        }))
    }

    return (
        <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui' }}>
            <h1>Exemplo local de UML</h1>
            {classe ? (
                <fieldset>
                    <legend>Classe de teste</legend>
                    <p><label>Nome <input value={classe.nome} onChange={(event) => editarClasse({ nome: event.target.value })} /></label></p>
                    <p><label>Atributo <input value={classe.atributos[0].nome} onChange={(event) => editarClasse({
                        atributos: [{ nome: event.target.value, tipo: 'String' }],
                    })} /></label></p>
                    <p><label>Método <input value={classe.metodos[0].nome} onChange={(event) => editarClasse({
                        metodos: [{ nome: event.target.value, tipoRetorno: 'void' }],
                    })} /></label></p>
                    <p>
                        <label>
                            Relação com Pedido{' '}
                            <select value={projeto.relacoes[0]?.tipo ?? ''} onChange={(event) => editarRelacao(event.target.value)}>
                                <option value="">Sem relação</option>
                                {Object.entries(CARDINALIDADES).map(([tipo, rotulo]) => (
                                    <option key={tipo} value={tipo}>{rotulo}</option>
                                ))}
                            </select>
                        </label>
                    </p>
                    <button type="button" onClick={() => setProjeto(EXEMPLO_PROJETO)}>Excluir classe</button>
                </fieldset>
            ) : (
                <button type="button" onClick={() => setProjeto((atual) => ({
                    ...atual,
                    classes: [...atual.classes, { nome: '', atributos: [{ nome: '' }], metodos: [{ nome: '' }] }],
                }))}>Adicionar classe</button>
            )}
            <UmlLivePreview projeto={projeto} />
        </main>
    )
}

createRoot(document.getElementById('root')).render(<StrictMode><Exemplo /></StrictMode>)
