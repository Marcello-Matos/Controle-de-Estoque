import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RotaProtegida, { ExigeDono, ExigeEdicao } from './components/RotaProtegida';
import { EstoqueProvider } from './contexts/EstoqueContext';
import Login from './pages/Login';
import Painel from './pages/Painel';
import Produtos from './pages/Produtos';
import ProdutoForm from './pages/ProdutoForm';
import Movimentar from './pages/Movimentar';
import Historico from './pages/Historico';
import Compartilhar from './pages/Compartilhar';
import Perfil from './pages/Perfil';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida><EstoqueProvider><Layout /></EstoqueProvider></RotaProtegida>}>
        <Route path="/" element={<Painel />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/produtos/novo" element={<ExigeEdicao><ProdutoForm key="novo" /></ExigeEdicao>} />
        <Route path="/produtos/:id/editar" element={<ExigeEdicao><ProdutoForm key="editar" /></ExigeEdicao>} />
        <Route path="/movimentar" element={<ExigeEdicao><Movimentar /></ExigeEdicao>} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/compartilhar" element={<ExigeDono><Compartilhar /></ExigeDono>} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
