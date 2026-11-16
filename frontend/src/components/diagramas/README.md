# FE22 — Prévia UML local

## Uso pela tela responsável pela integração

```jsx
import UmlLivePreview from './components/diagramas/UmlLivePreview.jsx'

<UmlLivePreview projeto={projeto} />
```

O componente recebe apenas `projeto`. Usa o serializador da FE21, sem API,
login ou persistência. Projetos sem classes com nome exibível mostram o estado
vazio. Mudanças no texto serializado iniciam uma nova renderização; resultados
anteriores são descartados pelo cleanup do efeito, inclusive após desmontagem.
O Mermaid é inicializado uma vez neste módulo de renderização, em modo strict.
Somente seu SVG resultante é inserido na área visível. Mensagens de erro são
texto fixo, sem interpolar HTML ou detalhes internos do projeto.

## Teste visual isolado

Dentro de `frontend`, execute `npm run dev` e abra
`http://localhost:5173/exemplos/uml.html` (ajuste a porta se o Vite indicar outra).
Esta página é um exemplo de desenvolvimento, independente das rotas do app;
não requer backend e não entra no build principal de produção.

1. Confira Pedido e Cliente, os membros e a associação muitos-para-um.
2. Clique em **Projeto vazio** e confira a mensagem de orientação.
3. Clique em **Carregar exemplo** e confira o retorno do SVG.
4. Edite o nome de uma classe e a respectiva origem/destino no JSON.
5. Faça várias alterações rápidas: o resultado final deve refletir o último JSON.
6. Insira uma classe com nome vazio: ela deve ser ignorada sem quebrar a prévia.
7. Reduza a janela e confira a rolagem do diagrama.

O carregamento pode ser breve. O tratamento de falhas da biblioteca e o descarte
de resultados antigos são cobertos nos testes automatizados com Mermaid simulado.
Os testes da FE21 também validam a gramática do serializador com o parser real.

## Validação

```bash
npm test
npm run build
```

As cores e bordas seguem os tokens e o painel UML existentes no repositório.
Referência: [Canvas UML no Figma](https://www.figma.com/design/lnC5C86afVvLKW9Apv1yzH/Untitled?node-id=1007-40).
O painel está integrado ao editor e atualiza ao editar classes, atributos, métodos
e relações, sem salvar. Inclui zoom de 50% a 200% e rolagem pelo teclado.
O layout completo do editor permanece fora do escopo desta prévia Mermaid.
