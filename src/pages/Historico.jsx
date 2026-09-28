import { useEffect, useState } from 'react';
import { LIMITE_HISTORICO, listarMovimentacoes, listarProdutos } from '../services/estoque';
import { formatarData, mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';

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
      <h2>Histórico de Entradas e Saídas</h2>
      <Mensagem mensagem={erro} />

      <div className="filtros">
        <label>Produto:
          <select value={filtros.produtoId} onChange={(e) => setFiltros({ ...filtros, produtoId: e.target.value })}>
            <option value="">Todos</option>
            {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label>Tipo:
          <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </label>
        <label>Responsável:
          <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </label>
      </div>

      {movimentacoes === null ? (
        !erro && <p className="carregando">Carregando...</p>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Responsável</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => (
                <tr key={m.id}>
                  <td>{formatarData(m.data)}</td>
                  <td>{m.produtoNome}</td>
                  <td>{m.tipo === 'saida' ? 'Saída' : 'Entrada'}</td>
                  <td>{m.quantidade}</td>
                  <td>{m.responsavel}</td>
                  <td>{m.observacoes}</td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr><td colSpan={6}>Nenhuma movimentação encontrada.</td></tr>
              )}
            </tbody>
          </table>
          {movimentacoes.length === LIMITE_HISTORICO && (
            <p className="info">Exibindo as {LIMITE_HISTORICO} movimentações mais recentes.</p>
          )}
        </div>
      )}
    </>
  );
}
