import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { auth } from '../src/firebase';
import {
  atualizarProduto, buscarProduto, cadastrarProduto, contarMovimentacoes, ErroEstoque,
  excluirProduto, listarMovimentacoes, listarProdutos, movimentarProduto,
} from '../src/services/estoque';

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
      precoCompra: 0, precoVenda: 0, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(), ultimaMovimentacaoId: null,
    }));
  });
});
