# Controle de Estoque (React + Firebase)

Versão do sistema de controle de estoque usando **React + Vite**, **Firebase Authentication** e **Cloud Firestore**, com hospedagem no **Firebase Hosting**.

## Funcionalidades
- **Cada conta tem o próprio estoque**: qualquer pessoa cria a conta e começa com o estoque zerado; ninguém vê os dados de outra conta
- Login com e-mail/senha ou Google, "lembrar de mim", recuperação de senha e criação de conta
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

## 2. Usuários
Não há nada a configurar: qualquer pessoa cria a conta na tela de login (Google ou e-mail/senha) e entra na hora.
No primeiro acesso o sistema cria o perfil em `usuarios/{uid}` automaticamente, com o nome da conta.
Para bloquear alguém, desative o usuário em **Authentication > Usuários**.

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
```bash
npm run seed                            # terminal 3: cria admin@teste.com / senha123456 + produtos de exemplo
```
Os dados somem ao parar o emulador — basta rodar `npm run seed` de novo.

## Testes
```bash
npm test   # sobe os emuladores e roda os testes do serviço e das regras de segurança
```

## Estrutura de dados (Firestore)
Todos os dados de uma conta ficam dentro do documento dela:

| Caminho | Campos |
|---|---|
| `usuarios/{uid}` | `nome`, `email`, `criadoEm` (perfil, criado no primeiro acesso) |
| `usuarios/{uid}/produtos/{id}` | `nome`, `descricao`, `categoria`, `codigoBarras`, `quantidade`, `estoqueMinimo`, `precoCompra`, `precoVenda`, `criadoEm`, `atualizadoEm`, `ultimaMovimentacaoId` |
| `usuarios/{uid}/movimentacoes/{id}` | `produtoId`, `produtoNome`, `tipo` (`entrada`/`saida`), `quantidade`, `responsavel`, `responsavelUid`, `observacoes`, `data` |

## Segurança
Como o navegador acessa o Firestore diretamente, as regras em `firestore.rules` garantem que:
- cada usuário só lê e escreve dentro de `usuarios/{seu uid}` — o estoque de outra conta é inacessível;
- a quantidade de um produto só muda junto com uma movimentação consistente (mesma operação);
- o estoque nunca fica negativo e o responsável não pode ser falsificado;
- o histórico não pode ser editado nem apagado; produtos com movimentações não podem ser excluídos.
