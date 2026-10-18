"use client";

import { useState, useMemo } from "react";
import { bannerData, bannerStats } from "@/mockData/bannerData";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

export default function BannerManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [banners, setBanners] = useState(bannerData);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const [newBanner, setNewBanner] = useState({
    title: "",
    description: "",
    target: "choferes",
    startDate: "",
    endDate: "",
  });

  const filterOptions = [
    { id: "all", label: "Todos", count: banners.length },
    { id: "active", label: "Activos", count: banners.filter((b) => b.status === "active").length },
    { id: "scheduled", label: "Programados", count: banners.filter((b) => b.status === "scheduled").length },
    { id: "inactive", label: "Inactivos", count: banners.filter((b) => b.status === "inactive").length },
  ];

  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && b.status === "active") ||
        (activeFilter === "scheduled" && b.status === "scheduled") ||
        (activeFilter === "inactive" && b.status === "inactive");
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.target.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter, banners]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />ACTIVO</span>;
      case "scheduled":
        return <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold">PROGRAMADO</span>;
      case "inactive":
        return <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold">INACTIVO</span>;
      default:
        return null;
    }
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case "choferes":
        return <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-[family-name:var(--font-geist-mono)] text-[9px]">Choferes</span>;
      case "clientes":
        return <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-[family-name:var(--font-geist-mono)] text-[9px]">Clientes</span>;
      case "comercios":
        return <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-[family-name:var(--font-geist-mono)] text-[9px]">Comercios</span>;
      case "todos":
        return <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-[family-name:var(--font-geist-mono)] text-[9px]">Todos</span>;
      default:
        return null;
    }
  };

  const getAccentColor = (color: string) => {
    switch (color) {
      case "primary": return "from-primary/40 to-primary/10";
      case "secondary": return "from-secondary/40 to-secondary/10";
      case "tertiary": return "from-tertiary/40 to-tertiary/10";
      default: return "from-primary/40 to-primary/10";
    }
  };

  const handleToggleStatus = (bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === bannerId
          ? { ...b, status: b.status === "active" ? "inactive" : "active" }
          : b
      )
    );
    const banner = banners.find((b) => b.id === bannerId);
    setToastMsg(banner?.status === "active" ? "Banner desactivado" : "Banner activado");
    setToastVisible(true);
  };

  const handleDelete = (bannerId: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    setToastMsg("Banner eliminado");
    setToastVisible(true);
  };

  const handleCreate = () => {
    if (!newBanner.title.trim()) {
      setToastMsg("El título es obligatorio");
      setToastVisible(true);
      return;
    }
    const banner = {
      id: `BNR-${String(banners.length + 1).padStart(3, "0")}`,
      title: newBanner.title,
      description: newBanner.description,
      imageUrl: null,
      color: "primary",
      target: newBanner.target,
      status: "active",
      startDate: newBanner.startDate || new Date().toISOString().split("T")[0],
      endDate: newBanner.endDate || "2025-12-31",
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setBanners((prev) => [banner, ...prev]);
    setShowCreateModal(false);
    setNewBanner({ title: "", description: "", target: "choferes", startDate: "", endDate: "" });
    setToastMsg("Banner creado exitosamente");
    setToastVisible(true);
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20 lg:pb-4">
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Centro de Publicidad
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          Banners & Publicidad Promocional
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Gestiona la publicidad que aparece en las aplicaciones PWA de choferes y clientes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-primary">campaign</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Banners</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">{bannerStats.totalBanners}</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary ml-1">{bannerStats.activeBanners} activos</span>
        </div>
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">touch_app</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">CTR</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">{bannerStats.ctr}%</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant ml-1">promedio</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Buscar banner por título o audiencia..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <FilterPills
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Banner Cards */}
      <div className="flex flex-col gap-3">
        {filteredBanners.map((banner) => (
          <div
            key={banner.id}
            className="bg-surface-container rounded-xl overflow-hidden shadow-md"
          >
            <div className={cn("h-1.5 w-full bg-gradient-to-r", getAccentColor(banner.color))} />
            <div className="p-4 space-y-3">
              {/* Preview */}
              <div className={cn("rounded-xl p-4 bg-gradient-to-r", getAccentColor(banner.color), "border border-outline-variant/20")}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(banner.status)}
                  {getTargetBadge(banner.target)}
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-[15px] text-on-surface font-semibold">
                  {banner.title}
                </h3>
                <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                  {banner.description}
                </p>
              </div>

              {/* Metrics & Dates */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2 bg-surface-container-high/50 rounded-lg">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">{banner.impressions.toLocaleString()}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">Impresiones</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-surface-container-high/50 rounded-lg">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">{banner.clicks.toLocaleString()}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">Clicks</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-surface-container-high/50 rounded-lg">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">
                    {banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(1) : "0"}%
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">CTR</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant">
                  {banner.startDate} → {banner.endDate}
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-outline">
                  Creado: {banner.createdAt}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={banner.status === "active"}
                  onChange={() => handleToggleStatus(banner.id)}
                />
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setEditingBanner(banner);
                    setToastMsg(`Editando: ${banner.title}`);
                    setToastVisible(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  className="w-10 h-10 !px-0"
                  onClick={() => handleDelete(banner.id)}
                >
                  <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Banner CTA */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full mt-2 py-4 px-4 rounded-xl bg-surface-container/50 hover:bg-surface-container border-2 border-dashed border-primary/40 hover:border-primary text-primary flex items-center justify-center gap-2 group transition-all"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">add_circle</span>
        <span className="font-[family-name:var(--font-geist-mono)] text-[13px] font-semibold tracking-wide">
          + Crear Nuevo Banner
        </span>
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-container rounded-2xl shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">campaign</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-[17px] text-on-surface font-semibold">Crear Banner</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Título</label>
                <input
                  className="w-full bg-surface-container-low text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none mt-1"
                  placeholder="Ej: Promo Black Friday 30% OFF"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Descripción</label>
                <textarea
                  className="w-full bg-surface-container-low text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none mt-1 resize-none"
                  rows={3}
                  placeholder="Describe tu promoción..."
                  value={newBanner.description}
                  onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Audiencia</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {["choferes", "clientes", "comercios", "todos"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewBanner({ ...newBanner, target: t })}
                      className={cn(
                        "py-2 px-2 rounded-lg border text-[10px] font-[family-name:var(--font-geist-mono)] uppercase transition-all",
                        newBanner.target === t
                          ? "border-primary bg-primary-container/10 text-primary font-semibold"
                          : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Inicio</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-low text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none mt-1"
                    value={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Fin</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-low text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none mt-1"
                    value={newBanner.endDate}
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1 shadow-[0_0_16px_rgba(124,58,237,0.4)]" onClick={handleCreate}>
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Crear Banner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
