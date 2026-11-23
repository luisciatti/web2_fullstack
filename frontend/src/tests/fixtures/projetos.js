export function projetoVazio() {
    return {
        nome: '',
        linguagem: 'java',
        framework: 'spring-boot',
        provedorCloud: 'aws',
        classes: [],
        relacoes: [],
        servicosCloud: [],
        conexoesCloud: [],
    }
}

export function projetoUml() {
    return {
        ...projetoVazio(),
        nome: 'Pedido',
        classes: [
            {
                nome: 'Pedido',
                atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'valor', tipo: 'BigDecimal' }],
                metodos: [{ nome: 'calcularTotal', tipoRetorno: 'BigDecimal' }],
            },
            {
                nome: 'Cliente',
                atributos: [{ nome: 'id', tipo: 'Long' }, { nome: 'nome', tipo: 'String' }],
                metodos: [],
            },
        ],
        relacoes: [{ origem: 'Pedido', destino: 'Cliente', tipo: 'MANY_TO_ONE' }],
    }
}

export function projetoCloud() {
    return {
        ...projetoUml(),
        servicosCloud: [
            { id: 'api', tipo: 'EC2', categoria: 'COMPUTE', configuracao: { instanceType: 't3.micro' } },
            { id: 'db', tipo: 'RDS', categoria: 'DATA', configuracao: { engine: 'mysql' } },
        ],
        conexoesCloud: [{ de: 'api', para: 'db', rotulo: 'API para banco' }],
    }
}
