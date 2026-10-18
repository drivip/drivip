"use client";

import SearchInput from "@/components/ui/SearchInput";

type HeaderProps = {
  activeTab: string;
  onSearch?: (query: string) => void;
};

const tabTitles: Record<string, string> = {
  tenants: "Dashboard Drivip",
  plugins: "Catalogo de Plugins & Add-ons",
  b2b: "Plugin Delivery Comercios",
  banners: "Banners & Publicidad",
  security: "Seguridad & Credenciales",
  devops: "DevOps & Respaldos",
  health: "Monitoreo del Sistema",
};

export default function Header({ activeTab, onSearch }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[18px] font-semibold text-on-surface hidden sm:block">
          {tabTitles[activeTab] || "Dashboard"}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="Buscar chofer, plugin..."
          className="w-64 hidden md:block"
          onChange={onSearch}
        />
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors">
            notifications
          </span>
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center cursor-pointer">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[11px] font-bold text-primary">
              SA
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
