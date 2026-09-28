export default function PaginaTopo({ titulo, subtitulo, children }) {
  return (
    <div className="pagina-topo">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}
