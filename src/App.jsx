import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RotaProtegida from './components/RotaProtegida';
import Login from './pages/Login';
import Painel from './pages/Painel';
import Produtos from './pages/Produtos';
import ProdutoForm from './pages/ProdutoForm';
import Movimentar from './pages/Movimentar';
import Historico from './pages/Historico';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route path="/" element={<Painel />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/produtos/novo" element={<ProdutoForm key="novo" />} />
        <Route path="/produtos/:id/editar" element={<ProdutoForm key="editar" />} />
        <Route path="/movimentar" element={<Movimentar />} />
        <Route path="/historico" element={<Historico />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
