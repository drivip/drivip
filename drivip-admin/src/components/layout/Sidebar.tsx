"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const navItems = [
  { id: "tenants", icon: "group", label: "Choferes" },
  { id: "plugins", icon: "layers", label: "Plugins" },
  { id: "b2b", icon: "storefront", label: "B2B" },
  { id: "banners", icon: "campaign", label: "Banners" },
  { id: "security", icon: "shield", label: "Security" },
  { id: "devops", icon: "database", label: "DevOps" },
  { id: "health", icon: "pulse_alert", label: "Health" },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-surface-container-low border-r border-outline-variant/30 transition-all duration-300",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-outline-variant/30",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-primary">
                route
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
              Drivip
            </span>
            <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-[family-name:var(--font-geist-mono)] text-[9px] font-bold">
              ADMIN
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary-container/15 text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-wide">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={cn("px-2 pb-3", collapsed && "px-1")}>
        <div
          className={cn(
            "p-3 rounded-lg bg-surface-container",
            collapsed && "px-2"
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[11px] font-bold text-primary">
                  SA
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface font-medium truncate">
                  SuperAdmin
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant truncate">
                  drivip.app
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[11px] font-bold text-primary">
                  SA
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
