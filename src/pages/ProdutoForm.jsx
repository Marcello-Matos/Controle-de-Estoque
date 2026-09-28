import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { atualizarProduto, buscarProduto, cadastrarProduto } from '../services/estoque';
import { mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';

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
      <h2>{editando ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
      <Mensagem mensagem={mensagem} />
      <form onSubmit={handleSubmit}>
        <label>Nome:<input type="text" maxLength={150} required {...campo('nome')} /></label>
        <label>Descrição:<textarea maxLength={2000} {...campo('descricao')} /></label>
        <label>Categoria:<input type="text" maxLength={100} {...campo('categoria')} /></label>
        <label>Código de Barras:<input type="text" maxLength={50} {...campo('codigoBarras')} /></label>
        {editando ? (
          <p className="info">
            Quantidade em estoque: <strong>{form.quantidade}</strong> (altere pela tela de{' '}
            <Link to="/movimentar">movimentação</Link>)
          </p>
        ) : (
          <label>Quantidade inicial:<input type="number" min="0" step="1" required {...campo('quantidade')} /></label>
        )}
        <label>Estoque Mínimo:<input type="number" min="0" step="1" {...campo('estoqueMinimo')} /></label>
        <label>Preço de Compra:<input type="number" min="0" step="0.01" {...campo('precoCompra')} /></label>
        <label>Preço de Venda:<input type="number" min="0" step="0.01" {...campo('precoVenda')} /></label>
        <button type="submit" className="primary-btn" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </button>
      </form>
      {editando && <p><Link to="/produtos">← Voltar à lista</Link></p>}
    </>
  );
}
