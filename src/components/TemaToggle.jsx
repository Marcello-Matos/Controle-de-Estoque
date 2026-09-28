import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function TemaToggle({ className = 'botao-icone', comTexto = false }) {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'escuro');
  const proximo = tema === 'escuro' ? 'claro' : 'escuro';

  function alternar() {
    document.documentElement.dataset.tema = proximo;
    localStorage.setItem('tema', proximo);
    setTema(proximo);
  }

  const rotulo = `Modo ${proximo}`;
  const Icone = tema === 'escuro' ? Sun : Moon;
  return (
    <button type="button" className={className} onClick={alternar} aria-label={`Ativar modo ${proximo}`} title={`Ativar modo ${proximo}`}>
      <Icone size={comTexto ? 20 : 18} strokeWidth={1.8} />
      {comTexto && <span>{rotulo}</span>}
    </button>
  );
}
