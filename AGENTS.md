# Controle de Estoque (React + Firebase)

React 19 + Vite 6 (JavaScript) + Firebase Auth + Firestore. Setup completo no README.md.

## Comandos
- `npm run dev` — servidor de desenvolvimento (http://localhost:5173)
- `npm run build` — build de produção em `dist/`
- `npm test` — sobe emuladores (auth + firestore) e roda Vitest (`tests/`). Requer Java 21+; nesta máquina: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home npm test` (o `java` do sistema é 11).
- `npm run emuladores` + `VITE_USAR_EMULADORES=true npm run dev` — app local contra emuladores
- `npm run seed` — com os emuladores rodando, cria `admin@teste.com` e `convidado@teste.com` (senha `senha123456`), produtos de exemplo e um compartilhamento "Pode editar" (pode rodar várias vezes). Os emuladores não guardam dados ao parar; `npm test` também limpa o Firestore, então rode o seed de novo depois.
- `npm run sync` — build + copia `dist/` para o app iOS (Capacitor). `npm run ios` faz isso e abre o Xcode. Setup iOS (GoogleService-Info.plist, URL scheme, signing): seção "App iOS" do README.

## Ambiente
- Node local é 22.11: Vite 7+/8 exigem 22.12+, por isso o projeto está no Vite 6.
- Dependências com versão exata; usar versões publicadas há 7+ dias.

## Convenções
- **Multiusuário isolado**: cada conta tem o próprio estoque em `usuarios/{uid}/produtos` e `usuarios/{uid}/movimentacoes`. Cadastro é livre (sem aprovação); o perfil `usuarios/{uid}` é criado no primeiro login (`carregarPerfil` em `AuthContext`). Nunca criar coleções na raiz.
- **Compartilhamento**: `usuarios/{dono}/acessos/{email}` com `papel` `leitura`/`edicao`. Convidado precisa de `email_verified`. `EstoqueContext` guarda o estoque aberto (`estoque`, `podeEditar`, `ehDono`) e chama `definirEstoqueAtivo`; telas de edição usam `ExigeEdicao`, telas do dono usam `ExigeDono`. Excluir produto e gerenciar acessos: só o dono.
- Todo acesso ao Firestore fica em `src/services/` (`estoque.js` usa o estoque ativo; `compartilhamento.js`); páginas não chamam o SDK diretamente.
- Quantidade de produto só muda via `movimentarProduto` (transação) ou estoque inicial em `cadastrarProduto` (batch), sempre com `ultimaMovimentacaoId`. As regras em `firestore.rules` exigem isso.
- Ao mudar campos de documentos, atualizar juntos: serviço, `firestore.rules` (hasAll/hasOnly), testes e README.
- **Foto do produto**: campo `imagem` é data URL JPEG quadrado (480px, ≤900 mil chars) salvo no próprio doc — sem Firebase Storage. Recorte/zoom via `react-easy-crop` em `EditorImagem.jsx`; helpers de canvas em `src/imagem.js`.
- Visual "StockPro" com tema escuro (padrão) e claro (`[data-tema='claro']` no `<html>`, salvo em `localStorage.tema`, alternado por `TemaToggle`). Nunca usar cores fixas nos CSS: usar/criar variáveis no `:root` e no bloco `[data-tema='claro']` de `src/styles.css`. Páginas usam `PaginaTopo` + `.card`; ícones via `lucide-react`; marca em `src/components/Logo.jsx`.
- Mensagens de erro para o usuário: lançar `ErroEstoque`; `mensagemErro()` em `src/utils.js` traduz erros do Firebase.
