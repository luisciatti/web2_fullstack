# Integração de UML, Cloud e geração

Monte os componentes com o estado local do editor. O callback `setProjeto`
recebe um novo projeto a cada edição. O resultado da geração fica em estado
separado e deve ser limpo ao abrir outro projeto.

```jsx
<UmlLivePreview projeto={projeto} />
<CloudServicesPanel projeto={projeto} onChange={setProjeto} />
<CloudConnectionsPanel projeto={projeto} onChange={setProjeto} />
<CloudPreview codigoMermaid={resultado?.cloud ?? ''} />
<GenerationPanel
    idSalvo={idSalvo}
    dirty={temAlteracoesNaoSalvas}
    valido={problemas.length === 0}
    salvando={salvando}
    loading={gerando}
    erro={erroGeracao}
    resultado={resultado}
    onGenerate={gerarCodigo}
/>
<ArtifactsPanel resultado={resultado} />
```

- **UML** usa as classes e relações atuais, com debounce de 300 ms. [Contrato UML](diagramas/README.md)
- **Cloud** edita serviços e conexões locais. A prévia recebe o Mermaid da última geração. [Contratos Cloud](cloud/README.md)
- **Geração** exige ID persistido e projeto válido e salvo. O callback retorna a promessa do POST disparado pelo botão e armazena o resultado sem substituir o projeto. [Exemplo com `apiFetch`](geracao/README.md)
- **Artefatos** recebem o mesmo resultado da geração e montam o ZIP localmente com JSZip. [Contrato do ZIP](geracao/README.md#fe-29--artefatos-e-download)

## Verificação

Dentro de `frontend`, execute `npm test`, `npm run build` e `npm run dev`.
Use os fixtures abaixo, sem backend. No navegador, confira em 375 px e 1280 px.

| Fixture | O que verificar |
| --- | --- |
| `/exemplos/uml.html` | Adicione uma classe vazia, faça renomes rápidos e exclua a classe. Confira que o nome final prevalece. Ative **Usar diagrama grande**, teste o zoom e confirme que a rolagem permanece no canvas. |
| `/exemplos/cloud.html` | Edite serviços e conexões, renomeie um serviço usado por uma conexão e troque o provedor. Confira os avisos e o JSON. Carregue a prévia e confira que ela fica estável ao editar. |
| `/exemplos/geracao.html` | Salve sem gerar, gere por clique, edite a UML, simule falha e recupere. Expanda um artefato e confira o ZIP. Na aba **Network**, o fixture não deve chamar `/api/`. |

### Resultado da FE-30

- `npm test` passou com 127 testes em 18 arquivos.
- `npm run build` concluiu com aviso do Vite para chunks acima de 500 kB.
- No Chrome, a UML manteve zoom proporcional e rolagem interna em 375 px e 1280 px. Os fixtures Cloud e de geração passaram, incluindo troca de provedor, salvamento separado, recuperação após erro e download dos cinco arquivos nos caminhos esperados.
