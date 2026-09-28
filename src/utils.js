import { ErroEstoque } from './services/estoque';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const moedaCompacta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

export const formatarMoeda = (valor) => moeda.format(valor || 0);

export const formatarMoedaCompacta = (valor) => (valor >= 100000 ? moedaCompacta.format(valor) : formatarMoeda(valor));

export const formatarData = (timestamp) => (timestamp ? dataHora.format(timestamp.toDate()) : '—');

export function mensagemErro(erro) {
  if (erro instanceof ErroEstoque) return erro.message;
  console.error(erro);
  switch (erro?.code) {
    case 'permission-denied':
      return 'Você não tem permissão para esta operação.';
    case 'unavailable':
      return 'Sem conexão com o servidor. Tente novamente.';
    default:
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
}
