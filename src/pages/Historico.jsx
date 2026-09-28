import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Search } from 'lucide-react';
import { LIMITE_HISTORICO, listarMovimentacoes, listarProdutos } from '../services/estoque';
import { formatarData, mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';
import PaginaTopo from '../components/PaginaTopo';

export default function Historico() {
  const [produtos, setProdutos] = useState([]);
  const [filtros, setFiltros] = useState({ produtoId: '', tipo: '' });
  const [responsavel, setResponsavel] = useState('');
  const [movimentacoes, setMovimentacoes] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarProdutos().then(setProdutos).catch((e) => setErro({ texto: mensagemErro(e), sucesso: false }));
  }, []);

  useEffect(() => {
    setMovimentacoes(null);
    listarMovimentacoes(filtros)
      .then(setMovimentacoes)
      .catch((e) => setErro({ texto: mensagemErro(e), sucesso: false }));
  }, [filtros]);

  const termo = responsavel.trim().toLowerCase();
  const visiveis = (movimentacoes ?? []).filter((m) => m.responsavel.toLowerCase().includes(termo));

  return (
    <>
      <PaginaTopo titulo="Histórico" subtitulo="Todas as entradas e saídas registradas." />
      <Mensagem mensagem={erro} />

      <div className="card">
        <div className="filtros">
          <label>Produto
            <select value={filtros.produtoId} onChange={(e) => setFiltros({ ...filtros, produtoId: e.target.value })}>
              <option value="">Todos</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label>Tipo
            <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
          <label>Responsável
            <div className="campo-icone">
              <Search size={18} />
              <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Buscar por nome..." />
            </div>
          </label>
        </div>

        {movimentacoes === null ? (
          !erro && <p className="carregando">Carregando...</p>
        ) : (
          <>
            <div className="tabela-rolagem">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th className="numero">Quantidade</th>
                    <th>Responsável</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((m) => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatarData(m.data)}</td>
                      <td className="nome-produto">{m.produtoNome}</td>
                      <td>
                        {m.tipo === 'saida'
                          ? <span className="badge saida"><ArrowUpFromLine size={13} /> Saída</span>
                          : <span className="badge entrada"><ArrowDownToLine size={13} /> Entrada</span>}
                      </td>
                      <td className="numero">{m.quantidade}</td>
                      <td>{m.responsavel}</td>
                      <td>{m.observacoes || '—'}</td>
                    </tr>
                  ))}
                  {visiveis.length === 0 && (
                    <tr><td colSpan={6} className="vazio">Nenhuma movimentação encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {movimentacoes.length === LIMITE_HISTORICO && (
              <p className="rodape-tabela">Exibindo as {LIMITE_HISTORICO} movimentações mais recentes.</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
