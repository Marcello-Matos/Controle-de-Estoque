import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

const produtosCol = collection(db, 'produtos');
const movimentacoesCol = collection(db, 'movimentacoes');

export const LIMITE_HISTORICO = 500;

export class ErroEstoque extends Error {}

function lerProduto(snap) {
  return { id: snap.id, ...snap.data() };
}

function normalizarProduto(dados) {
  return {
    nome: dados.nome.trim(),
    descricao: (dados.descricao || '').trim(),
    categoria: (dados.categoria || '').trim(),
    codigoBarras: (dados.codigoBarras || '').trim() || null,
    estoqueMinimo: parseInt(dados.estoqueMinimo, 10) || 0,
    precoCompra: parseFloat(dados.precoCompra) || 0,
    precoVenda: parseFloat(dados.precoVenda) || 0,
  };
}

function validarProduto(p, quantidade = 0) {
  if (!p.nome) throw new ErroEstoque('O nome do produto é obrigatório.');
  if (quantidade < 0 || p.estoqueMinimo < 0 || p.precoCompra < 0 || p.precoVenda < 0) {
    throw new ErroEstoque('Quantidades e preços não podem ser negativos.');
  }
}

async function garantirCodigoUnico(codigoBarras, ignorarId) {
  if (!codigoBarras) return;
  const snap = await getDocs(query(produtosCol, where('codigoBarras', '==', codigoBarras), limit(2)));
  if (snap.docs.some((d) => d.id !== ignorarId)) {
    throw new ErroEstoque('Já existe um produto com esse código de barras.');
  }
}

function novaMovimentacao(produtoId, produtoNome, tipo, quantidade, usuario, observacoes) {
  return {
    produtoId,
    produtoNome,
    tipo,
    quantidade,
    responsavel: usuario.nome,
    responsavelUid: usuario.uid,
    observacoes: (observacoes || '').trim(),
    data: serverTimestamp(),
  };
}

export function observarProdutos(callback, onErro) {
  return onSnapshot(
    query(produtosCol, orderBy('nome')),
    (snap) => callback(snap.docs.map(lerProduto)),
    onErro,
  );
}

export async function listarProdutos() {
  const snap = await getDocs(query(produtosCol, orderBy('nome')));
  return snap.docs.map(lerProduto);
}

export async function buscarProduto(id) {
  const snap = await getDoc(doc(produtosCol, id));
  return snap.exists() ? lerProduto(snap) : null;
}

export async function cadastrarProduto(dados, usuario) {
  const produto = normalizarProduto(dados);
  const quantidade = parseInt(dados.quantidade, 10) || 0;
  validarProduto(produto, quantidade);
  await garantirCodigoUnico(produto.codigoBarras);

  const produtoRef = doc(produtosCol);
  const movRef = quantidade > 0 ? doc(movimentacoesCol) : null;
  const batch = writeBatch(db);

  batch.set(produtoRef, {
    ...produto,
    quantidade,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    ultimaMovimentacaoId: movRef?.id ?? null,
  });
  if (movRef) {
    batch.set(movRef, novaMovimentacao(produtoRef.id, produto.nome, 'entrada', quantidade, usuario, 'Estoque inicial'));
  }
  await batch.commit();
}

export async function atualizarProduto(id, dados) {
  const produto = normalizarProduto(dados);
  validarProduto(produto);
  await garantirCodigoUnico(produto.codigoBarras, id);

  await runTransaction(db, async (tx) => {
    const ref = doc(produtosCol, id);
    const atual = await tx.get(ref);
    if (!atual.exists()) throw new ErroEstoque('Produto não encontrado.');
    tx.update(ref, { ...produto, atualizadoEm: serverTimestamp() });
  });
}

export async function excluirProduto(produto) {
  if (produto.ultimaMovimentacaoId) {
    throw new ErroEstoque('Não é possível excluir: o produto possui movimentações registradas.');
  }
  await deleteDoc(doc(produtosCol, produto.id));
}

export async function movimentarProduto({ produtoId, tipo, quantidade, observacoes }, usuario) {
  const qtd = parseInt(quantidade, 10);
  if (!['entrada', 'saida'].includes(tipo)) throw new ErroEstoque('Tipo de movimentação inválido.');
  if (!(qtd > 0)) throw new ErroEstoque('A quantidade deve ser maior que zero.');

  await runTransaction(db, async (tx) => {
    const produtoRef = doc(produtosCol, produtoId);
    const snap = await tx.get(produtoRef);
    if (!snap.exists()) throw new ErroEstoque('Produto não encontrado.');

    const { nome, quantidade: atual } = snap.data();
    const nova = tipo === 'entrada' ? atual + qtd : atual - qtd;
    if (nova < 0) throw new ErroEstoque(`Estoque insuficiente (disponível: ${atual}).`);

    const movRef = doc(movimentacoesCol);
    tx.set(movRef, novaMovimentacao(produtoId, nome, tipo, qtd, usuario, observacoes));
    tx.update(produtoRef, { quantidade: nova, ultimaMovimentacaoId: movRef.id, atualizadoEm: serverTimestamp() });
  });
}

export async function listarMovimentacoes({ produtoId, tipo }) {
  const filtros = [];
  if (produtoId) filtros.push(where('produtoId', '==', produtoId));
  if (tipo) filtros.push(where('tipo', '==', tipo));
  const snap = await getDocs(query(movimentacoesCol, ...filtros, orderBy('data', 'desc'), limit(LIMITE_HISTORICO)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function contarMovimentacoes() {
  const snap = await getCountFromServer(movimentacoesCol);
  return snap.data().count;
}
