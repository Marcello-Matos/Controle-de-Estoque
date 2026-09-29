import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Mail, Share2, Trash2, UserPlus, Users, Warehouse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import {
  alterarPermissao, compartilharEstoque, observarAcessos, PAPEIS, removerAcesso,
} from '../services/compartilhamento';
import { mensagemErro } from '../utils';
import AvisoVerificacao from '../components/AvisoVerificacao';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

export default function Compartilhar() {
  const { usuario } = useAuth();
  const { compartilhados, trocarEstoque } = useEstoque();
  const navigate = useNavigate();
  const [acessos, setAcessos] = useState(null);
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState('leitura');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => observarAcessos(
    usuario.uid,
    setAcessos,
    (e) => setMensagem({ texto: mensagemErro(e), sucesso: false }),
  ), [usuario.uid]);

  async function executar(acao, sucesso) {
    setMensagem(null);
    try {
      await acao();
      if (sucesso) setMensagem({ texto: sucesso, sucesso: true });
    } catch (e) {
      setMensagem({ texto: mensagemErro(e), sucesso: false });
    }
  }

  async function handleConvidar(e) {
    e.preventDefault();
    setEnviando(true);
    const convidado = email.trim().toLowerCase();
    await executar(async () => {
      await compartilharEstoque(convidado, papel, usuario);
      setEmail('');
    }, `Pronto! Quando ${convidado} entrar no StockPro com esse e-mail, o seu estoque vai aparecer para ele(a).`);
    setEnviando(false);
  }

  function handleRemover(acesso) {
    if (!window.confirm(`Remover o acesso de ${acesso.email}?`)) return;
    executar(() => removerAcesso(usuario.uid, acesso.email), 'Acesso removido.');
  }

  function handleSair(acesso) {
    if (!window.confirm(`Sair do estoque de ${acesso.donoNome}? Você deixará de ter acesso a ele.`)) return;
    executar(() => removerAcesso(acesso.donoUid, usuario.email), `Você saiu do estoque de ${acesso.donoNome}.`);
  }

  function abrir(acesso) {
    trocarEstoque(acesso.donoUid);
    navigate('/');
  }

  return (
    <>
      <PaginaTopo titulo="Compartilhar" subtitulo="Dê acesso ao seu estoque para outras pessoas." />
      <AvisoVerificacao />
      <Mensagem mensagem={mensagem} />

      <form className="card" onSubmit={handleConvidar}>
        <h2 className="card-titulo"><UserPlus size={20} /> Convidar pessoa</h2>
        <div className="form-convite">
          <label>E-mail da pessoa
            <div className="campo-icone">
              <Mail size={18} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" />
            </div>
          </label>
          <label>Permissão
            <select value={papel} onChange={(e) => setPapel(e.target.value)}>
              {Object.entries(PAPEIS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </select>
          </label>
          <button type="submit" className="primary-btn" disabled={enviando}>
            <Share2 size={18} /> {enviando ? 'Compartilhando...' : 'Compartilhar'}
          </button>
        </div>
        <p className="info">
          <strong>Somente ver:</strong> consulta produtos e histórico. <strong>Pode editar:</strong> também cadastra,
          edita e movimenta. Excluir produtos e gerenciar acessos continuam só com você.
        </p>
      </form>

      <div className="card">
        <h2 className="card-titulo"><Users size={20} /> Pessoas com acesso ao seu estoque</h2>
        {acessos === null ? (
          <p className="carregando">Carregando...</p>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Permissão</th>
                  <th className="numero">Remover</th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((a) => (
                  <tr key={a.email}>
                    <td className="nome-produto">{a.email}</td>
                    <td className="celula-select">
                      <select
                        value={a.papel}
                        aria-label={`Permissão de ${a.email}`}
                        onChange={(e) => executar(() => alterarPermissao(usuario.uid, a.email, e.target.value), 'Permissão atualizada.')}
                      >
                        {Object.entries(PAPEIS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="acoes">
                        <button type="button" className="botao-icone perigo" title="Remover acesso" aria-label={`Remover acesso de ${a.email}`} onClick={() => handleRemover(a)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {acessos.length === 0 && (
                  <tr><td colSpan={3} className="vazio">Seu estoque ainda não foi compartilhado com ninguém.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-titulo"><Warehouse size={20} /> Estoques compartilhados com você</h2>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Dono</th>
                <th>Sua permissão</th>
                <th className="numero">Ações</th>
              </tr>
            </thead>
            <tbody>
              {compartilhados.map((a) => (
                <tr key={a.donoUid}>
                  <td className="nome-produto">Estoque de {a.donoNome}</td>
                  <td>{PAPEIS[a.papel]}</td>
                  <td>
                    <div className="acoes">
                      <button type="button" className="link-botao" onClick={() => abrir(a)}>Abrir</button>
                      <button type="button" className="botao-icone perigo" title="Sair deste estoque" aria-label={`Sair do estoque de ${a.donoNome}`} onClick={() => handleSair(a)}>
                        <DoorOpen size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {compartilhados.length === 0 && (
                <tr><td colSpan={3} className="vazio">Ninguém compartilhou um estoque com você ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
