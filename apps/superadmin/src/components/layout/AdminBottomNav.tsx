import { cn } from "@drivip/ui";
import type { AdminModule } from "./AdminSidebar";

interface AdminBottomNavProps {
  activeModule: AdminModule;
  onNavigate: (module: AdminModule) => void;
}

const BOTTOM_ITEMS: { id: AdminModule; icon: string; label: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "Inicio" },
  { id: "tenants", icon: "business", label: "Tenants" },
  { id: "clientes", icon: "group", label: "Clientes" },
  { id: "suscripciones", icon: "payments", label: "Pagos" },
  { id: "reportes", icon: "analytics", label: "Reportes" },
];

export default function AdminBottomNav({ activeModule, onNavigate }: AdminBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all active:scale-95",
                isActive ? "text-red-600" : "text-slate-500"
              )}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={cn("text-[10px] font-semibold", isActive && "font-bold")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
