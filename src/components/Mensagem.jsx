export default function Mensagem({ mensagem }) {
  if (!mensagem) return null;
  return <p className={`message ${mensagem.sucesso ? 'success' : 'error'}`}>{mensagem.texto}</p>;
}
