# FE22 — Prévia UML local

## Uso pela tela responsável pela integração

```jsx
import UmlLivePreview from './components/diagramas/UmlLivePreview.jsx'

<UmlLivePreview projeto={projeto} />
```

O componente recebe apenas `projeto`. Usa o serializador da FE21, sem API,
login ou persistência. Projetos sem classes com nome exibível mostram o estado
vazio. Passe um novo objeto `projeto` a cada edição local. Quando o texto
serializado muda, a renderização começa após 300 ms sem novas mudanças.
O SVG atual permanece visível durante a atualização. O cleanup cancela o timer
e descarta resultados de renderizações pendentes ao editar ou desmontar.
O Mermaid é inicializado uma vez neste módulo de renderização, em modo strict.
Somente seu SVG resultante é inserido na área visível. Mensagens de erro são
texto fixo, sem interpolar HTML ou detalhes internos do projeto.

## Teste visual isolado

Dentro de `frontend`, execute `npm run dev` e abra
`http://localhost:5173/exemplos/uml.html` (ajuste a porta se o Vite indicar outra).
Esta página é um exemplo de desenvolvimento, independente das rotas do app;
não requer backend e não entra no build principal de produção.

1. Confira a classe **Pedido** e clique em **Adicionar classe**. A prévia deve permanecer igual enquanto o nome estiver vazio.
2. Digite **Cliente** em **Nome**. A classe deve aparecer após a pausa de 300 ms e o tempo de desenho do Mermaid.
3. Preencha **Atributo** com `email` e **Método** com `validar`. Edite os valores e confira os membros no canvas.
4. Escolha **Um para muitos** em **Relação com Pedido** e depois **Um para um**. Confira a associação e a troca da cardinalidade.
5. Clique em **Excluir classe** e confira que Cliente e sua associação desaparecem.
6. Confira na aba **Network** do navegador que as edições não disparam requisições para `/api/`.

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
