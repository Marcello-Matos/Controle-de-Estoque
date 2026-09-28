import { useEffect, useState } from 'react';
import { contarMovimentacoes, listarProdutos } from '../services/estoque';
import { mensagemErro } from '../utils';
import Mensagem from '../components/Mensagem';

export default function Painel() {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([listarProdutos(), contarMovimentacoes()])
      .then(([produtos, totalMovimentacoes]) => setResumo({
        totalProdutos: produtos.length,
        estoqueCritico: produtos.filter((p) => p.quantidade < p.estoqueMinimo).length,
        totalMovimentacoes,
      }))
      .catch((e) => setErro({ texto: mensagemErro(e), sucesso: false }));
  }, []);

  if (erro) return <Mensagem mensagem={erro} />;
  if (!resumo) return <p className="carregando">Carregando...</p>;

  return (
    <>
      <div className="card">
        <h3>📦 Total de Produtos: {resumo.totalProdutos}</h3>
      </div>
      <div className="card">
        <h3>⚠️ Produtos com Estoque Crítico: {resumo.estoqueCritico}</h3>
      </div>
      <div className="card">
        <h3>📊 Total de Movimentações: {resumo.totalMovimentacoes}</h3>
      </div>
    </>
  );
}
