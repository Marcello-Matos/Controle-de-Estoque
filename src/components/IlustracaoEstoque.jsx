const COS = 0.866;

// [posição no eixo direito, posição no eixo esquerdo, andar, etiqueta]
const PILHA = [
  [1, 1, 0, false],
  [1, 0, 0, true],
  [0, 1, 0, false],
  [0, 0, 0, true],
  [0, 1, 1, false],
  [0, 0, 1, true],
];

function pontos(lista) {
  return lista.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

// Caixa isométrica: (x, y) é o canto frontal inferior.
function Caixa({ x, y, largura, profundidade, altura, etiqueta = false }) {
  const R = [COS * largura, -0.5 * largura];
  const L = [-COS * profundidade, -0.5 * profundidade];
  const p = (dx, dy) => [x + dx, y + dy];
  const frente = p(0, 0);
  const direita = p(R[0], R[1]);
  const esquerda = p(L[0], L[1]);
  const fundo = p(R[0] + L[0], R[1] + L[1]);
  const sobe = ([a, b]) => [a, b - altura];

  return (
    <g>
      <polygon points={pontos([frente, esquerda, sobe(esquerda), sobe(frente)])} fill="url(#caixaEsquerda)" stroke="#2a2f6b" strokeWidth="1" />
      <polygon points={pontos([frente, direita, sobe(direita), sobe(frente)])} fill="url(#caixaDireita)" stroke="#2a2f6b" strokeWidth="1" />
      <polygon points={pontos([sobe(frente), sobe(direita), sobe(fundo), sobe(esquerda)])} fill="url(#caixaTopo)" stroke="#4b52b8" strokeWidth="1" />
      <line
        x1={sobe(frente)[0] + R[0] / 2} y1={sobe(frente)[1] + R[1] / 2}
        x2={sobe(esquerda)[0] + R[0] / 2} y2={sobe(esquerda)[1] + R[1] / 2}
        stroke="#3a3f8f" strokeWidth="6" opacity="0.6"
      />
      {etiqueta && (
        <g transform={`translate(${x + R[0] * 0.55}, ${y + R[1] * 0.55 - altura * 0.45}) skewY(-30)`}>
          <rect width={largura * 0.3} height={altura * 0.28} fill="#e8eaf6" rx="1" />
          {[0.15, 0.3, 0.4, 0.55, 0.65, 0.8].map((f) => (
            <rect key={f} x={largura * 0.3 * f} y={altura * 0.05} width="1.5" height={altura * 0.14} fill="#1a1d3a" />
          ))}
        </g>
      )}
    </g>
  );
}

export default function IlustracaoEstoque() {
  return (
    <svg className="ilustracao" viewBox="0 0 600 520" role="img" aria-label="Ilustração de caixas em um palete com um tablet lendo código de barras">
      <defs>
        <linearGradient id="caixaEsquerda" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2150" />
          <stop offset="1" stopColor="#0d0f26" />
        </linearGradient>
        <linearGradient id="caixaDireita" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2f6e" />
          <stop offset="1" stopColor="#14173a" />
        </linearGradient>
        <linearGradient id="caixaTopo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b41a0" />
          <stop offset="1" stopColor="#262a6b" />
        </linearGradient>
        <linearGradient id="anelNeon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="0.25" stopColor="#3b82f6" />
          <stop offset="0.7" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="tela" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101437" />
          <stop offset="1" stopColor="#070918" />
        </linearGradient>
        <radialGradient id="brilhoChao" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#4f46e5" stopOpacity="0.45" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <filter id="neon" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Prateleiras ao fundo */}
      <g opacity="0.35" stroke="#2b3170" strokeWidth="2" fill="none">
        {[60, 150, 240, 330].map((y) => <line key={y} x1="360" y1={y} x2="600" y2={y - 40} />)}
        <line x1="380" y1="40" x2="380" y2="360" />
        <line x1="590" y1="0" x2="590" y2="320" />
      </g>
      <g opacity="0.25">
        {[[400, 55], [460, 45], [520, 35], [400, 145], [470, 133], [540, 120], [410, 235], [490, 222]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y - 38} width="48" height="36" fill="#1a1f4d" stroke="#2f3680" />
        ))}
      </g>

      {/* Brilho do chão e anel neon */}
      <ellipse cx="290" cy="440" rx="260" ry="70" fill="url(#brilhoChao)" />
      <ellipse cx="290" cy="430" rx="250" ry="62" fill="none" stroke="url(#anelNeon)" strokeWidth="3" filter="url(#neon)" transform="rotate(-8 290 430)" />

      {/* Palete */}
      <Caixa x={290} y={470} largura={210} profundidade={210} altura={16} />

      {/* Pilha de caixas (grade isométrica, de trás para a frente) */}
      {PILHA.map(([i, j, k, etiqueta]) => (
        <Caixa
          key={`${i}${j}${k}`}
          x={290 + COS * 100 * (i - j)}
          y={449 - 50 * (i + j) - 78 * k}
          largura={100}
          profundidade={100}
          altura={78}
          etiqueta={etiqueta}
        />
      ))}

      {/* Tablet */}
      <g transform="translate(330 30) rotate(8)">
        <rect x="0" y="0" width="200" height="270" rx="18" fill="#0b0d22" stroke="#3b3f9a" strokeWidth="3" />
        <rect x="12" y="14" width="176" height="242" rx="10" fill="url(#tela)" />
        <rect x="30" y="38" width="140" height="80" rx="10" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
        {Array.from({ length: 26 }, (_, i) => (
          <rect key={i} x={42 + i * 4.6} y="52" width={i % 3 === 0 ? 3 : 1.6} height="52" fill="#dbe4ff" opacity="0.9" />
        ))}
        <line x1="22" y1="78" x2="178" y2="78" stroke="#60a5fa" strokeWidth="3" filter="url(#neon)" />
        <rect x="28" y="140" width="56" height="56" rx="8" fill="#161a45" stroke="#2f3580" />
        <rect x="40" y="156" width="32" height="22" rx="2" fill="#9aa4d6" opacity="0.7" />
        <text x="96" y="152" fill="#9aa3c7" fontSize="9">Produto</text>
        <text x="96" y="165" fill="#e2e6ff" fontSize="10" fontWeight="600">Notebook Pro</text>
        <text x="96" y="182" fill="#9aa3c7" fontSize="9">Estoque</text>
        <text x="96" y="195" fill="#e2e6ff" fontSize="10" fontWeight="600">48 unidades</text>
        <text x="96" y="212" fill="#9aa3c7" fontSize="9">Código</text>
        <text x="96" y="225" fill="#e2e6ff" fontSize="10" fontWeight="600">NB-001</text>
      </g>
    </svg>
  );
}
