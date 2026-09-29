// Popula os emuladores locais (npm run emuladores) com um usuário de teste e produtos de exemplo.
// Uso: npm run seed
const PROJETO = 'demo-estoque';
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJETO}/databases/(default)/documents`;
const ADMIN = { email: 'admin@teste.com', senha: 'senha123456', nome: 'Administrador' };

const valor = (v) => {
  if (v === null) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'string') return { stringValue: v };
  if (Number.isInteger(v)) return { integerValue: String(v) };
  return { doubleValue: v };
};

async function gravar(caminho, dados) {
  const resposta = await fetch(`${FIRESTORE}/${caminho}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, valor(v)])) }),
  });
  if (!resposta.ok) throw new Error(`Falha ao gravar ${caminho}: ${await resposta.text()}`);
}

async function criarAdmin() {
  const url = (acao) => `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${acao}?key=demo-key`;
  const corpo = JSON.stringify({ email: ADMIN.email, password: ADMIN.senha, returnSecureToken: true });
  const opcoes = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo };
  let dados = await (await fetch(url('signUp'), opcoes)).json();
  if (dados.error?.message === 'EMAIL_EXISTS') dados = await (await fetch(url('signInWithPassword'), opcoes)).json();
  if (!dados.localId) throw new Error(`Falha ao criar usuário: ${JSON.stringify(dados.error)}`);
  await gravar(`usuarios/${dados.localId}`, { nome: ADMIN.nome });
  return dados.localId;
}

const PRODUTOS = [
  ['exemplo-1', 'Notebook Pro 14', 'Informática', 'NB-001', 48, 10, 4200, 5899],
  ['exemplo-2', 'Mouse Sem Fio', 'Periféricos', 'MS-210', 3, 15, 45, 89.9],
  ['exemplo-3', 'Teclado Mecânico', 'Periféricos', 'TC-330', 22, 8, 220, 399],
  ['exemplo-4', 'Monitor 27"', 'Informática', 'MN-270', 2, 5, 1100, 1599],
  ['exemplo-5', 'Cabo HDMI 2m', 'Acessórios', 'HD-002', 120, 30, 12, 29.9],
];

try {
  const uid = await criarAdmin();
  const agora = Date.now();
  let n = 0;
  for (const [id, nome, categoria, codigoBarras, quantidade, estoqueMinimo, precoCompra, precoVenda] of PRODUTOS) {
    let ultima = null;
    for (const [tipo, qtd, observacoes] of [['entrada', quantidade + 10, 'Estoque inicial'], ['saida', 10, 'Venda balcão']]) {
      ultima = `${id}-mov-${++n}`;
      await gravar(`movimentacoes/${ultima}`, {
        produtoId: id, produtoNome: nome, tipo, quantidade: qtd, responsavel: ADMIN.nome,
        responsavelUid: uid, observacoes, data: new Date(agora - (20 - n) * 3600e3),
      });
    }
    await gravar(`produtos/${id}`, {
      nome, descricao: '', categoria, codigoBarras, quantidade, estoqueMinimo, precoCompra, precoVenda,
      criadoEm: new Date(), atualizadoEm: new Date(), ultimaMovimentacaoId: ultima,
    });
  }
  console.log(`Pronto! ${PRODUTOS.length} produtos e ${n} movimentações criados.`);
  console.log(`Login: ${ADMIN.email} / ${ADMIN.senha}`);
} catch (erro) {
  console.error(erro.message.includes('fetch failed') ? 'Emuladores não estão rodando. Execute antes: npm run emuladores' : erro.message);
  process.exit(1);
}
