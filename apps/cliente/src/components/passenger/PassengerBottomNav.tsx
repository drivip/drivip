import type { PassengerScreen } from "../../types/passenger";
import NavGlyph from "./NavGlyph";

interface PassengerBottomNavProps {
  screen: PassengerScreen;
  onNavigate: (id: string) => void;
  onRequestRide: () => void;
}

const ITEMS = [
  { id: "home", label: "En Vivo", icon: "map" },
  { id: "drivers", label: "Choferes", icon: "people" },
  { id: "center", label: "", icon: "plus" },
  { id: "history", label: "Historial", icon: "history" },
  { id: "menu", label: "Menú", icon: "menu" },
] as const;

export default function PassengerBottomNav({ screen, onNavigate, onRequestRide }: PassengerBottomNavProps) {
  return (
    <nav
      data-purpose="bottom-navigation"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-3xl -translate-x-1/2 border-t border-slate-200/80 bg-white/95 backdrop-blur-lg lg:hidden"
    >
      <div className="relative mx-auto flex items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <button
          aria-label="Pedir un viaje"
          className="absolute left-1/2 top-0 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#f4f6f8] bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white shadow-[0_10px_24px_-6px_rgba(107,33,168,0.65)] transition-transform active:scale-90"
          onClick={onRequestRide}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.6" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {ITEMS.map((item) => {
          if (item.id === "center") {
            return <div key={item.id} className="min-w-0 flex-1" aria-hidden="true" />;
          }

          const isActive = item.id === screen;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] ${isActive ? "font-bold text-purple-700" : "font-semibold text-slate-500"}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${isActive ? "bg-purple-50" : ""}`}>
                <NavGlyph icon={item.icon} />
              </span>
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
