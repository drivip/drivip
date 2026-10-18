"use client";

import { cn } from "@/lib/utils";

type BottomNavProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const navItems = [
  { id: "tenants", icon: "group", label: "Choferes" },
  { id: "plugins", icon: "layers", label: "Plugins" },
  { id: "b2b", icon: "storefront", label: "B2B" },
  { id: "banners", icon: "campaign", label: "Banners" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-4 items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-12 rounded transition-colors",
                isActive
                  ? "text-primary bg-primary-container/15 font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-tight truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
