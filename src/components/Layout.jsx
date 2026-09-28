import { NavLink, Outlet } from 'react-router-dom';
import { ArrowLeftRight, History, LayoutDashboard, LogOut, Package, PackagePlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import TemaToggle from './TemaToggle';

const LINKS = [
  { to: '/', texto: 'Painel', icone: LayoutDashboard, end: true },
  { to: '/produtos', texto: 'Produtos', icone: Package, end: true },
  { to: '/produtos/novo', texto: 'Cadastrar Produto', icone: PackagePlus },
  { to: '/movimentar', texto: 'Movimentar', icone: ArrowLeftRight },
  { to: '/historico', texto: 'Histórico', icone: History },
];

export default function Layout() {
  const { usuario, sair } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo className="marca" />
        <nav className="nav">
          {LINKS.map(({ to, texto, icone: Icone, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icone size={20} strokeWidth={1.8} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>
        <TemaToggle className="nav-botao" comTexto />
        <div className="usuario-box">
          <div className="avatar">{usuario.nome.charAt(0).toUpperCase()}</div>
          <div className="usuario-info">
            <strong>{usuario.nome}</strong>
            <small>{usuario.email}</small>
          </div>
          <button type="button" className="botao-icone" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
