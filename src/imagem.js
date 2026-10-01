import { ErroEstoque } from './services/estoque';

// A imagem do produto é salva como data URL JPEG direto no documento do Firestore
// (limite de 1 MB por documento). Recortamos em quadrado de 480px, o que mantém
// o arquivo na faixa de 40–150 KB.
export const TAMANHO_IMAGEM = 480;

// A foto do perfil aparece em tamanhos pequenos (avatar): recorte menor economiza espaço no documento.
export const TAMANHO_PERFIL = 256;

const LIMITE_ARQUIVO = 15 * 1024 * 1024;

export function lerArquivoImagem(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo?.type?.startsWith('image/')) {
      reject(new ErroEstoque('Escolha um arquivo de imagem (JPG, PNG, etc.).'));
      return;
    }
    if (arquivo.size > LIMITE_ARQUIVO) {
      reject(new ErroEstoque('Imagem muito grande. Escolha uma foto de até 15 MB.'));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new ErroEstoque('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ErroEstoque('Não foi possível carregar a imagem.'));
    img.src = src;
  });
}

// Recorta a área escolhida (coordenadas em pixels da imagem original) e devolve
// um data URL JPEG quadrado, pronto para salvar no documento.
export async function recortarImagem(src, area, tamanho = TAMANHO_IMAGEM) {
  const img = await carregarImagem(src);
  const canvas = document.createElement('canvas');
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tamanho, tamanho);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, tamanho, tamanho);
  return canvas.toDataURL('image/jpeg', 0.82);
}
