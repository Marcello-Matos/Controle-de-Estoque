import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Eye, History, LayoutDashboard, LogOut, Package, PackagePlus, PencilLine, Share2, Warehouse,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import { PAPEIS } from '../services/compartilhamento';
import Logo from './Logo';
import TemaToggle from './TemaToggle';

const LINKS = [
  { to: '/', texto: 'Painel', icone: LayoutDashboard, end: true },
  { to: '/produtos', texto: 'Produtos', icone: Package, end: true },
  { to: '/produtos/novo', texto: 'Cadastrar Produto', icone: PackagePlus, edicao: true },
  { to: '/movimentar', texto: 'Movimentar', icone: ArrowLeftRight, edicao: true },
  { to: '/historico', texto: 'Histórico', icone: History },
  { to: '/compartilhar', texto: 'Compartilhar', icone: Share2, dono: true },
];

export default function Layout() {
  const { usuario, sair } = useAuth();
  const { estoque, compartilhados, trocarEstoque, podeEditar, ehDono } = useEstoque();
  const navigate = useNavigate();

  const links = LINKS.filter((l) => (!l.edicao || podeEditar) && (!l.dono || ehDono));

  function handleTrocar(donoUid) {
    trocarEstoque(donoUid);
    navigate('/');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo className="marca" />

        {compartilhados.length > 0 && (
          <label className="seletor-estoque">
            <span>Estoque</span>
            <div className="campo-icone">
              <Warehouse size={18} />
              <select value={estoque.donoUid} onChange={(e) => handleTrocar(e.target.value)} aria-label="Escolher estoque">
                <option value={usuario.uid}>Meu estoque</option>
                {compartilhados.map((a) => (
                  <option key={a.donoUid} value={a.donoUid}>{a.donoNome}</option>
                ))}
              </select>
            </div>
          </label>
        )}

        <nav className="nav">
          {links.map(({ to, texto, icone: Icone, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icone size={20} strokeWidth={1.8} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>
        <TemaToggle className="nav-botao" comTexto />
        <div className="usuario-box">
          <button type="button" className="usuario-link" onClick={() => navigate('/perfil')} title="Editar perfil">
            {usuario.foto ? (
              <img src={usuario.foto} alt="" className="avatar" />
            ) : (
              <div className="avatar">{usuario.nome.charAt(0).toUpperCase()}</div>
            )}
            <div className="usuario-info">
              <strong>{usuario.nome}</strong>
              <small>{usuario.email}</small>
            </div>
          </button>
          <button type="button" className="botao-icone" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="conteudo" key={estoque.donoUid}>
        {!estoque.proprio && (
          <div className="faixa-compartilhado">
            {estoque.papel === 'leitura' ? <Eye size={18} /> : <PencilLine size={18} />}
            <span>
              Você está no estoque de <strong>{estoque.nome}</strong> · {PAPEIS[estoque.papel]}
            </span>
            <button type="button" className="link-botao" onClick={() => handleTrocar(usuario.uid)}>Voltar para o meu estoque</button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
