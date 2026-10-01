import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// Garante que o usuário tenha o documento de perfil em /usuarios/{uid} (criado no primeiro acesso).
async function carregarPerfil(user, nomeInformado) {
  const ref = doc(db, 'usuarios', user.uid);
  const perfil = await getDoc(ref);
  if (perfil.exists() && perfil.data().nome) return perfil.data();

  const nome = (nomeInformado || user.displayName || user.email?.split('@')[0] || 'Usuário').slice(0, 100);
  const dados = { nome, email: user.email ?? null };
  await setDoc(ref, perfil.exists() ? { ...perfil.data(), ...dados } : { ...dados, criadoEm: serverTimestamp() });
  return dados;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const nomePendente = useRef(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuario(null);
        setCarregando(false);
        return;
      }
      try {
        const perfil = await carregarPerfil(user, nomePendente.current);
        nomePendente.current = null;
        setUsuario({ uid: user.uid, email: user.email, nome: perfil.nome, emailVerificado: user.emailVerified });
      } catch (erro) {
        console.error(erro);
        await signOut(auth);
        setUsuario(null);
      }
      setCarregando(false);
    });
  }, []);

  const definirPersistencia = (lembrar) =>
    setPersistence(auth, lembrar ? browserLocalPersistence : browserSessionPersistence);

  async function entrar(email, senha, lembrar = true) {
    await definirPersistencia(lembrar);
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function entrarComGoogle(lembrar = true) {
    await definirPersistencia(lembrar);
    // No app nativo (iOS) popup não funciona na WebView: usa o login nativo do Google e converte em credencial do Firebase.
    if (Capacitor.isNativePlatform()) {
      const resultado = await FirebaseAuthentication.signInWithGoogle();
      const credencial = GoogleAuthProvider.credential(resultado.credential?.idToken);
      await signInWithCredential(auth, credencial);
      return;
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function criarConta(nome, email, senha) {
    nomePendente.current = nome;
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(user, { displayName: nome });
    await sendEmailVerification(user).catch((erro) => console.error(erro));
  }

  const recuperarSenha = (email) => sendPasswordResetEmail(auth, email);

  const reenviarVerificacao = () => sendEmailVerification(auth.currentUser);

  // Depois de clicar no link do e-mail, recarrega a conta e renova o token para as regras reconhecerem.
  async function confirmarVerificacao() {
    await auth.currentUser.reload();
    const verificado = auth.currentUser.emailVerified;
    if (verificado) {
      await auth.currentUser.getIdToken(true);
      setUsuario((atual) => ({ ...atual, emailVerificado: true }));
    }
    return verificado;
  }

  const sair = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, entrarComGoogle, criarConta, recuperarSenha, reenviarVerificacao, confirmarVerificacao, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
