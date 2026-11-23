/*
 * Projeto de exemplo completo: uma loja virtual com classes Java,
 * relações e arquitetura cloud (AWS ou OCI) já conectada.
 * Todos os valores respeitam a validação do back-end
 * (sem os caracteres " ; | { } e quebras de linha).
 */

const atributo = (nome, tipo) => ({ nome, tipo })
const metodo = (nome, tipoRetorno) => ({ nome, tipoRetorno })

export const CLASSES_EXEMPLO = [
    {
        nome: 'Pedido',
        atributos: [
            atributo('id', 'Long'),
            atributo('dataPedido', 'LocalDateTime'),
            atributo('status', 'String'),
            atributo('valorTotal', 'BigDecimal'),
        ],
        metodos: [
            metodo('calcularTotal', 'BigDecimal'),
            metodo('confirmar', 'void'),
            metodo('cancelar', 'Boolean'),
        ],
    },
    {
        nome: 'Cliente',
        atributos: [
            atributo('id', 'Long'),
            atributo('nome', 'String'),
            atributo('email', 'String'),
            atributo('dataCadastro', 'LocalDate'),
        ],
        metodos: [
            metodo('atualizarEmail', 'void'),
        ],
    },
    {
        nome: 'Produto',
        atributos: [
            atributo('id', 'Long'),
            atributo('nome', 'String'),
            atributo('preco', 'BigDecimal'),
            atributo('estoque', 'Integer'),
            atributo('ativo', 'Boolean'),
        ],
        metodos: [
            metodo('baixarEstoque', 'void'),
            metodo('estaDisponivel', 'Boolean'),
        ],
    },
    {
        nome: 'ItemPedido',
        atributos: [
            atributo('id', 'Long'),
            atributo('quantidade', 'Integer'),
            atributo('precoUnitario', 'BigDecimal'),
        ],
        metodos: [
            metodo('calcularSubtotal', 'BigDecimal'),
        ],
    },
    {
        nome: 'Pagamento',
        atributos: [
            atributo('id', 'Long'),
            atributo('valor', 'BigDecimal'),
            atributo('formaPagamento', 'String'),
            atributo('aprovado', 'Boolean'),
            atributo('dataPagamento', 'LocalDateTime'),
        ],
        metodos: [
            metodo('aprovar', 'Boolean'),
            metodo('estornar', 'void'),
        ],
    },
    {
        nome: 'Categoria',
        atributos: [
            atributo('id', 'Long'),
            atributo('nome', 'String'),
            atributo('descricao', 'String'),
        ],
        metodos: [],
    },
]

export const RELACOES_EXEMPLO = [
    { origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' },
    { origem: 'Pedido', destino: 'ItemPedido', tipo: 'ONE_TO_MANY' },
    { origem: 'ItemPedido', destino: 'Produto', tipo: 'MANY_TO_ONE' },
    { origem: 'Pedido', destino: 'Pagamento', tipo: 'ONE_TO_ONE' },
    { origem: 'Produto', destino: 'Categoria', tipo: 'MANY_TO_ONE' },
]

const CLOUD_EXEMPLO = {
    aws: {
        servicosCloud: [
            { id: 'rede', tipo: 'VPC', categoria: 'NETWORK', configuracao: { region: 'sa-east-1', cidrBlock: '10.0.0.0/16' } },
            { id: 'balanceador', tipo: 'ALB', categoria: 'NETWORK', configuracao: { listenerPort: '80', targetPort: '8080' } },
            { id: 'api', tipo: 'ASG', categoria: 'COMPUTE', configuracao: { instanceType: 't3.small', minSize: '2', maxSize: '4', desiredCapacity: '2' } },
            { id: 'banco', tipo: 'RDS', categoria: 'DATA', configuracao: { engine: 'mysql', engineVersion: '8.0', dbName: 'loja', username: 'admin', instanceClass: 'db.t3.micro', storage: '20' } },
            { id: 'imagens', tipo: 'S3', categoria: 'STORAGE', configuracao: { versioning: 'Enabled' } },
            { id: 'filaPedidos', tipo: 'SQS', categoria: 'MESSAGING', configuracao: { visibilityTimeoutSeconds: '60' } },
            { id: 'logs', tipo: 'CLOUDWATCH', categoria: 'OBSERVABILITY', configuracao: { retentionInDays: '30' } },
        ],
        conexoesCloud: [
            { de: 'balanceador', para: 'api', rotulo: 'HTTP 8080' },
            { de: 'api', para: 'banco', rotulo: 'SQL' },
            { de: 'api', para: 'imagens', rotulo: 'Imagens dos produtos' },
            { de: 'api', para: 'filaPedidos', rotulo: 'Eventos de pedido' },
            { de: 'api', para: 'logs', rotulo: 'Métricas e logs' },
        ],
    },
    oci: {
        servicosCloud: [
            { id: 'rede', tipo: 'VCN', categoria: 'NETWORK', configuracao: { region: 'sa-saopaulo-1', cidrBlock: '10.0.0.0/16' } },
            { id: 'balanceador', tipo: 'LOAD_BALANCER', categoria: 'NETWORK', configuracao: { shape: 'flexible' } },
            { id: 'api', tipo: 'INSTANCE', categoria: 'COMPUTE', configuracao: { shape: 'VM.Standard.A1.Flex' } },
            { id: 'banco', tipo: 'DATABASE', categoria: 'DATA', configuracao: { engine: 'mysql', dbName: 'loja', username: 'admin', cpuCoreCount: '1', storageSizeInGB: '50' } },
            { id: 'imagens', tipo: 'OBJECT_STORAGE', categoria: 'STORAGE', configuracao: { bucketName: 'loja-imagens', accessType: 'NoPublicAccess' } },
        ],
        conexoesCloud: [
            { de: 'balanceador', para: 'api', rotulo: 'HTTP 8080' },
            { de: 'api', para: 'banco', rotulo: 'SQL' },
            { de: 'api', para: 'imagens', rotulo: 'Imagens dos produtos' },
        ],
    },
}

/**
 * Gera o projeto de exemplo para o provedor informado (aws ou oci).
 * Mantém o nome atual do projeto, se houver. Sempre devolve objetos novos.
 */
export function gerarProjetoExemplo({ nome = '', provedorCloud = 'aws' } = {}) {
    const provedor = provedorCloud === 'oci' ? 'oci' : 'aws'
    const copia = (valor) => JSON.parse(JSON.stringify(valor))

    return {
        nome: String(nome || '').trim() || 'Loja Virtual',
        linguagem: 'java',
        framework: 'spring-boot',
        provedorCloud: provedor,
        classes: copia(CLASSES_EXEMPLO),
        relacoes: copia(RELACOES_EXEMPLO),
        ...copia(CLOUD_EXEMPLO[provedor]),
    }
}

/** Indica se o projeto já tem conteúdo que seria substituído pelo exemplo. */
export function projetoTemConteudo(projeto = {}) {
    return ['classes', 'relacoes', 'servicosCloud', 'conexoesCloud']
        .some((campo) => Array.isArray(projeto?.[campo]) && projeto[campo].length > 0)
}
