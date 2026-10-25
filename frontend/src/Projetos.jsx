import { useEffect, useState } from 'react'
import { apiFetch, clearAuth } from './api.js'

export default function Projetos({ onNew, onOpen, onLogout }) {
    const [lista, setLista] = useState([])
    const [erro, setErro] = useState('')

    const carregar = async () => {
        try {
            const dados = await apiFetch('/api/projetos')
            setLista(dados || [])
            setErro('')
        } catch (err) {
            setErro(err.message)
            if (err.message === 'Sessão expirada. Entre novamente.') {
                clearAuth()
                onLogout()
            }
        }
    }

    useEffect(() => {
        carregar()
    }, [])

    const excluir = async (id) => {
        if (!window.confirm('Excluir este projeto?')) return
        try {
            await apiFetch(`/api/projetos/${id}`, { method: 'DELETE' })
            carregar()
        } catch (err) {
            setErro(err.message)
        }
    }

    return (
        <div className="shell">
            <div className="card wide">
                <div className="topline">
                    <h1>Projetos</h1>
                    <div className="actions">
                        <button type="button" onClick={onNew}>Novo</button>
                        <button className="muted" type="button" onClick={onLogout}>Sair</button>
                    </div>
                </div>
                {erro && <div className="error">{erro}</div>}
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cloud</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((item) => (
                            <tr key={item.id}>
                                <td>{item.nome}</td>
                                <td>{item.provedorCloud}</td>
                                <td className="actions inline">
                                    <button type="button" onClick={() => onOpen(item.id)}>Abrir</button>
                                    <button type="button" className="danger" onClick={() => excluir(item.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
