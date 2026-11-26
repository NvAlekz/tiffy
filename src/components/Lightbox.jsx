import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de la imagen"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-full border border-white/10 bg-black/50 text-slate-200 transition hover:bg-white/15 hover:text-white"
        aria-label="Cerrar vista previa"
      >
        <X size={15} />
      </button>

      <img
        src={image.dataUrl}
        alt="Vista previa de la imagen enviada"
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-black/60"
        draggable={false}
        onMouseDown={(event) => event.stopPropagation()}
      />

      <div className="pointer-events-none absolute bottom-2.5 rounded-full bg-black/50 px-2 py-1 text-[9.5px] tabular-nums text-slate-400 backdrop-blur">
        {image.width} × {image.height}
      </div>
    </div>
  );
}
