import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Package, PackagePlus, TriangleAlert, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import AvisoVerificacao from '../components/AvisoVerificacao';
import { contarMovimentacoes, listarProdutos } from '../services/estoque';
import { formatarMoeda, formatarMoedaCompacta, mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

export default function Painel() {
  const { usuario } = useAuth();
  const { estoque, podeEditar } = useEstoque();
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([listarProdutos(), contarMovimentacoes()])
      .then(([produtos, totalMovimentacoes]) => {
        const criticos = produtos.filter((p) => p.quantidade < p.estoqueMinimo);
        setResumo({
          totalProdutos: produtos.length,
          criticos,
          totalMovimentacoes,
          valorEstoque: produtos.reduce((soma, p) => soma + p.quantidade * p.precoCompra, 0),
        });
      })
      .catch((e) => setErro({ texto: mensagemErro(e), sucesso: false }));
  }, []);

  const cartoes = resumo && [
    { icone: Package, rotulo: 'Total de Produtos', valor: resumo.totalProdutos },
    { icone: TriangleAlert, rotulo: 'Estoque Crítico', valor: resumo.criticos.length, classe: 'alerta' },
    { icone: ArrowLeftRight, rotulo: 'Movimentações', valor: resumo.totalMovimentacoes },
    {
      icone: Wallet,
      rotulo: 'Valor em Estoque',
      valor: formatarMoedaCompacta(resumo.valorEstoque),
      dica: `${formatarMoeda(resumo.valorEstoque)} (preço de compra)`,
      classe: 'verde',
    },
  ];

  return (
    <>
      <PaginaTopo
        titulo={`Olá, ${usuario.nome}!`}
        subtitulo={estoque.proprio ? 'Acompanhe o resumo do seu estoque.' : `Resumo do estoque de ${estoque.nome}.`}
      >
        {podeEditar && <Link to="/produtos/novo" className="primary-btn"><PackagePlus size={18} /> Novo produto</Link>}
      </PaginaTopo>
      <AvisoVerificacao />
      <Mensagem mensagem={erro} />

      {!resumo ? (
        !erro && <p className="carregando">Carregando...</p>
      ) : (
        <>
          <div className="stats">
            {cartoes.map(({ icone: Icone, rotulo, valor, dica, classe = '' }) => (
              <div key={rotulo} className="stat-card" title={dica}>
                <div className={`stat-icone ${classe}`}><Icone size={24} /></div>
                <div>
                  <small>{rotulo}</small>
                  <strong>{valor}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="card-titulo"><TriangleAlert size={20} /> Produtos abaixo do estoque mínimo</h2>
            <div className="tabela-rolagem">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th className="numero">Em estoque</th>
                    <th className="numero">Mínimo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {resumo.criticos.map((p) => (
                    <tr key={p.id}>
                      <td className="nome-produto">{p.nome}</td>
                      <td>{p.categoria || '—'}</td>
                      <td className="numero"><span className="badge critico">{p.quantidade}</span></td>
                      <td className="numero">{p.estoqueMinimo}</td>
                      <td className="numero">{podeEditar && <Link to="/movimentar" state={{ produtoId: p.id }}>Repor</Link>}</td>
                    </tr>
                  ))}
                  {resumo.criticos.length === 0 && (
                    <tr><td colSpan={5} className="vazio">Nenhum produto em estoque crítico. Tudo em ordem!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
