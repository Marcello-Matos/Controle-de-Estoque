import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEstoque } from '../contexts/EstoqueContext';
import { excluirProduto, observarProdutos } from '../services/estoque';
import { formatarMoeda, mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

export default function Produtos() {
  const location = useLocation();
  const navigate = useNavigate();
  const { podeEditar, ehDono } = useEstoque();
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
      <PaginaTopo titulo="Produtos" subtitulo="Todos os itens do estoque, atualizados em tempo real.">
        {podeEditar && <Link to="/produtos/novo" className="primary-btn"><Plus size={18} /> Novo produto</Link>}
      </PaginaTopo>
      <Mensagem mensagem={mensagem} />

      <div className="card">
        <div className="filtros">
          <div className="campo-icone">
            <Search size={18} />
            <input type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar produto por nome..." aria-label="Buscar por nome" />
          </div>
        </div>

        {produtos === null ? (
          <p className="carregando">Carregando...</p>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th className="numero">Qtd</th>
                  <th className="numero">Mínimo</th>
                  <th className="numero">Preço Compra</th>
                  <th className="numero">Preço Venda</th>
                  {podeEditar && <th className="numero">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((p) => {
                  const critico = p.quantidade < p.estoqueMinimo;
                  return (
                    <tr key={p.id} className={critico ? 'baixo-estoque' : ''}>
                      <td className="nome-produto">{p.nome}</td>
                      <td>{p.categoria || '—'}</td>
                      <td className="numero">{critico ? <span className="badge critico">{p.quantidade}</span> : p.quantidade}</td>
                      <td className="numero">{p.estoqueMinimo}</td>
                      <td className="numero">{formatarMoeda(p.precoCompra)}</td>
                      <td className="numero">{formatarMoeda(p.precoVenda)}</td>
                      {podeEditar && (
                        <td>
                          <div className="acoes">
                            <button type="button" className="botao-icone" title="Editar" aria-label={`Editar ${p.nome}`} onClick={() => navigate(`/produtos/${p.id}/editar`)}>
                              <Pencil size={17} />
                            </button>
                            {ehDono && (
                              <button type="button" className="botao-icone perigo" title="Excluir" aria-label={`Excluir ${p.nome}`} onClick={() => handleExcluir(p)}>
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {visiveis.length === 0 && (
                  <tr><td colSpan={podeEditar ? 7 : 6} className="vazio">Nenhum produto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
