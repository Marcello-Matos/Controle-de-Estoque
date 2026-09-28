# Controle de Estoque (React + Firebase)

React 19 + Vite 6 (JavaScript) + Firebase Auth + Firestore. Setup completo no README.md.

## Comandos
- `npm run dev` — servidor de desenvolvimento (http://localhost:5173)
- `npm run build` — build de produção em `dist/`
- `npm test` — sobe emuladores (auth + firestore) e roda Vitest (`tests/`). Requer Java 21+ (`JAVA_HOME`).
- `npm run emuladores` + `VITE_USAR_EMULADORES=true npm run dev` — app local contra emuladores

## Ambiente
- Node local é 22.11: Vite 7+/8 exigem 22.12+, por isso o projeto está no Vite 6.
- Dependências com versão exata; usar versões publicadas há 7+ dias.

## Convenções
- Todo acesso ao Firestore fica em `src/services/estoque.js`; páginas não chamam o SDK diretamente.
- Quantidade de produto só muda via `movimentarProduto` (transação) ou estoque inicial em `cadastrarProduto` (batch), sempre com `ultimaMovimentacaoId`. As regras em `firestore.rules` exigem isso.
- Ao mudar campos de documentos, atualizar juntos: serviço, `firestore.rules` (hasAll/hasOnly), testes e README.
- Mensagens de erro para o usuário: lançar `ErroEstoque`; `mensagemErro()` em `src/utils.js` traduz erros do Firebase.
