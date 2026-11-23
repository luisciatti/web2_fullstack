import { useId, useState } from 'react'
import { atualizarServicoCloud, contarIdsServicos, removerServicoCloud } from './modeloCloud.js'
import './CloudServicesPanel.css'

export const TIPOS_SERVICO = {
    aws: ['VPC', 'EC2', 'ASG', 'ALB', 'RDS', 'S3', 'LAMBDA', 'SQS', 'SNS', 'CLOUDWATCH', 'DYNAMODB'],
    oci: ['VCN', 'INSTANCE', 'DATABASE', 'OBJECT_STORAGE', 'LOAD_BALANCER'],
}

const CATEGORIAS = ['COMPUTE', 'DATA', 'STORAGE', 'NETWORK', 'API', 'MESSAGING', 'OBSERVABILITY']
const tiposPara = (provedor) => Object.hasOwn(TIPOS_SERVICO, provedor) ? TIPOS_SERVICO[provedor] : []

export default function CloudServicesPanel({ projeto, onChange }) {
    const tituloId = useId()
    const [config, setConfig] = useState(null)
    const { provedorCloud = 'aws', servicosCloud = [] } = projeto
    const tipos = tiposPara(provedorCloud)
    const contagemIds = contarIdsServicos(servicosCloud)

    function alterarServico(indice, campos) {
        onChange(atualizarServicoCloud(projeto, indice, campos))
    }

    function removerServico(indice) {
        setConfig((atual) => {
            if (!atual || atual.indice === indice) return null
            return atual.indice > indice ? { ...atual, indice: atual.indice - 1 } : atual
        })
        onChange(removerServicoCloud(projeto, indice))
    }

    function alterarConfiguracao(indice, chaveOriginal, novaEntrada) {
        const entradas = Object.entries(servicosCloud[indice].configuracao ?? {})
        const atualizadas = entradas.filter(([chave]) => chave !== chaveOriginal)
        if (novaEntrada) atualizadas.push(novaEntrada)
        alterarServico(indice, { configuracao: Object.fromEntries(atualizadas) })
        setConfig(null)
    }

    return (
        <section className="cloud-services" aria-labelledby={tituloId}>
            <header className="cloud-services__header">
                <h2 id={tituloId}>Serviços Cloud</h2>
                <label>
                    Provedor Cloud
                    <select value={provedorCloud} onChange={(event) => onChange({ ...projeto, provedorCloud: event.target.value })}>
                        {!tipos.length && <option value={provedorCloud}>{provedorCloud || 'Selecione um provedor'}</option>}
                        <option value="aws">AWS</option>
                        <option value="oci">OCI</option>
                    </select>
                </label>
            </header>
            {servicosCloud.length === 0 && <p role="status">Adicione um serviço para começar.</p>}
            {servicosCloud.map((servico, indice) => {
                const { id, tipo, categoria, configuracao = {} } = servico
                const entradas = Object.entries(configuracao ?? {})
                const tipoIncompativel = tipo.trim() && !tipos.includes(tipo)
                const erros = [
                    !id.trim() && 'Informe o identificador do serviço.',
                    contagemIds.get(id.trim()) > 1 && 'Este identificador já está em uso.',
                    !tipo.trim() && 'Selecione o tipo do serviço.',
                    tipoIncompativel && `O tipo ${tipo} é incompatível com ${provedorCloud.toUpperCase() || 'o provedor atual'}. Selecione um tipo compatível para este serviço.`,
                    entradas.some(([chave, valor]) => !chave.trim() || !valor.trim()) && 'Complete a chave e o valor das configurações incompletas.',
                ].filter(Boolean)
                const rascunho = config?.indice === indice ? config : null
                const erroChave = rascunho && (
                    !rascunho.chave.trim() ? 'Informe a chave da configuração.'
                        : entradas.some(([chave]) => chave !== rascunho.original && chave.trim() === rascunho.chave.trim())
                            ? 'Esta chave já existe neste serviço.'
                            : ''
                )
                const erroValor = rascunho && !rascunho.valor.trim()
                const erroId = `${tituloId}-erros-${indice}`

                return (
                    <fieldset className="cloud-services__card" key={indice} aria-describedby={erros.length ? erroId : undefined}>
                        <legend>{id.trim() || `Serviço ${indice + 1}`}</legend>
                        <div className="cloud-services__campos">
                            <label>
                                Identificador
                                <input value={id} aria-invalid={!id.trim() || contagemIds.get(id.trim()) > 1} onChange={(event) => alterarServico(indice, { id: event.target.value })} />
                            </label>
                            <label>
                                Tipo
                                <select value={tipo} aria-invalid={Boolean(!tipo.trim() || tipoIncompativel)} onChange={(event) => alterarServico(indice, { tipo: event.target.value })}>
                                    <option value="">Selecione o tipo</option>
                                    {tipo && !tipos.includes(tipo) && <option value={tipo}>{tipo} (incompatível)</option>}
                                    {tipos.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                                </select>
                            </label>
                            <label>
                                Categoria
                                <select value={categoria ?? ''} onChange={(event) => alterarServico(indice, { categoria: event.target.value })}>
                                    <option value="">Sem categoria</option>
                                    {categoria && !CATEGORIAS.includes(categoria) && <option value={categoria}>{categoria}</option>}
                                    {CATEGORIAS.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                                </select>
                            </label>
                            <button type="button" onClick={() => removerServico(indice)}>Remover serviço</button>
                        </div>
                        {erros.length > 0 && <ul id={erroId} className="cloud-services__erros">{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul>}
                        <h3>Configuração</h3>
                        {entradas.length > 0 && (
                            <ul className="cloud-services__config">
                                {entradas.map(([chave, valor]) => (
                                    <li key={chave}>
                                        <span><strong>{chave || 'Chave vazia'}</strong> {valor || '(valor vazio)'}</span>
                                        <button type="button" disabled={Boolean(config)} aria-label={`Editar configuração ${chave}`} onClick={() => setConfig({ indice, original: chave, chave, valor })}>Editar</button>
                                        <button type="button" disabled={Boolean(config)} aria-label={`Remover configuração ${chave}`} onClick={() => alterarConfiguracao(indice, chave)}>Remover</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {rascunho ? (
                            <div className="cloud-services__campos">
                                <label>Chave<input value={rascunho.chave} onChange={(event) => setConfig({ ...rascunho, chave: event.target.value })} /></label>
                                <label>Valor<input value={rascunho.valor} onChange={(event) => setConfig({ ...rascunho, valor: event.target.value })} /></label>
                                <button type="button" disabled={Boolean(erroChave || erroValor)} onClick={() => alterarConfiguracao(indice, rascunho.original, [rascunho.chave, rascunho.valor])}>Aplicar configuração</button>
                                <button type="button" onClick={() => setConfig(null)}>Cancelar</button>
                                {(erroChave || erroValor) && (
                                    <p className="cloud-services__erros" role="status">
                                        {erroChave} {erroValor && 'Informe o valor da configuração.'}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <button type="button" disabled={Boolean(config)} onClick={() => setConfig({ indice, chave: '', valor: '' })}>Adicionar configuração</button>
                        )}
                    </fieldset>
                )
            })}
            <button type="button" onClick={() => onChange({
                ...projeto,
                servicosCloud: [...servicosCloud, { id: '', tipo: '', categoria: '', configuracao: {} }],
            })}>Adicionar serviço</button>
        </section>
    )
}
