import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { auth } from '../src/firebase';
import {
  atualizarProduto, buscarProduto, cadastrarProduto, contarMovimentacoes, definirEstoqueAtivo, ErroEstoque,
  excluirProduto, listarMovimentacoes, listarProdutos, movimentarProduto,
} from '../src/services/estoque';
import { alterarPermissao, compartilharEstoque, removerAcesso } from '../src/services/compartilhamento';

let testEnv;
let usuario;

async function produtoPorNome(nome) {
  return (await listarProdutos()).find((p) => p.nome === nome);
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-estoque',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await signOut(auth);
  definirEstoqueAtivo(null);
  const { user } = await createUserWithEmailAndPassword(auth, `user${Date.now()}@teste.com`, 'senha123456');
  usuario = { uid: user.uid, email: user.email, nome: 'Maria' };
  await testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'usuarios', user.uid), { nome: 'Maria' }));
});

afterAll(async () => {
  await signOut(auth);
  await testEnv.cleanup();
});

describe('serviço de estoque (fluxo real)', () => {
  it('cadastra produto com estoque inicial e registra a entrada', async () => {
    await cadastrarProduto({ nome: 'Caneta', quantidade: '10', estoqueMinimo: '2', precoCompra: '1.5', precoVenda: '3' }, usuario);
    const p = await produtoPorNome('Caneta');
    expect(p).toMatchObject({ quantidade: 10, estoqueMinimo: 2, precoCompra: 1.5, precoVenda: 3, codigoBarras: null });
    const movs = await listarMovimentacoes({ produtoId: p.id });
    expect(movs).toHaveLength(1);
    expect(movs[0]).toMatchObject({ tipo: 'entrada', quantidade: 10, responsavel: 'Maria', observacoes: 'Estoque inicial' });
  });

  it('cadastra produto com estoque zero sem movimentação', async () => {
    await cadastrarProduto({ nome: 'Lápis', quantidade: '0' }, usuario);
    expect(await contarMovimentacoes()).toBe(0);
  });

  it('movimenta entrada e saída e bloqueia estoque negativo', async () => {
    await cadastrarProduto({ nome: 'Caderno', quantidade: '5' }, usuario);
    const { id } = await produtoPorNome('Caderno');
    await movimentarProduto({ produtoId: id, tipo: 'entrada', quantidade: '3' }, usuario);
    await movimentarProduto({ produtoId: id, tipo: 'saida', quantidade: '6', observacoes: 'Venda' }, usuario);
    expect((await buscarProduto(id)).quantidade).toBe(2);
    await expect(movimentarProduto({ produtoId: id, tipo: 'saida', quantidade: '3' }, usuario)).rejects.toBeInstanceOf(ErroEstoque);
    expect((await buscarProduto(id)).quantidade).toBe(2);
    expect(await listarMovimentacoes({ produtoId: id, tipo: 'saida' })).toHaveLength(1);
    expect(await contarMovimentacoes()).toBe(3);
  });

  it('edita dados do produto sem alterar a quantidade', async () => {
    await cadastrarProduto({ nome: 'Borracha', quantidade: '4', codigoBarras: '123' }, usuario);
    const p = await produtoPorNome('Borracha');
    await atualizarProduto(p.id, { ...p, nome: 'Borracha Branca', quantidade: 999, precoVenda: '2.5' });
    expect(await buscarProduto(p.id)).toMatchObject({ nome: 'Borracha Branca', quantidade: 4, precoVenda: 2.5 });
  });

  it('salva a imagem do produto e permite removê-la na edição', async () => {
    const foto = 'data:image/jpeg;base64,/9j/exemplo';
    await cadastrarProduto({ nome: 'Quadro', quantidade: '2', imagem: foto }, usuario);
    const p = await produtoPorNome('Quadro');
    expect(p.imagem).toBe(foto);
    await atualizarProduto(p.id, { ...p, imagem: null });
    expect((await buscarProduto(p.id)).imagem).toBeNull();
  });

  it('rejeita imagem acima do limite', async () => {
    const gigante = `data:image/jpeg;base64,${'A'.repeat(900_001)}`;
    await expect(cadastrarProduto({ nome: 'Pesado', quantidade: '0', imagem: gigante }, usuario)).rejects.toBeInstanceOf(ErroEstoque);
  });

  it('impede código de barras duplicado', async () => {
    await cadastrarProduto({ nome: 'A', quantidade: '0', codigoBarras: '789' }, usuario);
    await expect(cadastrarProduto({ nome: 'B', quantidade: '0', codigoBarras: '789' }, usuario)).rejects.toThrow('código de barras');
  });

  it('exclui só produtos sem movimentações', async () => {
    await cadastrarProduto({ nome: 'Sem mov', quantidade: '0' }, usuario);
    await cadastrarProduto({ nome: 'Com mov', quantidade: '1' }, usuario);
    await excluirProduto(await produtoPorNome('Sem mov'));
    await expect(excluirProduto(await produtoPorNome('Com mov'))).rejects.toBeInstanceOf(ErroEstoque);
    expect((await listarProdutos()).map((p) => p.nome)).toEqual(['Com mov']);
  });
});

describe('cada usuário tem o próprio estoque', () => {
  it('uma conta nova começa com o estoque zerado e não vê os dados de outra conta', async () => {
    await cadastrarProduto({ nome: 'Produto da Maria', quantidade: '7' }, usuario);
    const maria = usuario;

    const { user } = await createUserWithEmailAndPassword(auth, `joao${Date.now()}@teste.com`, 'senha123456');
    await testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'usuarios', user.uid), { nome: 'João' }));
    const joao = { uid: user.uid, email: user.email, nome: 'João' };

    expect(await listarProdutos()).toEqual([]);
    expect(await contarMovimentacoes()).toBe(0);
    await cadastrarProduto({ nome: 'Produto do João', quantidade: '1' }, joao);
    expect((await listarProdutos()).map((p) => p.nome)).toEqual(['Produto do João']);

    const dbJoao = testEnv.authenticatedContext(joao.uid).firestore();
    await assertFails(getDocs(collection(dbJoao, 'usuarios', maria.uid, 'produtos')));
    await assertFails(getDocs(collection(dbJoao, 'usuarios', maria.uid, 'movimentacoes')));
    await assertFails(getDoc(doc(dbJoao, 'usuarios', maria.uid)));
  });

  it('o próprio usuário cria o perfil, mas não o de outra pessoa', async () => {
    const db = testEnv.authenticatedContext('novo-usuario').firestore();
    await assertSucceeds(setDoc(doc(db, 'usuarios', 'novo-usuario'), { nome: 'Ana', email: 'ana@teste.com', criadoEm: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'usuarios', 'outra-pessoa'), { nome: 'Hacker', criadoEm: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'usuarios', 'novo-usuario'), { nome: '', criadoEm: serverTimestamp() }));
  });
});

describe('regras de segurança (tentativas maliciosas)', () => {
  let db;
  let produtoId;
  const produtos = () => collection(db, 'usuarios', usuario.uid, 'produtos');
  const movimentacoes = () => collection(db, 'usuarios', usuario.uid, 'movimentacoes');

  beforeEach(async () => {
    await cadastrarProduto({ nome: 'Alvo', quantidade: '10' }, usuario);
    produtoId = (await produtoPorNome('Alvo')).id;
    db = testEnv.authenticatedContext(usuario.uid).firestore();
  });

  it('nega acesso a quem não está logado ou é outra conta', async () => {
    await assertFails(getDocs(collection(testEnv.unauthenticatedContext().firestore(), 'usuarios', usuario.uid, 'produtos')));
    const intruso = testEnv.authenticatedContext('intruso').firestore();
    await assertFails(getDocs(collection(intruso, 'usuarios', usuario.uid, 'produtos')));
    await assertFails(updateDoc(doc(intruso, 'usuarios', usuario.uid, 'produtos', produtoId), { nome: 'Hackeado' }));
    await assertFails(deleteDoc(doc(intruso, 'usuarios', usuario.uid, 'produtos', produtoId)));
    await assertSucceeds(getDocs(produtos()));
  });

  it('nega alterar a quantidade sem registrar movimentação', async () => {
    await assertFails(updateDoc(doc(produtos(), produtoId), { quantidade: 1000, atualizadoEm: serverTimestamp() }));
  });

  it('nega movimentação sem atualizar o produto', async () => {
    await assertFails(addDoc(movimentacoes(), {
      produtoId, produtoNome: 'Alvo', tipo: 'entrada', quantidade: 5, responsavel: 'Maria',
      responsavelUid: usuario.uid, observacoes: '', data: serverTimestamp(),
    }));
  });

  it('nega movimentação com quantidade que não bate com o estoque', async () => {
    const batch = writeBatch(db);
    const movRef = doc(movimentacoes());
    batch.set(movRef, {
      produtoId, produtoNome: 'Alvo', tipo: 'entrada', quantidade: 1, responsavel: 'Maria',
      responsavelUid: usuario.uid, observacoes: '', data: serverTimestamp(),
    });
    batch.update(doc(produtos(), produtoId), { quantidade: 500, ultimaMovimentacaoId: movRef.id, atualizadoEm: serverTimestamp() });
    await assertFails(batch.commit());
  });

  it('nega falsificar o responsável', async () => {
    const batch = writeBatch(db);
    const movRef = doc(movimentacoes());
    batch.set(movRef, {
      produtoId, produtoNome: 'Alvo', tipo: 'entrada', quantidade: 1, responsavel: 'Outra Pessoa',
      responsavelUid: usuario.uid, observacoes: '', data: serverTimestamp(),
    });
    batch.update(doc(produtos(), produtoId), { quantidade: 11, ultimaMovimentacaoId: movRef.id, atualizadoEm: serverTimestamp() });
    await assertFails(batch.commit());
  });

  it('nega apagar ou editar o histórico', async () => {
    const [mov] = await listarMovimentacoes({ produtoId });
    await assertFails(deleteDoc(doc(movimentacoes(), mov.id)));
    await assertFails(updateDoc(doc(movimentacoes(), mov.id), { quantidade: 1 }));
  });

  it('nega criar produto com estoque sem movimentação', async () => {
    await assertFails(setDoc(doc(produtos()), {
      nome: 'Fantasma', descricao: '', categoria: '', codigoBarras: null, quantidade: 50, estoqueMinimo: 0,
      precoCompra: 0, precoVenda: 0, imagem: null, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(), ultimaMovimentacaoId: null,
    }));
  });

  it('nega imagem maior que o permitido direto nas regras', async () => {
    await assertFails(updateDoc(doc(produtos(), produtoId), {
      imagem: `data:image/jpeg;base64,${'A'.repeat(900_001)}`, atualizadoEm: serverTimestamp(),
    }));
    await assertSucceeds(updateDoc(doc(produtos(), produtoId), {
      imagem: 'data:image/jpeg;base64,/9j/foto', atualizadoEm: serverTimestamp(),
    }));
  });
});

describe('compartilhamento de estoque', () => {
  const emailJoao = `joao${Date.now()}@teste.com`;
  let produtoId;
  let db;
  const joao = (extra = {}) => testEnv.authenticatedContext('joao-uid', { email: emailJoao, email_verified: true, ...extra }).firestore();
  const caminho = (...partes) => ['usuarios', usuario.uid, ...partes];

  function batchMovimentacao(dbAtor, { responsavel, responsavelUid, quantidadeFinal }) {
    const batch = writeBatch(dbAtor);
    const movRef = doc(collection(dbAtor, ...caminho('movimentacoes')));
    batch.set(movRef, {
      produtoId, produtoNome: 'Alvo', tipo: 'entrada', quantidade: 1, responsavel,
      responsavelUid, observacoes: '', data: serverTimestamp(),
    });
    batch.update(doc(dbAtor, ...caminho('produtos', produtoId)), {
      quantidade: quantidadeFinal, ultimaMovimentacaoId: movRef.id, atualizadoEm: serverTimestamp(),
    });
    return batch.commit();
  }

  beforeEach(async () => {
    await cadastrarProduto({ nome: 'Alvo', quantidade: '10' }, usuario);
    produtoId = (await produtoPorNome('Alvo')).id;
    await compartilharEstoque(emailJoao, 'leitura', usuario);
    await testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'usuarios', 'joao-uid'), { nome: 'João' }));
    db = joao();
  });

  it('"Somente ver" consulta produtos e histórico, mas não altera nada', async () => {
    await assertSucceeds(getDocs(collection(db, ...caminho('produtos'))));
    await assertSucceeds(getDocs(collection(db, ...caminho('movimentacoes'))));
    await assertFails(updateDoc(doc(db, ...caminho('produtos', produtoId)), { nome: 'Mudou', atualizadoEm: serverTimestamp() }));
    await assertFails(batchMovimentacao(db, { responsavel: 'João', responsavelUid: 'joao-uid', quantidadeFinal: 11 }));
  });

  it('"Pode editar" movimenta como ele mesmo, mas não exclui produtos', async () => {
    await alterarPermissao(usuario.uid, emailJoao, 'edicao');
    await assertFails(batchMovimentacao(db, { responsavel: 'Maria', responsavelUid: 'joao-uid', quantidadeFinal: 11 }));
    await assertSucceeds(batchMovimentacao(db, { responsavel: 'João', responsavelUid: 'joao-uid', quantidadeFinal: 11 }));
    await assertSucceeds(updateDoc(doc(db, ...caminho('produtos', produtoId)), { categoria: 'Nova', atualizadoEm: serverTimestamp() }));

    await cadastrarProduto({ nome: 'Sem movimento', quantidade: '0' }, usuario);
    const semMov = await produtoPorNome('Sem movimento');
    await assertFails(deleteDoc(doc(db, ...caminho('produtos', semMov.id))));
  });

  it('convidado não gerencia acessos nem vê a lista de pessoas', async () => {
    await alterarPermissao(usuario.uid, emailJoao, 'edicao');
    await assertFails(setDoc(doc(db, ...caminho('acessos', 'amigo@teste.com')), {
      email: 'amigo@teste.com', papel: 'edicao', donoUid: usuario.uid, donoNome: 'Maria', criadoEm: serverTimestamp(),
    }));
    await assertFails(updateDoc(doc(db, ...caminho('acessos', emailJoao)), { papel: 'edicao' }));
    await assertFails(getDocs(collection(db, ...caminho('acessos'))));
  });

  it('e-mail não verificado ou de outra pessoa não acessa', async () => {
    await assertFails(getDocs(collection(joao({ email_verified: false }), ...caminho('produtos'))));
    const outro = testEnv.authenticatedContext('outro-uid', { email: 'outro@teste.com', email_verified: true }).firestore();
    await assertFails(getDocs(collection(outro, ...caminho('produtos'))));
  });

  it('convidado encontra os estoques compartilhados com ele e pode sair', async () => {
    const meus = await assertSucceeds(getDocs(query(collectionGroup(db, 'acessos'), where('email', '==', emailJoao))));
    expect(meus.docs.map((d) => d.data())).toMatchObject([{ donoUid: usuario.uid, donoNome: 'Maria', papel: 'leitura' }]);
    await assertFails(getDocs(query(collectionGroup(db, 'acessos'), where('email', '==', 'outro@teste.com'))));

    await assertSucceeds(deleteDoc(doc(db, ...caminho('acessos', emailJoao))));
    await assertFails(getDocs(collection(db, ...caminho('produtos'))));
  });

  it('não permite compartilhar consigo mesmo nem com permissão inválida', async () => {
    await expect(compartilharEstoque(usuario.email, 'leitura', usuario)).rejects.toBeInstanceOf(ErroEstoque);
    await expect(compartilharEstoque(emailJoao, 'leitura', usuario)).rejects.toThrow('já tem acesso');
    const dbMaria = testEnv.authenticatedContext(usuario.uid, { email: usuario.email, email_verified: true }).firestore();
    await assertFails(setDoc(doc(dbMaria, ...caminho('acessos', 'x@teste.com')), {
      email: 'x@teste.com', papel: 'admin', donoUid: usuario.uid, donoNome: 'Maria', criadoEm: serverTimestamp(),
    }));
    await removerAcesso(usuario.uid, emailJoao);
    await assertFails(getDocs(collection(db, ...caminho('produtos'))));
  });

  it('fluxo real: convidado com "Pode editar" abre o estoque do dono e movimenta', async () => {
    await alterarPermissao(usuario.uid, emailJoao, 'edicao');
    const maria = usuario;

    const { user } = await createUserWithEmailAndPassword(auth, emailJoao, 'senha123456');
    await testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'usuarios', user.uid), { nome: 'João' }));
    await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-estoque/accounts:update', {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: user.uid, emailVerified: true }),
    });
    await user.reload();
    await user.getIdToken(true);

    expect(await listarProdutos()).toEqual([]);
    definirEstoqueAtivo(maria.uid);
    expect((await listarProdutos()).map((p) => p.nome)).toEqual(['Alvo']);
    await movimentarProduto({ produtoId, tipo: 'saida', quantidade: '4' }, { uid: user.uid, nome: 'João' });
    expect((await buscarProduto(produtoId)).quantidade).toBe(6);
    const [ultima] = await listarMovimentacoes({ produtoId, tipo: 'saida' });
    expect(ultima).toMatchObject({ responsavel: 'João', quantidade: 4 });
    await expect(excluirProduto({ id: produtoId, ultimaMovimentacaoId: null })).rejects.toThrow();
  });
});

describe('foto no perfil do usuário', () => {
  it('salva e remove a foto do perfil e rejeita imagem grande demais', async () => {
    const db = testEnv.authenticatedContext(usuario.uid).firestore();
    const ref = doc(db, 'usuarios', usuario.uid);
    await assertSucceeds(updateDoc(ref, { foto: 'data:image/jpeg;base64,/9j/perfil' }));
    const salvo = await getDoc(ref);
    expect(salvo.data().foto).toBe('data:image/jpeg;base64,/9j/perfil');
    await assertSucceeds(updateDoc(ref, { foto: null }));
    await assertFails(updateDoc(ref, { foto: 'x'.repeat(900001) }));
  });
});
