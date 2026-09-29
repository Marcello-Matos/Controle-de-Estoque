import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ErroEstoque } from './estoque';

export const PAPEIS = {
  leitura: 'Somente ver',
  edicao: 'Pode editar',
};

const normalizarEmail = (email) => (email || '').trim().toLowerCase();

const acessosCol = (donoUid) => collection(db, 'usuarios', donoUid, 'acessos');

// Pessoas com quem o usuário logado compartilhou o próprio estoque.
export function observarAcessos(donoUid, callback, onErro) {
  return onSnapshot(
    query(acessosCol(donoUid), orderBy('email')),
    (snap) => callback(snap.docs.map((d) => d.data())),
    onErro,
  );
}

// Estoques de outras pessoas compartilhados com o e-mail do usuário logado.
export function observarCompartilhadosComigo(email, callback, onErro) {
  return onSnapshot(
    query(collectionGroup(db, 'acessos'), where('email', '==', normalizarEmail(email))),
    (snap) => callback(snap.docs.map((d) => d.data()).sort((a, b) => a.donoNome.localeCompare(b.donoNome))),
    onErro,
  );
}

export async function compartilharEstoque(emailConvidado, papel, usuario) {
  const email = normalizarEmail(emailConvidado);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErroEstoque('Digite um e-mail válido.');
  if (email === normalizarEmail(usuario.email)) throw new ErroEstoque('Você não pode compartilhar o estoque com você mesmo.');
  if (!PAPEIS[papel]) throw new ErroEstoque('Permissão inválida.');

  const ref = doc(acessosCol(usuario.uid), email);
  if ((await getDoc(ref)).exists()) throw new ErroEstoque('Essa pessoa já tem acesso. Altere a permissão na lista abaixo.');
  await setDoc(ref, {
    email,
    papel,
    donoUid: usuario.uid,
    donoNome: usuario.nome,
    criadoEm: serverTimestamp(),
  });
}

export async function alterarPermissao(donoUid, email, papel) {
  if (!PAPEIS[papel]) throw new ErroEstoque('Permissão inválida.');
  await updateDoc(doc(acessosCol(donoUid), email), { papel });
}

export async function removerAcesso(donoUid, email) {
  await deleteDoc(doc(acessosCol(donoUid), normalizarEmail(email)));
}
