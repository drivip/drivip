interface DriverRatingProps {
  rating: number;
  reviews?: number;
  size?: "xs" | "sm";
  showLabel?: boolean;
  className?: string;
}

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export default function DriverRating({
  rating,
  reviews = 0,
  size = "sm",
  showLabel = false,
  className = "",
}: DriverRatingProps) {
  const value = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const filled = Math.round(value);
  const starClass = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  const total = Math.max(0, reviews);

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`${value.toFixed(1)} de 5 estrellas, ${total} reseñas`}
    >
      <span className="flex items-center gap-px">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            className={`${starClass} ${index < filled ? "text-amber-400" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
      </span>
      {total > 0 ? (
        <span className={`font-bold text-slate-600 ${size === "xs" ? "text-[10px]" : "text-[11px]"}`}>
          {value.toFixed(1)}
          <span className="ml-0.5 font-semibold text-slate-400">
            ({total}{showLabel ? (total === 1 ? " reseña" : " reseñas") : ""})
          </span>
        </span>
      ) : (
        <span className={`font-semibold text-slate-400 ${size === "xs" ? "text-[10px]" : "text-[11px]"}`}>
          Sin reseñas
        </span>
      )}
    </span>
  );
}
