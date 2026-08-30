import { useState, useEffect } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageZoomProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
}

export default function ImageZoom({ src, alt = "صورة السؤال", className, style, imgClassName, imgStyle }: ImageZoomProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <div
        className={`relative inline-block cursor-zoom-in group ${className ?? ""}`}
        style={style}
        onClick={() => setOpen(true)}
        title="اضغط لتكبير الصورة"
      >
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          style={imgStyle}
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-black/50 rounded-full p-1.5">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          dir="rtl"
        >
          <button
            className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            onClick={() => setOpen(false)}
            data-testid="button-close-image-zoom"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="absolute top-4 right-4 text-white/50 text-xs">اضغط في أي مكان للإغلاق · Esc</p>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "90vh", maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
