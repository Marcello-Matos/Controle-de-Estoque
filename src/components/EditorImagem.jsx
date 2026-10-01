import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { Check, X, ZoomIn } from 'lucide-react';
import { recortarImagem } from '../imagem';
import { mensagemErro } from '../utils';
import Mensagem from './Mensagem';

export default function EditorImagem({ imagem, onConfirmar, onCancelar }) {
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  async function confirmar() {
    if (!area) return;
    setProcessando(true);
    try {
      onConfirmar(await recortarImagem(imagem, area));
    } catch (e) {
      setMensagem({ texto: mensagemErro(e), sucesso: false });
      setProcessando(false);
    }
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-label="Ajustar imagem">
      <div className="modal card">
        <h3 className="modal-titulo">Ajustar imagem</h3>
        <Mensagem mensagem={mensagem} />
        <div className="editor-imagem">
          <Cropper
            image={imagem}
            crop={posicao}
            zoom={zoom}
            aspect={1}
            showGrid={false}
            onCropChange={setPosicao}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <label className="zoom-controle">
          <ZoomIn size={18} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
        </label>
        <div className="form-acoes">
          <button type="button" className="primary-btn" onClick={confirmar} disabled={processando || !area}>
            <Check size={18} /> {processando ? 'Processando...' : 'Aplicar recorte'}
          </button>
          <button type="button" className="secondary-btn" onClick={onCancelar} disabled={processando}>
            <X size={18} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
