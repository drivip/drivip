"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  lineaDrivers,
  lineaRideRequests,
} from "@/mockData/lineaData";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
});

const STATUS_COLORS: Record<string, string> = {
  ONLINE: "#4edea3",
  OCUPADO: "#f59e0b",
  EN_RUTA: "#7c3aed",
  OFFLINE: "#64748b",
};

const LEGEND = [
  { label: "Online", color: "bg-secondary" },
  { label: "Ocupado", color: "bg-amber-500" },
  { label: "En Ruta", color: "bg-primary" },
  { label: "Offline", color: "bg-slate-500" },
];

export default function MapaFlota() {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const markers = [
    ...lineaDrivers.map((d) => ({
      id: d.id,
      lat: d.lat,
      lng: d.lng,
      color: STATUS_COLORS[d.status],
      label: d.name,
      icon: d.vehicle.type === "moto" ? "🏍" : "🚗",
    })),
    ...lineaRideRequests.map((r) => ({
      id: `req-${r.id}`,
      lat: r.originLat,
      lng: r.originLng,
      color: "#ef4444",
      label: r.clientName,
      icon: "📍",
    })),
  ];

  const selectedDriver = lineaDrivers.find((d) => d.id === selectedDriverId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-on-surface">
        Mapa de Flota
      </h1>

      <div className="bg-surface-container rounded-xl p-4">
        <MapView
          center={[10.4806, -66.9036]}
          zoom={13}
          className="h-[500px] w-full"
          markers={markers}
          onMarkerClick={(id) => {
            if (id.startsWith("req-")) return;
            setSelectedDriverId(id);
          }}
        />

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-full", item.color)} />
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
                {item.label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Solicitud
            </span>
          </div>
        </div>
      </div>

      <Modal open={!!selectedDriver} onClose={() => setSelectedDriverId(null)}>
        {selectedDriver && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-tertiary/15 flex items-center justify-center">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[18px] font-bold text-tertiary">
                  {selectedDriver.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
                  {selectedDriver.name}
                </p>
                <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant">
                  {selectedDriver.vehicle.model} — {selectedDriver.vehicle.plate}
                </p>
              </div>
            </div>
            <Badge
              variant={
                selectedDriver.status === "ONLINE"
                  ? "active"
                  : selectedDriver.status === "OFFLINE"
                    ? "offline"
                    : "warning"
              }
              className="w-fit"
            >
              {selectedDriver.status.replace("_", " ")}
            </Badge>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-high rounded-lg p-2.5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
                  ★ {selectedDriver.rating}
                </p>
                <p className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">
                  Rating
                </p>
              </div>
              <div className="bg-surface-container-high rounded-lg p-2.5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
                  {selectedDriver.todayTrips}
                </p>
                <p className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">
                  Hoy
                </p>
              </div>
              <div className="bg-surface-container-high rounded-lg p-2.5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
                  {selectedDriver.totalTrips.toLocaleString()}
                </p>
                <p className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">
                  Total
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <span className="material-symbols-outlined text-[16px]">call</span>
                Llamar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
