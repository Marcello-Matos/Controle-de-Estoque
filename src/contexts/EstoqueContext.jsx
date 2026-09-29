import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { definirEstoqueAtivo } from '../services/estoque';
import { observarCompartilhadosComigo } from '../services/compartilhamento';

const EstoqueContext = createContext(null);

export function EstoqueProvider({ children }) {
  const { usuario } = useAuth();
  const chave = `estoque:${usuario.uid}`;
  const [compartilhados, setCompartilhados] = useState(null);
  const [donoSelecionado, setDonoSelecionado] = useState(() => localStorage.getItem(chave) || usuario.uid);

  useEffect(() => {
    if (!usuario.email || !usuario.emailVerificado) {
      setCompartilhados([]);
      return undefined;
    }
    return observarCompartilhadosComigo(usuario.email, setCompartilhados, (erro) => {
      console.error(erro);
      setCompartilhados([]);
    });
  }, [usuario.email, usuario.emailVerificado]);

  const acesso = compartilhados?.find((a) => a.donoUid === donoSelecionado);
  const estoque = acesso
    ? { donoUid: acesso.donoUid, nome: acesso.donoNome, papel: acesso.papel, proprio: false }
    : { donoUid: usuario.uid, nome: usuario.nome, papel: 'dono', proprio: true };

  // Mantém o serviço apontando para o estoque aberto antes de as páginas buscarem dados.
  definirEstoqueAtivo(estoque.donoUid);

  function trocarEstoque(donoUid) {
    localStorage.setItem(chave, donoUid);
    setDonoSelecionado(donoUid);
  }

  const aguardando = compartilhados === null && donoSelecionado !== usuario.uid;

  return (
    <EstoqueContext.Provider
      value={{
        estoque,
        compartilhados: compartilhados ?? [],
        trocarEstoque,
        podeEditar: estoque.papel !== 'leitura',
        ehDono: estoque.proprio,
      }}
    >
      {aguardando ? <p className="carregando">Carregando...</p> : children}
    </EstoqueContext.Provider>
  );
}

export const useEstoque = () => useContext(EstoqueContext);
