import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

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

  async function entrar(email, senha) {
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    const perfil = await getDoc(doc(db, 'usuarios', user.uid));
    if (!perfil.exists()) {
      await signOut(auth);
      throw new Error('nao-autorizado');
    }
  }

  const sair = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
