import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { usuario, sair } = useAuth();

  return (
    <div className="container">
      <header>
        <span>Controle de Estoque</span>
        <small>Olá, {usuario.nome}!</small>
      </header>
      <nav className="menu">
        <NavLink to="/" end>🏠 Painel</NavLink>
        <NavLink to="/produtos/novo">➕ Cadastrar Produto</NavLink>
        <NavLink to="/movimentar">🔄 Movimentar Produto</NavLink>
        <NavLink to="/produtos" end>📦 Listar Produtos</NavLink>
        <NavLink to="/historico">🧾 Histórico</NavLink>
        <button type="button" className="link-botao" onClick={sair}>⏻ Sair</button>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
