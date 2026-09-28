import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { movimentarProduto, observarProdutos } from '../services/estoque';
import { mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

const VAZIO = { produtoId: '', tipo: 'entrada', quantidade: '', observacoes: '' };

export default function Movimentar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({ ...VAZIO, produtoId: location.state?.produtoId ?? '' });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => observarProdutos(
    setProdutos,
    (e) => setMensagem({ texto: mensagemErro(e), sucesso: false }),
  ), []);

  const campo = (nome) => ({
    name: nome,
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value }),
  });

  const selecionado = produtos.find((p) => p.id === form.produtoId);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem(null);
    setSalvando(true);
    try {
      await movimentarProduto(form, usuario);
      setForm({ ...VAZIO, produtoId: form.produtoId, tipo: form.tipo });
      setMensagem({ texto: 'Movimentação registrada com sucesso!', sucesso: true });
    } catch (err) {
      setMensagem({ texto: mensagemErro(err), sucesso: false });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PaginaTopo titulo="Movimentar Produto" subtitulo="Registre entradas e saídas do estoque." />
      <Mensagem mensagem={mensagem} />
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="inteiro">Produto
            <select required {...campo('produtoId')}>
              <option value="">Selecione um produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} (em estoque: {p.quantidade})</option>
              ))}
            </select>
          </label>

          <div className="inteiro">
            <div className="alternador" role="radiogroup" aria-label="Tipo de movimentação">
              <button type="button" role="radio" aria-checked={form.tipo === 'entrada'} className={`entrada ${form.tipo === 'entrada' ? 'ativo' : ''}`} onClick={() => setForm({ ...form, tipo: 'entrada' })}>
                <ArrowDownToLine size={18} /> Entrada
              </button>
              <button type="button" role="radio" aria-checked={form.tipo === 'saida'} className={`saida ${form.tipo === 'saida' ? 'ativo' : ''}`} onClick={() => setForm({ ...form, tipo: 'saida' })}>
                <ArrowUpFromLine size={18} /> Saída
              </button>
            </div>
          </div>

          <label>Quantidade<input type="number" min="1" step="1" required placeholder="0" {...campo('quantidade')} /></label>
          <p className="info">
            {selecionado
              ? <>Em estoque agora: <strong>{selecionado.quantidade}</strong> unidade(s)</>
              : 'Selecione um produto para ver o estoque atual.'}
          </p>
          <label className="inteiro">Observações<textarea maxLength={1000} placeholder="Ex.: Nota fiscal 1234, venda balcão... (opcional)" {...campo('observacoes')} /></label>
        </div>
        <div className="form-acoes">
          <button type="submit" className="primary-btn" disabled={salvando}>
            <ArrowLeftRight size={18} /> {salvando ? 'Registrando...' : 'Registrar movimentação'}
          </button>
        </div>
      </form>
    </>
  );
}
