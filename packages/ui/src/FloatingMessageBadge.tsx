import { cn } from "./utils";

interface FloatingMessageBadgeProps {
  title: string;
  message: string;
  time?: string;
  count?: number;
  onOpen: () => void;
  onHide: () => void;
  accent?: "purple" | "emerald";
  className?: string;
}

export default function FloatingMessageBadge({
  title,
  message,
  time,
  count = 1,
  onOpen,
  onHide,
  accent = "purple",
  className,
}: FloatingMessageBadgeProps) {
  const accentClasses =
    accent === "emerald"
      ? "from-emerald-500 to-teal-600"
      : "from-purple-600 to-indigo-700";

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[150] w-[min(21rem,calc(100vw-1.5rem))] sm:right-5",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_18px_45px_-12px_rgba(15,23,42,0.45)]">
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b",
            accentClasses
          )}
        />

        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-start gap-2.5 p-3 pl-3.5 pr-10 text-left transition active:scale-[0.99]"
        >
          <span
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              accentClasses
            )}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            {count > 1 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[8px] font-black text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-black text-slate-900">
                {title}
              </span>
              {time && (
                <span className="shrink-0 text-[9px] font-semibold text-slate-400">
                  {time}
                </span>
              )}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] font-medium leading-snug text-slate-600">
              {message}
            </span>
            <span className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-purple-600">
              <span className="material-symbols-outlined text-[13px]">
                open_in_new
              </span>
              Toca para abrir
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onHide}
          aria-label="Ocultar mensaje"
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition active:scale-90"
        >
          <span className="material-symbols-outlined text-[15px]">close</span>
        </button>
      </div>
    </aside>
  );
}
