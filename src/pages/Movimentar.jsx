import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { movimentarProduto, observarProdutos } from '../services/estoque';
import { mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';

const VAZIO = { produtoId: '', tipo: 'entrada', quantidade: '', observacoes: '' };

export default function Movimentar() {
  const { usuario } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState(VAZIO);
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
      <h2>Registrar Entrada ou Saída</h2>
      <Mensagem mensagem={mensagem} />
      <form onSubmit={handleSubmit}>
        <label>Produto:
          <select required {...campo('produtoId')}>
            <option value="">Selecione</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} (em estoque: {p.quantidade})</option>
            ))}
          </select>
        </label>
        <label>Tipo:
          <select required {...campo('tipo')}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </label>
        <label>Quantidade:<input type="number" min="1" step="1" required {...campo('quantidade')} /></label>
        <label>Observações:<textarea maxLength={1000} {...campo('observacoes')} /></label>
        <button type="submit" className="primary-btn" disabled={salvando}>{salvando ? 'Registrando...' : 'Registrar'}</button>
      </form>
    </>
  );
}
