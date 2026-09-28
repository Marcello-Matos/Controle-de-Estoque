import { useId } from 'react';

export const NOME_SISTEMA = 'StockPro';

export function LogoIcone({ className = 'logo-icone' }) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <polygon points="24,3 44,14 24,25 4,14" fill={`url(#${id}a)`} />
      <polygon points="4,14 24,25 24,46 4,35" fill={`url(#${id}b)`} />
      <polygon points="44,14 24,25 24,46 44,35" fill="#312e81" />
      <polygon points="14,19 24,24.5 24,34 14,28.5" fill="#a5b4fc" opacity="0.35" />
    </svg>
  );
}

export default function Logo({ className = 'login-marca' }) {
  return (
    <div className={className}>
      <LogoIcone />
      <div>
        <strong>{NOME_SISTEMA}</strong>
        <small>Controle de Estoque</small>
      </div>
    </div>
  );
}
