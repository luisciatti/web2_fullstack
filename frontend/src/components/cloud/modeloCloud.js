export function contarIdsServicos(servicos) {
    const contagem = new Map()
    for (const { id } of servicos) {
        const chave = id.trim()
        if (chave) contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }
    return contagem
}

export function idsDisponiveis(servicos) {
    const contagem = contarIdsServicos(servicos)
    return servicos.map(({ id }) => id).filter((id) => contagem.get(id.trim()) === 1)
}

export function atualizarServicoCloud(projeto, indice, campos) {
    const { servicosCloud, conexoesCloud } = projeto
    const idAnterior = servicosCloud[indice].id
    const servicos = servicosCloud.map((servico, i) => i === indice ? { ...servico, ...campos } : servico)
    const proximo = { ...projeto, servicosCloud: servicos }
    if (!idAnterior || campos.id === undefined || campos.id === idAnterior
        || servicos.some(({ id }) => id === idAnterior) || !conexoesCloud) return proximo

    const substituto = contarIdsServicos(servicos).get(campos.id.trim()) === 1 ? campos.id : ''
    return {
        ...proximo,
        conexoesCloud: conexoesCloud.map((conexao) =>
            conexao.de === idAnterior || conexao.para === idAnterior ? {
                ...conexao,
                de: conexao.de === idAnterior ? substituto : conexao.de,
                para: conexao.para === idAnterior ? substituto : conexao.para,
            } : conexao,
        ),
    }
}

export function removerServicoCloud(projeto, indice) {
    const { servicosCloud, conexoesCloud } = projeto
    const removido = servicosCloud[indice].id
    const servicos = servicosCloud.filter((_, i) => i !== indice)
    const proximo = { ...projeto, servicosCloud: servicos }
    if (!removido || servicos.some(({ id }) => id === removido) || !conexoesCloud) return proximo

    return {
        ...proximo,
        conexoesCloud: conexoesCloud.filter(({ de, para }) => de !== removido && para !== removido),
    }
}
