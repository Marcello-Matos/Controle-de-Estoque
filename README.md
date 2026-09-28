# Controle de Estoque (React + Firebase)

Versão do sistema de controle de estoque usando **React + Vite**, **Firebase Authentication** e **Cloud Firestore**, com hospedagem no **Firebase Hosting**.

## Funcionalidades
- Login com e-mail/senha ou Google, "lembrar de mim", recuperação de senha e criação de conta (o acesso só é liberado pelo administrador)
- Painel com total de produtos, produtos em estoque crítico e total de movimentações
- Cadastro, edição, listagem (em tempo real) e exclusão de produtos
- Entradas e saídas com bloqueio de estoque negativo (transação)
- Histórico imutável com filtros por produto, tipo e responsável

## Pré-requisitos
- Node.js 20.19+ ou 22+
- Para os emuladores/testes locais: Java 21+ (`brew install openjdk@21`)

## 1. Criar o projeto no Firebase (uma única vez)
1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto**.
2. **Authentication** > Primeiros passos > aba **Método de login** > ative **E-mail/senha** e **Google**.
   Ao publicar em outro domínio, adicione-o em **Authentication > Configurações > Domínios autorizados**.
3. **Firestore Database** > **Criar banco de dados** > escolha a região (ex.: `southamerica-east1`) > modo **produção**.
4. **Configurações do projeto** (engrenagem) > **Seus apps** > ícone **Web (`</>`)** > registre o app.
   Copie os valores do `firebaseConfig`.
5. Nesta pasta:
   ```bash
   cp .env.example .env.local   # cole os valores do firebaseConfig
   npx firebase login
   npx firebase use --add       # selecione o projeto criado
   npx firebase deploy --only firestore   # publica regras e índices
   ```

## 2. Liberar usuários
Qualquer pessoa pode **criar conta** (e-mail/senha ou Google) na tela de login, mas só entra no sistema quem o administrador liberar:
1. A conta aparece em **Authentication** > **Usuários** (ou o admin cria em **Adicionar usuário**). Copie o **UID do usuário**.
2. **Firestore** > coleção `usuarios` > **Adicionar documento** > **ID do documento** = UID copiado >
   campo `nome` (string) = nome da pessoa (aparece como "responsável" nas movimentações).

Para remover o acesso de alguém, apague o documento em `usuarios` (e/ou desative o usuário no Authentication).

## 3. Rodar
```bash
npm install
npm run dev        # http://localhost:5173
```

## 4. Publicar na internet
```bash
npm run deploy     # build + Firebase Hosting + regras
```
O endereço será `https://SEU-PROJETO.web.app`.

## Desenvolvimento local sem Firebase real (emuladores)
```bash
npm run emuladores                      # terminal 1 (UI em http://127.0.0.1:4000)
VITE_USAR_EMULADORES=true npm run dev   # terminal 2
```
Crie o usuário na UI do emulador (Authentication) e o documento `usuarios/{uid}` (Firestore). Os dados somem ao parar o emulador.

## Testes
```bash
npm test   # sobe os emuladores e roda os testes do serviço e das regras de segurança
```

## Estrutura de dados (Firestore)
| Coleção | Campos |
|---|---|
| `usuarios/{uid}` | `nome` |
| `produtos/{id}` | `nome`, `descricao`, `categoria`, `codigoBarras`, `quantidade`, `estoqueMinimo`, `precoCompra`, `precoVenda`, `criadoEm`, `atualizadoEm`, `ultimaMovimentacaoId` |
| `movimentacoes/{id}` | `produtoId`, `produtoNome`, `tipo` (`entrada`/`saida`), `quantidade`, `responsavel`, `responsavelUid`, `observacoes`, `data` |

## Segurança
Como o navegador acessa o Firestore diretamente, as regras em `firestore.rules` garantem que:
- só usuários em `usuarios/{uid}` leem/escrevem;
- a quantidade de um produto só muda junto com uma movimentação consistente (mesma operação);
- o estoque nunca fica negativo e o responsável não pode ser falsificado;
- o histórico não pode ser editado nem apagado; produtos com movimentações não podem ser excluídos.
