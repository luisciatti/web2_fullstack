# FE-28 — Geração de código

`GenerationPanel` recebe do editor o ID devolvido pelo salvamento e os estados
da versão atual do projeto. O painel utiliza um callback e funciona sem importar
o editor ou o cliente HTTP.

| Prop | Contrato |
| --- | --- |
| `idSalvo` | ID persistido em string. Ausência de ID ou `novo` impede a geração. |
| `dirty` | `true` quando o projeto atual tem alterações ainda não salvas. |
| `valido` | `true` quando a validação local do projeto passa. |
| `salvando` | `true` enquanto o salvamento está em andamento. |
| `onGenerate` | Função chamada pelo clique em **Gerar código**. Retorne a promessa da geração para manter o botão bloqueado até o fim. |
| `loading` | Estado de geração controlado pelo editor. |
| `erro` | Mensagem de falha para exibir como texto. |
| `resultado` | Último `ResultadoGeracao`, com `idProjeto`, `uml`, `cloud` e `artefatos`. Cada artefato tem `tipo`, `nome` e `conteudo`. |

## Integração no editor

Passe o ID salvo e o estado dirty calculado contra a última versão persistida.
A ação **Salvar** atualiza o projeto persistido e esse estado. Mantenha
`resultado` separado de `projeto` e continue passando o projeto atual ao
`UmlLivePreview`. Ao abrir outro projeto, limpe o resultado anterior.

```jsx
async function gerar() {
    if (!idSalvo || idSalvo === 'novo' || dirty || !valido || salvando || loading) return

    setLoading(true)
    setErro('')
    try {
        const retorno = await apiFetch(
            `/api/projetos/${encodeURIComponent(idSalvo)}/gerar`,
            { method: 'POST' },
        )
        setResultado(retorno)
    } catch (falha) {
        setErro(falha.message || 'Não foi possível gerar código.')
    } finally {
        setLoading(false)
    }
}

<GenerationPanel
    idSalvo={idSalvo}
    dirty={dirty}
    valido={valido}
    salvando={salvando}
    onGenerate={gerar}
    loading={loading}
    erro={erro}
    resultado={resultado}
/>
```

Use o POST somente dentro do callback acionado pelo botão. Montagem do painel,
edições locais e salvamento não executam esse callback.

## Teste em tela

Em `frontend`, rode `npm run dev` e abra `/exemplos/geracao.html`.

1. Confira que **Gerar código** está desabilitado sem um ID salvo. Clique em **Salvar** e confirme que nenhum arquivo aparece até clicar em **Gerar código**.
2. Clique em **Gerar código**. Confira **Gerando…**, o botão desabilitado e depois o arquivo `Pedido.java`.
3. Renomeie a classe. A UML deve refletir o novo nome e o arquivo deve continuar sendo o da última geração. Salve e confira que o arquivo segue igual até gerar novamente.
4. Marque **Simular falha** e clique em **Gerar código**. Confira a mensagem de falha e desmarque a opção para testar a recuperação.
5. Confira na aba **Network** que o fixture não faz requisição à API.
