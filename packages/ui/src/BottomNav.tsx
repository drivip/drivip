import { cn } from "./utils";

export interface BottomNavItem {
  id: string;
  icon: string;
  label: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}

export default function BottomNav({
  items,
  activeId,
  onNavigate,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div className="flex justify-around items-center h-16 px-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors",
                isActive
                  ? "text-secondary font-semibold"
                  : "text-on-surface-variant"
              )}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[12px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
