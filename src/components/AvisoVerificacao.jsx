import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mensagemErro } from '../utils';

// Contas de e-mail/senha precisam confirmar o e-mail para acessar estoques compartilhados.
export default function AvisoVerificacao() {
  const { usuario, reenviarVerificacao, confirmarVerificacao } = useAuth();
  const [texto, setTexto] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (usuario.emailVerificado) return null;

  async function executar(acao) {
    setOcupado(true);
    try {
      setTexto(await acao());
    } catch (e) {
      setTexto(e?.code === 'auth/too-many-requests' ? 'Aguarde alguns minutos antes de reenviar.' : mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="aviso">
      <MailCheck size={20} />
      <div>
        <strong>Confirme seu e-mail</strong>
        <p>
          Enviamos um link para <b>{usuario.email}</b>. Confirme para poder acessar estoques que outras pessoas
          compartilharem com você.
        </p>
        {texto && <p className="aviso-status">{texto}</p>}
        <div className="aviso-acoes">
          <button
            type="button"
            className="secondary-btn"
            disabled={ocupado}
            onClick={() => executar(async () => (await confirmarVerificacao()) ? 'E-mail confirmado!' : 'Ainda não confirmado. Clique no link do e-mail e tente de novo.')}
          >
            Já confirmei
          </button>
          <button
            type="button"
            className="link-botao"
            disabled={ocupado}
            onClick={() => executar(async () => { await reenviarVerificacao(); return 'E-mail reenviado. Confira também a caixa de spam.'; })}
          >
            Reenviar e-mail
          </button>
        </div>
      </div>
    </div>
  );
}
