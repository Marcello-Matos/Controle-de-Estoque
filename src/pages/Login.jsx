import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ArrowLeftRight, ArrowRight, ChartColumn, Eye, EyeOff, FileChartColumn, Lock, Mail, Package,
  ShieldCheck, User, Users, Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import IlustracaoEstoque from '../components/IlustracaoEstoque';
import Logo from '../components/Logo';
import TemaToggle from '../components/TemaToggle';
import './Login.css';

const RECURSOS = [
  { icone: Package, texto: 'Produtos' },
  { icone: ArrowLeftRight, texto: 'Entradas e Saídas' },
  { icone: FileChartColumn, texto: 'Relatórios' },
  { icone: Users, texto: 'Multiusuários' },
];

const DESTAQUES = [
  { icone: ChartColumn, texto: 'Controle de Estoque' },
  { icone: ShieldCheck, texto: 'Mais Segurança' },
  { icone: Zap, texto: 'Agilidade nos Processos' },
];

const ERROS_AUTH = {
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.',
  'auth/operation-not-allowed': 'Este método de login não está habilitado no Firebase.',
  'auth/network-request-failed': 'Sem conexão com o servidor. Tente novamente.',
};

function traduzirErro(err) {
  return ERROS_AUTH[err.code] || 'E-mail ou senha inválidos.';
}

function GoogleIcone() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Login() {
  const { usuario, carregando, entrar, entrarComGoogle, criarConta, recuperarSenha } = useAuth();
  const [modo, setModo] = useState('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (carregando) return <div className="login-page"><p className="login-carregando">Carregando...</p></div>;
  if (usuario) return <Navigate to="/" replace />;

  const criando = modo === 'criar';

  async function executar(acao) {
    setMensagem(null);
    setEnviando(true);
    try {
      await acao();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setMensagem({ texto: traduzirErro(err), sucesso: false });
      }
    } finally {
      setEnviando(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    executar(async () => {
      if (criando) {
        await criarConta(nome.trim(), email, senha);
      } else {
        await entrar(email, senha, lembrar);
      }
    });
  }

  function handleEsqueciSenha() {
    if (!email) {
      setMensagem({ texto: 'Digite seu e-mail no campo acima para recuperar a senha.', sucesso: false });
      return;
    }
    executar(async () => {
      await recuperarSenha(email).catch((err) => {
        if (err.code !== 'auth/user-not-found') throw err;
      });
      setMensagem({ texto: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.', sucesso: true });
    });
  }

  function alternarModo() {
    setModo(criando ? 'entrar' : 'criar');
    setMensagem(null);
  }

  return (
    <div className="login-page">
      <TemaToggle className="botao-icone login-tema" />
      <section className="login-hero">
        <div className="hero-texto">
          <h1>Seu estoque<br />sempre no <span>controle.</span></h1>
          <p>Mais organização, agilidade<br />e eficiência para o seu negócio.</p>
        </div>

        <div className="hero-arte">
          <IlustracaoEstoque />
          <ul className="hero-destaques">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto}><Icone size={22} /><span>{texto}</span></li>
            ))}
          </ul>
        </div>

        <ul className="hero-recursos">
          {RECURSOS.map(({ icone: Icone, texto }) => (
            <li key={texto}><Icone size={22} strokeWidth={1.6} /><span>{texto}</span></li>
          ))}
        </ul>
      </section>

      <section className="login-lado">
        <div className="login-card">
          <Logo />

          <h2>{criando ? 'Crie sua conta' : 'Bem-vindo de volta!'}</h2>
          <p className="login-sub">{criando ? 'Comece agora a controlar o seu estoque.' : 'Faça login na sua conta para continuar.'}</p>

          <button type="button" className="botao-google" disabled={enviando} onClick={() => executar(() => entrarComGoogle(lembrar))}>
            <GoogleIcone /> Entrar com o Google
          </button>

          <div className="divisor"><span>ou</span></div>

          {mensagem && (
            <p className={`login-alerta ${mensagem.sucesso ? 'sucesso' : 'erro'}`} role="alert">{mensagem.texto}</p>
          )}

          <form onSubmit={handleSubmit}>
            {criando && (
              <label className="campo">
                <User size={18} />
                <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" maxLength={100} />
              </label>
            )}
            <label className="campo">
              <Mail size={18} />
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
            </label>
            <label className="campo">
              <Lock size={18} />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={criando ? 6 : undefined}
                autoComplete={criando ? 'new-password' : 'current-password'}
              />
              <button type="button" className="olho" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                {mostrarSenha ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </label>

            {!criando && (
              <div className="login-opcoes">
                <label className="lembrar">
                  <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                  Lembrar de mim
                </label>
                <button type="button" className="link" onClick={handleEsqueciSenha} disabled={enviando}>Esqueceu sua senha?</button>
              </div>
            )}

            <button type="submit" className="botao-entrar" disabled={enviando}>
              {enviando ? 'Aguarde...' : criando ? 'Criar conta' : 'Entrar'} {!enviando && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="login-alternar">
            {criando ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button type="button" className="link sublinhado" onClick={alternarModo}>{criando ? 'Entrar' : 'Criar conta'}</button>
          </p>

          <p className="login-seguranca"><ShieldCheck size={16} /> Seus dados estão protegidos e são criptografados.</p>
        </div>
      </section>
    </div>
  );
}
