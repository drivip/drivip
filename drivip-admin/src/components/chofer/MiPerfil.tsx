"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { choferProfile } from "@/mockData/choferData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

export default function MiPerfil() {
  const [profile, setProfile] = useState({
    name: choferProfile.name,
    email: choferProfile.email,
    phone: choferProfile.phone,
    city: choferProfile.city,
    address: choferProfile.address,
  });

  const [vehicle, setVehicle] = useState({
    type: choferProfile.vehicle.type,
    plate: choferProfile.vehicle.plate,
    model: choferProfile.vehicle.model,
    year: choferProfile.vehicle.year,
    color: choferProfile.vehicle.color,
  });

  const [toast, setToast] = useState<{
    message: string;
    variant?: "success" | "error" | "info";
  } | null>(null);

  const slug = choferProfile.slug;
  const pageUrl = `drivip.app/${slug}`;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const showToast = (
    message: string,
    variant: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, variant });
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${pageUrl}`);
      showToast("URL copiada al portapapeles", "success");
    } catch {
      showToast("Error al copiar URL", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Mira mi página de conductor en Drivip: https://${pageUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - Drivip`,
          text: `Página de conductor de ${profile.name}`,
          url: `https://${pageUrl}`,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleSave = () => {
    showToast("Cambios guardados correctamente", "success");
  };

  const inputClasses =
    "bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface w-full";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#0c1324] text-white p-4 md:p-6 space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          visible={!!toast}
          variant={toast.variant}
          icon={
            toast.variant === "success"
              ? "check_circle"
              : toast.variant === "error"
                ? "error"
                : "info"
          }
          onDismiss={() => setToast(null)}
        />
      )}

      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-space-grotesk)] font-bold">
          Mi Perfil
        </h1>
        <Button
          variant="primary"
          className="font-[family-name:var(--font-geist-sans)]"
          onClick={handleSave}
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Guardar Cambios
        </Button>
      </header>

      {/* Profile Card */}
      <section className="bg-surface-container rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center shrink-0">
          <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-primary">
            {getInitials(profile.name)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-space-grotesk)] font-semibold truncate">
            {profile.name}
          </p>
          <p className="text-xs text-outline font-[family-name:var(--font-geist-mono)]">
            {pageUrl}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={choferProfile.isOnline ? "active" : "offline"}>
            {choferProfile.isOnline ? "En línea" : "Offline"}
          </Badge>
        </div>
      </section>

      {/* Mi Página */}
      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Mi Página
        </h2>
        <div className="bg-surface-container rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-[16px] text-outline">
              link
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface truncate">
              {pageUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleCopyUrl}
            >
              <span className="material-symbols-outlined text-[14px]">
                content_copy
              </span>
              Copiar URL
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleShareWhatsApp}
            >
              <span className="material-symbols-outlined text-[14px]">
                chat
              </span>
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleShare}
            >
              <span className="material-symbols-outlined text-[14px]">
                share
              </span>
              Compartir
            </Button>
          </div>
        </div>
      </section>

      {/* Datos Personales */}
      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Datos Personales
        </h2>
        <div className="bg-surface-container rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Cédula
            </label>
            <div className="relative">
              <input
                type="text"
                value={choferProfile.rif}
                disabled
                className={cn(inputClasses, disabledClasses, "pr-16")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-geist-mono)] text-secondary">
                verificado
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, phone: e.target.value }))
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Ciudad
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, city: e.target.value }))
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, address: e.target.value }))
              }
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* Mi Vehículo */}
      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Mi Vehículo
        </h2>
        <div className="bg-surface-container rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
                Tipo
              </label>
              <select
                value={vehicle.type}
                onChange={(e) =>
                  setVehicle((prev) => ({
                    ...prev,
                    type: e.target.value as "auto" | "moto",
                  }))
                }
                className={cn(inputClasses, "appearance-none")}
              >
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
                Placa
              </label>
              <input
                type="text"
                value={vehicle.plate}
                onChange={(e) =>
                  setVehicle((prev) => ({ ...prev, plate: e.target.value }))
                }
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={vehicle.model}
                onChange={(e) =>
                  setVehicle((prev) => ({ ...prev, model: e.target.value }))
                }
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
                Año
              </label>
              <input
                type="number"
                value={vehicle.year}
                onChange={(e) =>
                  setVehicle((prev) => ({
                    ...prev,
                    year: Number(e.target.value),
                  }))
                }
                className={inputClasses}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-[family-name:var(--font-geist-mono)] text-outline mb-1">
                Color
              </label>
              <input
                type="text"
                value={vehicle.color}
                onChange={(e) =>
                  setVehicle((prev) => ({ ...prev, color: e.target.value }))
                }
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm">
              <span className="material-symbols-outlined text-[14px]">
                upload
              </span>
              Subir foto del vehículo
            </Button>
          </div>
        </div>
      </section>

      {/* Foto de Perfil */}
      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Foto de Perfil
        </h2>
        <div className="bg-surface-container rounded-xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center shrink-0">
            <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-primary">
              {getInitials(profile.name)}
            </span>
          </div>
          <div className="min-w-0 space-y-1">
            <Button variant="secondary" size="sm">
              <span className="material-symbols-outlined text-[14px]">
                photo_camera
              </span>
              Cambiar foto
            </Button>
            <p className="text-[11px] text-outline font-[family-name:var(--font-geist-sans)]">
              La foto se muestra en el mapa para los pasajeros
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
