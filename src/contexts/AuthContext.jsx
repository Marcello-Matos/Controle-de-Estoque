import { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

async function exigirAutorizacao(user) {
  const perfil = await getDoc(doc(db, 'usuarios', user.uid));
  if (!perfil.exists()) {
    await signOut(auth);
    throw new Error('nao-autorizado');
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuario(null);
        setCarregando(false);
        return;
      }
      try {
        const perfil = await getDoc(doc(db, 'usuarios', user.uid));
        if (perfil.exists()) {
          setUsuario({ uid: user.uid, email: user.email, nome: perfil.data().nome });
        } else {
          await signOut(auth);
          setUsuario(null);
        }
      } catch {
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
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    await exigirAutorizacao(user);
  }

  async function entrarComGoogle(lembrar = true) {
    await definirPersistencia(lembrar);
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    await exigirAutorizacao(user);
  }

  async function criarConta(nome, email, senha) {
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(user, { displayName: nome });
    await signOut(auth);
  }

  const recuperarSenha = (email) => sendPasswordResetEmail(auth, email);

  const sair = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, entrarComGoogle, criarConta, recuperarSenha, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
