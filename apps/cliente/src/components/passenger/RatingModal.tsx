import { useState, useEffect } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";

interface RatingModalProps {
  isOpen: boolean;
  driverName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function RatingModal({ isOpen, driverName, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/75 backdrop-blur-sm" data-purpose="rating-modal" onClick={onClose}>
      <div className="bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 text-center space-y-4 sm:space-y-5 lg:space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-amber-100 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
          <svg className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900">¡Carrera Finalizada!</h3>
          <p className="text-xs sm:text-sm lg:text-base text-slate-500">¿Cómo estuvo el servicio de {driverName}?</p>
        </div>

        {/* 5 Estrellas Interactivas */}
        <div className="flex justify-center gap-2 sm:gap-3 lg:gap-4 py-1">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              className={`text-2xl sm:text-3xl lg:text-4xl focus:outline-none transition transform hover:scale-125 ${val <= rating ? "text-amber-400" : "text-slate-300"}`}
              onClick={() => setRating(val)}
            >
              ★
            </button>
          ))}
        </div>

        {/* Reseña Opcional */}
        <textarea
          className="w-full text-xs sm:text-sm lg:text-base rounded-2xl border-slate-200 bg-slate-50 p-2.5 sm:p-3 lg:p-4 focus:ring-purple-600 focus:border-purple-600"
          placeholder="Comentario para el chofer (ej. Excelente trato y aire acondicionado frío)..."
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          className="w-full py-3.5 sm:py-4 lg:py-5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-xs sm:text-sm lg:text-base font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition"
          onClick={handleSubmit}
        >
          Enviar Calificación Directa
        </button>
      </div>
    </div>
  );
}
