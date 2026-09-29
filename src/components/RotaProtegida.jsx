import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="carregando">Carregando...</p>;
  return usuario ? children : <Navigate to="/login" replace />;
}

// Telas que alteram o estoque (convidados "Somente ver" voltam para o painel).
export function ExigeEdicao({ children }) {
  const { podeEditar } = useEstoque();
  return podeEditar ? children : <Navigate to="/" replace />;
}

// Telas exclusivas do dono do estoque aberto.
export function ExigeDono({ children }) {
  const { ehDono } = useEstoque();
  return ehDono ? children : <Navigate to="/" replace />;
}
