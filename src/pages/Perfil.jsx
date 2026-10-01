import { useRef, useState } from 'react';
import { ErroEstoque, LIMITE_IMAGEM } from '../services/estoque';
import { useAuth } from '../contexts/AuthContext';
import { lerArquivoImagem, TAMANHO_PERFIL } from '../imagem';
import { mensagemErro } from '../utils';
import { ImagePlus, Save, SlidersHorizontal, Trash2, User } from 'lucide-react';
import EditorImagem from '../components/EditorImagem';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

export default function Perfil() {
  const { usuario, atualizarPerfil } = useAuth();
  const [nome, setNome] = useState(usuario.nome);
  const [foto, setFoto] = useState(usuario.foto ?? null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [ajustandoFoto, setAjustandoFoto] = useState(null);
  const inputFoto = useRef(null);

  async function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      setAjustandoFoto(await lerArquivoImagem(arquivo));
    } catch (err) {
      setMensagem({ texto: mensagemErro(err), sucesso: false });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem(null);
    setSalvando(true);
    try {
      if (foto && foto.length > LIMITE_IMAGEM) {
        throw new ErroEstoque('A imagem ficou grande demais. Tente outra foto.');
      }
      await atualizarPerfil({ nome: nome.trim().slice(0, 100), foto });
      setMensagem({ texto: 'Perfil atualizado com sucesso!', sucesso: true });
    } catch (err) {
      setMensagem({ texto: mensagemErro(err), sucesso: false });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PaginaTopo
        titulo="Meu Perfil"
        subtitulo="Personalize sua foto e o nome exibido no sistema."
      />
      <Mensagem mensagem={mensagem} />
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="inteiro">
            <span className="rotulo">Sua foto</span>
            <div className="imagem-campo">
              {foto ? (
                <img src={foto} alt="Sua foto" className="produto-foto grande redonda" />
              ) : (
                <span className="produto-foto grande vazia redonda"><User size={34} /></span>
              )}
              <div className="imagem-acoes">
                <button type="button" className="secondary-btn" onClick={() => inputFoto.current?.click()}>
                  <ImagePlus size={17} /> {foto ? 'Trocar foto' : 'Escolher foto'}
                </button>
                {foto && (
                  <>
                    <button type="button" className="secondary-btn" onClick={() => setAjustandoFoto(foto)}>
                      <SlidersHorizontal size={17} /> Ajustar
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => setFoto(null)}>
                      <Trash2 size={17} /> Remover
                    </button>
                  </>
                )}
              </div>
            </div>
            <input ref={inputFoto} type="file" accept="image/*" hidden onChange={escolherFoto} />
          </div>
          <label className="inteiro">Nome<input type="text" maxLength={100} required value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          <label className="inteiro">E-mail<input type="email" value={usuario.email ?? ''} disabled /></label>
        </div>
        <div className="form-acoes">
          <button type="submit" className="primary-btn" disabled={salvando}>
            <Save size={18} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
      {ajustandoFoto && (
        <EditorImagem
          imagem={ajustandoFoto}
          tamanho={TAMANHO_PERFIL}
          onConfirmar={(imagem) => { setFoto(imagem); setAjustandoFoto(null); }}
          onCancelar={() => setAjustandoFoto(null)}
        />
      )}
    </>
  );
}
