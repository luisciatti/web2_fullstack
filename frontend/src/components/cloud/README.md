# FE-26 — Serviços Cloud

O painel segue o modelo da seção Serviços cloud de `Editor.jsx`.

| Campo | Formato |
| --- | --- |
| `projeto.provedorCloud` | `aws` ou `oci`. Se omitido, usa AWS. |
| `projeto.servicosCloud` | Lista de serviços. Se omitida, começa vazia. |
| `id` | Identificador em string. Obrigatório e único ao desconsiderar espaços nas extremidades. |
| `tipo` | Tipo em string, obrigatório e validado para o provedor. |
| `categoria` | Categoria em string. Opções do editor incluem `COMPUTE`, `DATA`, `STORAGE`, `NETWORK`, `API`, `MESSAGING` e `OBSERVABILITY`. Uma string vazia representa a ausência de categoria. |
| `configuracao` | Objeto com chaves e valores em string. Exemplos: `instanceType` para EC2 e `engine` para RDS. |

`TIPOS_SERVICO` replica a lista de tipos do editor.

- AWS: `VPC`, `EC2`, `ASG`, `ALB`, `RDS`, `S3`, `LAMBDA`, `SQS`, `SNS`, `CLOUDWATCH`, `DYNAMODB`.
- OCI: `VCN`, `INSTANCE`, `DATABASE`, `OBJECT_STORAGE`, `LOAD_BALANCER`.

```jsx
<CloudServicesPanel projeto={projeto} onChange={setProjeto} />
```

O componente é controlado pelo projeto recebido. Cada operação concluída chama
`onChange(novoProjeto)` e preserva os demais campos. Ao renomear um serviço,
atualiza as conexões que usavam o identificador antigo. Se o novo identificador
estiver vazio ou duplicado, o campo da conexão fica vazio para correção e o rótulo
é mantido. Ao excluir um serviço, remove as conexões associadas se nenhum outro
serviço usar o identificador. Use uma nova `key` se trocar o projeto inteiro
com o painel montado.

Trocar de provedor mantém os serviços e configurações, com aviso nos tipos
incompatíveis. Campos do serviço são editados diretamente no estado local do
projeto. Chave e valor ficam em rascunho até **Aplicar configuração**. Isso
permite renomear uma chave inteira e validar duplicatas antes de gravar o mapa.
O painel não usa a API.

## FE-27 — Conexões e prévia gerada

```jsx
<CloudConnectionsPanel projeto={projeto} onChange={setProjeto} />
<CloudPreview codigoMermaid={resultado?.cloud ?? ''} />
```

As conexões usam `{ de, para, rotulo }`. Origem e destino usam IDs únicos
dos serviços. Conexões importadas com referência ausente ou ambígua mostram
um aviso e podem ser corrigidas ou removidas. O rótulo é opcional.

A prévia recebe o Mermaid da última geração. O consumidor fornece uma nova
string ao receber outro resultado. No fixture, **Carregar resultado de exemplo**
carrega um resultado estático para o provedor atual. O resultado permanece
visível durante edições do projeto.

## Verificação manual

Em `frontend`, rode `npm run dev` e abra `/exemplos/cloud.html`.

1. Confira EC2 e RDS no exemplo AWS. Adicione um serviço vazio para ver os avisos, edite seus campos e teste um ID duplicado.
2. Adicione uma configuração com valor `001`. Renomeie a chave e confira no JSON que o valor permanece uma string.
3. Tente renomear a chave para outra já existente. Confira o aviso e os valores no JSON.
4. Troque o provedor para OCI no seletor. Os tipos AWS devem permanecer visíveis com avisos e as configurações devem permanecer no JSON.
5. Carregue o exemplo OCI e confira INSTANCE e DATABASE. Exclua uma configuração e um serviço e confira o JSON.
6. Adicione uma conexão, escolha origem e destino e edite o rótulo. Renomeie um serviço e confira o novo ID na conexão. Exclua o serviço e confira que suas conexões somem.
7. Carregue um resultado de exemplo e edite uma conexão. Confira que o diagrama continua mostrando a última geração.
