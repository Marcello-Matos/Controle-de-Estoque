import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { excluirProduto, observarProdutos } from '../services/estoque';
import { formatarMoeda, mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';

export default function Produtos() {
  const location = useLocation();
  const [produtos, setProdutos] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [mensagem, setMensagem] = useState(location.state?.mensagem ?? null);

  useEffect(() => observarProdutos(
    setProdutos,
    (e) => setMensagem({ texto: mensagemErro(e), sucesso: false }),
  ), []);

  async function handleExcluir(produto) {
    if (!window.confirm(`Excluir o produto "${produto.nome}"?`)) return;
    try {
      await excluirProduto(produto);
      setMensagem({ texto: 'Produto excluído com sucesso!', sucesso: true });
    } catch (e) {
      setMensagem({ texto: mensagemErro(e), sucesso: false });
    }
  }

  const termo = filtro.trim().toLowerCase();
  const visiveis = (produtos ?? []).filter((p) => p.nome.toLowerCase().includes(termo));

  return (
    <>
      <h2>Produtos em Estoque</h2>
      <Mensagem mensagem={mensagem} />

      <label>Buscar por nome:
        <input type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Digite para filtrar..." />
      </label>

      {produtos === null ? (
        <p className="carregando">Carregando...</p>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Qtd</th>
                <th>Estoque Mínimo</th>
                <th>Preço Compra</th>
                <th>Preço Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <tr key={p.id} className={p.quantidade < p.estoqueMinimo ? 'baixo-estoque' : ''}>
                  <td>{p.nome}</td>
                  <td>{p.categoria}</td>
                  <td>{p.quantidade}</td>
                  <td>{p.estoqueMinimo}</td>
                  <td>{formatarMoeda(p.precoCompra)}</td>
                  <td>{formatarMoeda(p.precoVenda)}</td>
                  <td className="acoes">
                    <Link to={`/produtos/${p.id}/editar`}>Editar</Link>
                    <button type="button" className="link-botao perigo" onClick={() => handleExcluir(p)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr><td colSpan={7}>Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
