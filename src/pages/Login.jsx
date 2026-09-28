import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Mensagem from '../components/Mensagem';

export default function Login() {
  const { usuario, carregando, entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (carregando) return <p className="carregando">Carregando...</p>;
  if (usuario) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (err) {
      const texto = err.message === 'nao-autorizado'
        ? 'Usuário sem acesso ao sistema. Fale com o administrador.'
        : err.code === 'auth/too-many-requests'
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : 'E-mail ou senha inválidos.';
      setErro({ texto, sucesso: false });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container login">
      <header>Controle de Estoque</header>
      <div className="card">
        <h2>Login</h2>
        <Mensagem mensagem={erro} />
        <form onSubmit={handleSubmit}>
          <label>Email:<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
          <label>Senha:<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" /></label>
          <button type="submit" className="primary-btn" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}
