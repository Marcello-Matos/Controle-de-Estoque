import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { atualizarProduto, buscarProduto, cadastrarProduto } from '../services/estoque';
import { mensagemErro } from '../utils';
import { ArrowLeft, PackagePlus, Save } from 'lucide-react';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

const VAZIO = {
  nome: '', descricao: '', categoria: '', codigoBarras: '',
  quantidade: '', estoqueMinimo: '', precoCompra: '', precoVenda: '',
};

export default function ProdutoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    if (!editando) {
      setForm(VAZIO);
      return;
    }
    buscarProduto(id)
      .then((p) => {
        if (!p) {
          navigate('/produtos', { state: { mensagem: { texto: 'Produto não encontrado.', sucesso: false } } });
          return;
        }
        setForm({ ...p, codigoBarras: p.codigoBarras ?? '' });
        setCarregando(false);
      })
      .catch((e) => setMensagem({ texto: mensagemErro(e), sucesso: false }));
  }, [id, editando, navigate]);

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
      if (editando) {
        await atualizarProduto(id, form);
        navigate('/produtos', { state: { mensagem: { texto: 'Produto atualizado com sucesso!', sucesso: true } } });
      } else {
        await cadastrarProduto(form, usuario);
        setForm(VAZIO);
        setMensagem({ texto: 'Produto cadastrado com sucesso!', sucesso: true });
      }
    } catch (err) {
      setMensagem({ texto: mensagemErro(err), sucesso: false });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando && !mensagem) return <p className="carregando">Carregando...</p>;

  return (
    <>
      <PaginaTopo
        titulo={editando ? 'Editar Produto' : 'Cadastrar Produto'}
        subtitulo={editando ? 'Atualize as informações do produto.' : 'Preencha os dados do novo item do estoque.'}
      />
      <Mensagem mensagem={mensagem} />
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="inteiro">Nome<input type="text" maxLength={150} required placeholder="Ex.: Notebook Pro 14" {...campo('nome')} /></label>
          <label className="inteiro">Descrição<textarea maxLength={2000} placeholder="Detalhes do produto (opcional)" {...campo('descricao')} /></label>
          <label>Categoria<input type="text" maxLength={100} placeholder="Ex.: Informática" {...campo('categoria')} /></label>
          <label>Código de Barras<input type="text" maxLength={50} placeholder="Opcional" {...campo('codigoBarras')} /></label>
          {editando ? (
            <p className="info">
              Quantidade em estoque: <strong>{form.quantidade}</strong>. Altere pela tela de{' '}
              <Link to="/movimentar" state={{ produtoId: id }}>movimentação</Link>.
            </p>
          ) : (
            <label>Quantidade inicial<input type="number" min="0" step="1" required placeholder="0" {...campo('quantidade')} /></label>
          )}
          <label>Estoque Mínimo<input type="number" min="0" step="1" placeholder="0" {...campo('estoqueMinimo')} /></label>
          <label>Preço de Compra (R$)<input type="number" min="0" step="0.01" placeholder="0,00" {...campo('precoCompra')} /></label>
          <label>Preço de Venda (R$)<input type="number" min="0" step="0.01" placeholder="0,00" {...campo('precoVenda')} /></label>
        </div>
        <div className="form-acoes">
          <button type="submit" className="primary-btn" disabled={salvando}>
            {editando ? <Save size={18} /> : <PackagePlus size={18} />}
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
          {editando && <Link to="/produtos" className="secondary-btn"><ArrowLeft size={18} /> Voltar à lista</Link>}
        </div>
      </form>
    </>
  );
}
